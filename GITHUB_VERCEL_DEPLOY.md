# GitHub + Vercel deployment

## 1. GitHub
Create a new repository and upload the contents of this folder.

Do not upload:
- `.env`
- Supabase service-role keys
- build folders
- `node_modules`

## 2. Local setup
Copy `.env.example` to `.env` and fill in:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Then install dependencies and run the project using the scripts in `package.json`.

## 3. Supabase
Run the migration files in `supabase/migrations/` against your Supabase project.

The client must never contain a `service_role` key.

## 4. Vercel
Import the GitHub repository into Vercel and add the same two environment variables under:
Project Settings -> Environment Variables

Then deploy.

## 5. Important
The project contains a security hardening migration. Review it against your intended authentication model before production.

The offline synchronization layer should be tested carefully before relying on it for production data. A full conflict-safe queue/merge implementation is a separate step.
