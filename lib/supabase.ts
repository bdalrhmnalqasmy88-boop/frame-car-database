import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export type CarFrame = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  width_cm: number | null;
  height_cm: number | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CarFrameInput = Omit<CarFrame, 'id' | 'created_at' | 'updated_at'>;
