-- Security hardening for the public client.
-- This migration assumes the app does not currently have authenticated users.
-- It prevents anonymous writes while retaining public read access.
-- If the app later adds authentication, replace these policies with authenticated-role policies.

drop policy if exists "anon_can_select_car_frames" on public.car_frames;
drop policy if exists "anon_can_insert_car_frames" on public.car_frames;
drop policy if exists "anon_can_update_car_frames" on public.car_frames;
drop policy if exists "anon_can_delete_car_frames" on public.car_frames;

drop policy if exists "public_read_car_frames" on public.car_frames;
create policy "public_read_car_frames"
on public.car_frames
for select
to anon, authenticated
using (true);

-- Do not grant anonymous mutation access.
revoke insert, update, delete on table public.car_frames from anon;

-- Storage: public read is acceptable for a public catalog, but anonymous mutation is not.
drop policy if exists "anon_can_upload_car_frames" on storage.objects;
drop policy if exists "anon_can_update_car_frames" on storage.objects;
drop policy if exists "anon_can_delete_car_frames" on storage.objects;

revoke insert, update, delete on storage.objects from anon;
