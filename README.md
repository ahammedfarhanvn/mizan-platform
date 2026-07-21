# MĪZĀN

MĪZĀN is a multilingual Islamic wealth-guidance platform for transparent Zakat calculations, Farā’iḍ case mapping, modern Masā’il guidance, and qualified Qazi verification.

## Product areas

- Public landing experience with a real-time wealth-to-giving animation
- Email authentication and onboarding
- Personal dashboard and profile settings
- Zakat calculation with traceable inputs
- Farā’iḍ relationship mapping
- Masā’il assistant interface
- Qazi directory and appointment requests
- Reports and knowledge pages

## Technology

- Next.js 16 and React 19
- TypeScript and responsive CSS
- Supabase authentication and database
- Netlify static hosting
- Lucide icon system

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase project values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

MĪZĀN does not use demo accounts or browser-storage records. When Supabase is not configured, authentication is paused with a clear setup message so no user can mistake sample data for a real account.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/migrations/001_mizan_platform.sql`.
4. Run `supabase/migrations/002_working_backend.sql`.
5. Under **Authentication → Sign In / Providers → Email**, keep email/password signup enabled and turn **Confirm email** off.
6. Add your local and deployed URLs to the Supabase authentication redirect allowlist.

Email confirmation and resend controls are intentionally disabled for the current launch. New users receive a session immediately and continue directly to onboarding. Confirmation can be restored later together with production SMTP.

The second migration enables authenticated profiles, private cases and event history, verified-Qazi appointments, approved knowledge articles, Masā’il question history, account export, and row-level security for every user-owned record.

## Deploy to Netlify

Connect this repository in Netlify. The included `netlify.toml` provides:

- Build command: `npm run build:netlify`
- Publish directory: `out`
- Node.js version: `22`

Add these environment variables in Netlify before deploying:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The older `NEXT_PUBLIC_SUPABASE_ANON_KEY` name remains supported for existing deployments, but new Supabase projects should use the publishable key.

This repository is already connected to its intended Supabase project through a browser-safe publishable-key fallback. Deployment environment values override that fallback, which makes project rotation possible without another source change. Database passwords and service-role keys are never included in the client or repository.

## Important note

MĪZĀN presents educational calculations and preliminary guidance. Complex cases should be reviewed by a qualified scholar before action.
