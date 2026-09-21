# Security / Offline Fix Notes

This build contains a first-pass hardening pass:

1. Anonymous INSERT/UPDATE/DELETE policies on `car_frames` are removed.
2. Anonymous Storage mutation privileges are revoked.
3. Public SELECT remains available for the public catalog.
4. Image upload calls are configured to overwrite the deterministic filename where the existing API upload pattern permits it.
5. The edit screen is patched so an existing image is not intentionally cleared when no replacement image is selected.

## Important Supabase step

Run the new migration in the Supabase SQL editor or with the Supabase CLI before deploying.

If your application requires anonymous users to create/edit/delete records, do NOT simply reopen broad `anon` policies. Instead introduce authentication and owner-based RLS policies.

## Offline sync

The archive still needs a full sync-queue redesign before it can honestly be described as conflict-safe offline-first. In particular, remote refreshes must not replace locally pending operations. The next step should be to merge remote state with the local operation queue, then replay pending operations with idempotency and conflict handling.

## Deployment

Do not put a `service_role` Supabase key in the client bundle. A public `anon` key is expected in client apps, but RLS must enforce what that key can do.
