import { Platform } from 'react-native';
import { supabase, type CarFrame, type CarFrameInput } from './supabase';
import {
  localGetAllCars,
  localGetCar,
  localUpsertCar,
  localDeleteCar,
  localReplaceAllCars,
  localSaveImage,
  localGetImage,
  localDeleteImage,
  localGetPendingOps,
  localAddPendingOp,
  localRemovePendingOp,
  localGetPendingOp,
  type PendingOperation,
} from './localStorage';
import { uriToBase64, base64ToDataUri, isHttpUrl } from './imageUtils';

export type FetchResult = {
  cars: CarFrame[];
  fromCache: boolean;
};

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
}

async function syncWithServer(): Promise<void> {
  if (!supabase) return;

  const ops = await localGetPendingOps();
  for (const op of ops) {
    try {
      if (op.type === 'create') {
        const input = op.data as CarFrameInput;
        const { data, error } = await supabase.from('car_frames').insert(input).select().single();
        if (!error && data) {
          const remote = data as CarFrame;
          await localDeleteCar(op.carId);
          await localDeleteImage(op.carId);
          await localUpsertCar(remote);
          if (op.imageBase64) {
            const fileName = `frame_${remote.id}.jpg`;
            const remoteUrl = await uploadToSupabase(op.imageBase64, fileName);
            if (remoteUrl) {
              await supabase.from('car_frames').update({ image_url: remoteUrl }).eq('id', remote.id);
              await localUpsertCar({ ...remote, image_url: remoteUrl });
            }
          }
        }
      } else if (op.type === 'update') {
        const { error } = await supabase
          .from('car_frames')
          .update({ ...(op.data as Partial<CarFrameInput>), updated_at: new Date().toISOString() })
          .eq('id', op.carId);
        if (!error && op.imageBase64) {
          const fileName = `frame_${op.carId}.jpg`;
          const remoteUrl = await uploadToSupabase(op.imageBase64, fileName);
          if (remoteUrl) {
            await supabase.from('car_frames').update({ image_url: remoteUrl }).eq('id', op.carId);
          }
        }
      } else if (op.type === 'delete') {
        await supabase.from('car_frames').delete().eq('id', op.carId);
      }
      await localRemovePendingOp(op.id);
    } catch (e) {
      break;
    }
  }
}

