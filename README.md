# Virtual EA

AI-powered executive assistant. Lives at [designbyganesh.com/ea](https://designbyganesh.com/ea)

Virtual EA handles chat, calendar scheduling, meeting summaries, action items, AI memory, and voice — built on Next.js, Neon Postgres, Anthropic Claude, Google Calendar, ElevenLabs, and Resend.

The default assistant name is **Virtual EA** — users can customize it in Settings.

---

## Local setup

1. Clone the repo
2. `cp .env.example .env.local`
3. Fill in env vars (see lists below)
4. `npm install`
5. `npm run db:init`
6. `npm run dev`

Open [http://localhost:3000/ea/login](http://localhost:3000/ea/login) and sign in with `EA_PASSWORD`.

---

## Required env vars

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API — chat, meeting analysis, follow-up drafts |
| `DATABASE_URL` | Neon Postgres connection string |
| `EA_PASSWORD` | Password for `/ea/login` (legacy single-user auth) |
| `ELEVENLABS_API_KEY` | Text-to-speech for Virtual EA voice output |
| `RESEND_API_KEY` | Transactional email (agreements, follow-ups) |
| `GOOGLE_CLIENT_ID` | Google OAuth — Calendar sync |
| `GOOGLE_CLIENT_SECRET` | Google OAuth — Calendar sync |

---

## Optional env vars

| Variable | Enables |
|----------|---------|
| `OPENAI_API_KEY` | Whisper audio transcription (mock transcript if missing) |
| `STRIPE_SECRET_KEY` | Stripe checkout (billing currently disabled in app) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook handler |
| `STRIPE_STARTER_PRICE_ID` | Starter plan checkout |
| `STRIPE_PRO_PRICE_ID` | Pro plan checkout |
| `RESEND_FROM_EMAIL` | Custom sender address (defaults to `hello@designbyganesh.com`) |
| `NEXT_PUBLIC_SITE_URL` | OAuth redirects and email links (e.g. `https://designbyganesh.com`) |
| `DASHBOARD_PASSWORD` | Portfolio admin dashboard at `/dashboard` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity CMS for portfolio content |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (default: `production`) |

Run `npm run check-env` to verify your `.env.local` before deploy.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run check-env` | Validate required env vars |
| `npm run db:init` | Create all database tables (run once per environment) |

---

## Deploy to Vercel

1. Push to GitHub
2. Connect the repo in [Vercel](https://vercel.com)
3. Add all env vars in the Vercel dashboard (copy from `.env.example`)
4. Deploy — then run `npm run db:init` once against the production `DATABASE_URL`
5. In Google Cloud Console, add the production OAuth redirect URI:
   - `https://your-domain.com/api/ea/calendar/callback`

---

## Vercel deploy checklist

- [ ] All required env vars added
- [ ] Google OAuth redirect URI updated to production URL
- [ ] Resend domain verified for production `RESEND_FROM_EMAIL`
- [ ] `npm run db:init` run on production DB
- [ ] `npm run check-env` passes locally with production values
- [ ] Test login → chat flow at `/ea/login`
- [ ] Test Google Calendar connect from `/ea/dashboard`
- [ ] Test voice on mobile (tap to enable audio)

---

## Project structure

| Path | Purpose |
|------|---------|
| `app/ea/` | Virtual EA UI — chat, dashboard, meetings, settings |
| `app/max/` | Marketing landing, privacy, terms |
| `app/api/ea/` | EA API routes |
| `lib/agents/` | Agent router (calendar, chat, meeting_analysis) |
| `lib/memory-store.ts` | AI memory persistence |
| `lib/google-calendar.ts` | Calendar OAuth + events |
| `scripts/` | DB init + env check scripts |

Portfolio pages (`/`, `/dashboard`, Sanity studio) live alongside Virtual EA under the same Next.js app.
