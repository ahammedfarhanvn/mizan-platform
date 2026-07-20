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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

The interface falls back to local browser storage when Supabase is not configured.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/migrations/001_mizan_platform.sql`.
4. Enable the required email authentication options.
5. Add your local and deployed URLs to the Supabase authentication redirect allowlist.

## Deploy to Netlify

Connect this repository in Netlify. The included `netlify.toml` provides:

- Build command: `npm run build:netlify`
- Publish directory: `out`
- Node.js version: `22`

Add these environment variables in Netlify before deploying:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Important note

MĪZĀN presents educational calculations and preliminary guidance. Complex cases should be reviewed by a qualified scholar before action.