async function uploadToSupabase(base64: string, fileName: string): Promise<string | null> {
  if (!supabase) return null;

  try {
    const isDataUri = base64.startsWith('data:');
    const response = isDataUri ? await fetch(base64) : null;
    const blob = response ? await response.blob() : null;
    if (!blob) return null;

    const { data, error } = await supabase.storage.from('car-frames').upload(fileName, blob, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('car-frames').getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    console.warn('Supabase upload failed:', e);
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────

export async function fetchAllCars(): Promise<FetchResult> {
  if (!supabase) {
    const localCars = await getLocalCarsWithImages();
    return { cars: localCars, fromCache: false };
  }

  try {
    await syncWithServer();
    const { data, error } = await supabase
      .from('car_frames')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const remoteCars = (data || []) as CarFrame[];
    await localReplaceAllCars(remoteCars);

    const localCars = await localGetAllCars();
    const pendingOps = await localGetPendingOps();
    const pendingCarIds = new Set(pendingOps.map(o => o.carId));

    const merged: CarFrame[] = [];
    for (const car of localCars) {
      if (pendingCarIds.has(car.id)) {
        const img = await localGetImage(car.id);
        merged.push({ ...car, image_url: img ? base64ToDataUri(img) : car.image_url });
      } else {
        merged.push(car);
      }
    }
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { cars: merged, fromCache: false };
  } catch (e) {
    const localCars = await getLocalCarsWithImages();
    return { cars: localCars, fromCache: true };
  }
}

async function getLocalCarsWithImages(): Promise<CarFrame[]> {
  const localCars = await localGetAllCars();
  const merged: CarFrame[] = [];
  for (const car of localCars) {
    const img = await localGetImage(car.id);
    merged.push({ ...car, image_url: img ? base64ToDataUri(img) : car.image_url });
  }
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return merged;
}

export async function searchCars(query: string): Promise<FetchResult> {
  const { cars, fromCache } = await fetchAllCars();
  if (!query.trim()) return { cars, fromCache };

  const q = query.toLowerCase();
  const filtered = cars.filter(
    (c) =>
      c.make.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      (c.year != null && c.year.toString().includes(q))
  );
  return { cars: filtered, fromCache };
}

export async function getCarById(id: string): Promise<CarFrame | null> {
  const car = await localGetCar(id);
  if (car) {
    const img = await localGetImage(id);
    return { ...car, image_url: img ? base64ToDataUri(img) : car.image_url };
  }

  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('car_frames')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const remote = data as CarFrame;
      await localUpsertCar(remote);
      return remote;
    }
  } catch (e) {
    // offline - return null
  }
  return null;
}

export async function createCar(
  input: CarFrameInput,
  imageUri?: string | null
): Promise<CarFrame> {
  const id = generateId();
  const now = new Date().toISOString();

  let imageBase64: string | null = null;
  if (imageUri) {
    imageBase64 = await uriToBase64(imageUri);
  }

  const car: CarFrame = {
    ...input,
    id,
    image_url: imageBase64 ? base64ToDataUri(imageBase64) : null,
    created_at: now,
    updated_at: now,
  };

  await localUpsertCar(car);
  if (imageBase64) {
    await localSaveImage(id, imageBase64);
  }

  const op: PendingOperation = {
    id: generateId(),
    carId: id,
    type: 'create',
    data: { ...input, image_url: null },
    imageBase64,
    createdAt: Date.now(),
  };
  await localAddPendingOp(op);

  try {
    await syncWithServer();
  } catch (e) {
    // will sync next time
  }

  return car;
}

export async function updateCar(
  id: string,
  input: Partial<CarFrameInput>,
  newImageUri?: string | null
): Promise<CarFrame | null> {
  const existing = await localGetCar(id);
  if (!existing) return null;

  let imageBase64: string | null = null;
  if (newImageUri) {
    imageBase64 = await uriToBase64(newImageUri);
    if (imageBase64) {
      await localSaveImage(id, imageBase64);
    }
  }

  const updated: CarFrame = {
    ...existing,
    ...input,
    image_url: imageBase64 ? base64ToDataUri(imageBase64) : input.image_url !== undefined ? input.image_url : existing.image_url,
    updated_at: new Date().toISOString(),
  };

  await localUpsertCar(updated);

  const pending = await localGetPendingOp(id);
  const op: PendingOperation = {
    id: pending?.id || generateId(),
    carId: id,
    type: pending?.type === 'create' ? 'create' : 'update',
    data: { ...input, image_url: null },
    imageBase64,
    createdAt: Date.now(),
  };

  if (pending) {
    await localRemovePendingOp(pending.id);
  }
  await localAddPendingOp(op);

  try {
    await syncWithServer();
  } catch (e) {
    // will sync next time
  }

  return updated;
}

export async function deleteCar(id: string): Promise<void> {
  await localDeleteCar(id);
  await localDeleteImage(id);

  const pending = await localGetPendingOp(id);
  if (pending) {
    await localRemovePendingOp(pending.id);
  }

  const op: PendingOperation = {
    id: generateId(),
    carId: id,
    type: 'delete',
    createdAt: Date.now(),
  };
  await localAddPendingOp(op);

  try {
    await syncWithServer();
  } catch (e) {
    // will sync next time
  }
}

export async function uploadFrameImage(uri: string, fileName: string): Promise<string | null> {
  const base64 = await uriToBase64(uri);
  if (base64) return base64ToDataUri(base64);
  return null;
}

export async function getPendingOpsCount(): Promise<number> {
  const ops = await localGetPendingOps();
  return ops.length;
}
