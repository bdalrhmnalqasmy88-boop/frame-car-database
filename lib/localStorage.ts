import { Platform } from 'react-native';
import type { CarFrame } from './supabase';

export type PendingOperation = {
  id: string;
  carId: string;
  type: 'create' | 'update' | 'delete';
  data?: Partial<CarFrame>;
  imageBase64?: string | null;
  createdAt: number;
};

const DB_NAME = 'frame_db';
const DB_VERSION = 1;
const STORE_CARS = 'cars';
const STORE_IMAGES = 'images';
const STORE_PENDING = 'pending_ops';
const LS_CARS_KEY = 'frame_cars';
const LS_PENDING_KEY = 'frame_pending_ops';
const LS_IMAGES_KEY = 'frame_images';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openIndexedDB(): Promise<IDBDatabase | null> {
  if (Platform.OS !== 'web' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CARS)) {
        db.createObjectStore(STORE_CARS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES);
      }
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  return dbPromise;
}

function idbGet<T>(store: string, key: IDBValidKey): Promise<T | null> {
  return openIndexedDB().then((db) => {
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result as T | null);
      req.onerror = () => resolve(null);
    });
  });
}

function idbGetAll<T>(store: string): Promise<T[]> {
  return openIndexedDB().then((db) => {
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve([]);
    });
  });
}

function idbPut<T>(store: string, value: T, key?: IDBValidKey): Promise<void> {
  return openIndexedDB().then((db) => {
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      if (key !== undefined) {
        tx.objectStore(store).put(value, key);
      } else {
        tx.objectStore(store).put(value);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  });
}

function idbDelete(store: string, key: IDBValidKey): Promise<void> {
  return openIndexedDB().then((db) => {
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  });
}

function idbClear(store: string): Promise<void> {
  return openIndexedDB().then((db) => {
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  });
}

const AsyncStorage = Platform.OS !== 'web'
  ? require('@react-native-async-storage/async-storage').default
  : null;

function lsGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return Promise.resolve(localStorage.getItem(key));
  }
  if (AsyncStorage) return AsyncStorage.getItem(key);
  return Promise.resolve(null);
}

function lsSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return Promise.resolve();
  }
  if (AsyncStorage) return AsyncStorage.setItem(key, value);
  return Promise.resolve();
}

function lsRemove(key: string): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return Promise.resolve();
  }
  if (AsyncStorage) return AsyncStorage.removeItem(key);
  return Promise.resolve();
}

// ─── Public API ────────────────────────────────────────────

export async function localGetAllCars(): Promise<CarFrame[]> {
  const db = await openIndexedDB();
  if (db) {
    return idbGetAll<CarFrame>(STORE_CARS);
  }
  const raw = await lsGet(LS_CARS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as CarFrame[]; } catch { return []; }
}

export async function localGetCar(id: string): Promise<CarFrame | null> {
  const db = await openIndexedDB();
  if (db) {
    return idbGet<CarFrame>(STORE_CARS, id);
  }
  const cars = await localGetAllCars();
  return cars.find(c => c.id === id) || null;
}

export async function localUpsertCar(car: CarFrame): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await idbPut(STORE_CARS, car);
  } else {
    const cars = await localGetAllCars();
    const idx = cars.findIndex(c => c.id === car.id);
    if (idx >= 0) cars[idx] = car; else cars.unshift(car);
    await lsSet(LS_CARS_KEY, JSON.stringify(cars));
  }
}

export async function localDeleteCar(id: string): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await idbDelete(STORE_CARS, id);
    await idbDelete(STORE_IMAGES, id);
  } else {
    const cars = await localGetAllCars();
    const filtered = cars.filter(c => c.id !== id);
    await lsSet(LS_CARS_KEY, JSON.stringify(filtered));
  }
}

export async function localClearCars(): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await idbClear(STORE_CARS);
  } else {
    await lsRemove(LS_CARS_KEY);
  }
}

export async function localReplaceAllCars(cars: CarFrame[]): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await idbClear(STORE_CARS);
    for (const c of cars) {
      await idbPut(STORE_CARS, c);
    }
  } else {
    await lsSet(LS_CARS_KEY, JSON.stringify(cars));
  }
}

export async function localSaveImage(carId: string, base64: string): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await idbPut(STORE_IMAGES, base64, carId);
  } else {
    const raw = await lsGet(LS_IMAGES_KEY);
    const images: Record<string, string> = raw ? JSON.parse(raw) : {};
    images[carId] = base64;
    await lsSet(LS_IMAGES_KEY, JSON.stringify(images));
  }
}

export async function localGetImage(carId: string): Promise<string | null> {
  const db = await openIndexedDB();
  if (db) {
    return idbGet<string>(STORE_IMAGES, carId);
  }
  const raw = await lsGet(LS_IMAGES_KEY);
  if (!raw) return null;
  const images: Record<string, string> = JSON.parse(raw);
  return images[carId] || null;
}

export async function localDeleteImage(carId: string): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await idbDelete(STORE_IMAGES, carId);
  } else {
    const raw = await lsGet(LS_IMAGES_KEY);
    if (!raw) return;
    const images: Record<string, string> = JSON.parse(raw);
    delete images[carId];
    await lsSet(LS_IMAGES_KEY, JSON.stringify(images));
  }
}

export async function localGetPendingOps(): Promise<PendingOperation[]> {
  const db = await openIndexedDB();
  if (db) {
    return idbGetAll<PendingOperation>(STORE_PENDING);
  }
  const raw = await lsGet(LS_PENDING_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as PendingOperation[]; } catch { return []; }
}

export async function localAddPendingOp(op: PendingOperation): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await idbPut(STORE_PENDING, op);
  } else {
    const ops = await localGetPendingOps();
    ops.push(op);
    await lsSet(LS_PENDING_KEY, JSON.stringify(ops));
  }
}

export async function localRemovePendingOp(opId: string): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await idbDelete(STORE_PENDING, opId);
  } else {
    const ops = await localGetPendingOps();
    const filtered = ops.filter(o => o.id !== opId);
    await lsSet(LS_PENDING_KEY, JSON.stringify(filtered));
  }
}

export async function localGetPendingOp(carId: string): Promise<PendingOperation | null> {
  const ops = await localGetPendingOps();
  return ops.find(o => o.carId === carId && o.type !== 'delete') || null;
}
