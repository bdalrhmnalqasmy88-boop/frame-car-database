/*
# Create car_frames table and storage bucket (single-tenant, no auth)

1. New Tables
- `car_frames`
  - `id` (uuid, primary key)
  - `make` (text, not null) — car brand, e.g. "Toyota"
  - `model` (text, not null) — car model, e.g. "Hilux"
  - `year` (integer) — manufacture year
  - `width_cm` (numeric) — total frame width in centimeters
  - `height_cm` (numeric) — total frame height in centimeters
  - `image_url` (text) — URL to the frame reference image in Supabase Storage
  - `notes` (text) — notes about curves, edges, or special details
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Indexes
- Index on `make` for fast brand searches
- Index on `model` for fast model searches
- Index on `year` for fast year searches

3. Storage
- Create a public storage bucket `car-frames` for frame reference images
- Public read, authenticated write policies

4. Security
- Enable RLS on `car_frames`.
- Allow anon + authenticated full CRUD (single-tenant, no sign-in).
- Storage bucket policies for public read and authenticated write.
*/

CREATE TABLE IF NOT EXISTS car_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  width_cm numeric(10,2),
  height_cm numeric(10,2),
  image_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_car_frames_make ON car_frames(make);
CREATE INDEX IF NOT EXISTS idx_car_frames_model ON car_frames(model);
CREATE INDEX IF NOT EXISTS idx_car_frames_year ON car_frames(year);

ALTER TABLE car_frames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_car_frames" ON car_frames;
CREATE POLICY "anon_select_car_frames" ON car_frames FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_car_frames" ON car_frames;
CREATE POLICY "anon_insert_car_frames" ON car_frames FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_car_frames" ON car_frames;
CREATE POLICY "anon_update_car_frames" ON car_frames FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_car_frames" ON car_frames;
CREATE POLICY "anon_delete_car_frames" ON car_frames FOR DELETE
  TO anon, authenticated USING (true);

-- Create storage bucket for frame images
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-frames', 'car-frames', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated write
DROP POLICY IF EXISTS "public_read_car_frames" ON storage.objects;
CREATE POLICY "public_read_car_frames" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'car-frames');

DROP POLICY IF EXISTS "auth_insert_car_frames" ON storage.objects;
CREATE POLICY "auth_insert_car_frames" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'car-frames');

DROP POLICY IF EXISTS "auth_update_car_frames" ON storage.objects;
CREATE POLICY "auth_update_car_frames" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'car-frames') WITH CHECK (bucket_id = 'car-frames');

DROP POLICY IF EXISTS "auth_delete_car_frames" ON storage.objects;
CREATE POLICY "auth_delete_car_frames" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'car-frames');
