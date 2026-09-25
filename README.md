# Jessika & Joshua wedding site

Next.js app with the original invitation UI, phone login, and live Supabase sync for guests + RSVPs.

## 1. Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Project Settings → API: copy **Project URL**, **anon public** key, and **service_role** key.
3. Paste those values in `.env`.
4. SQL Editor → paste and run `supabase/schema.sql`.  
   That creates `guests` and `rsvps` and seeds the three test numbers from the original page.

## 2. Deploy on Vercel

`.env` stays on your machine. In the Vercel project, open **Settings → Environment Variables** and add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PHONE_OTP` set to `false` unless SMS codes are enabled

Vercel runs `npm run build`. The home page is static. Login and RSVP stay as server routes and read those variables at runtime.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page is the same as `index.html`. Unlock with:

- `(713) 555-0101` — both events (Jane Doe)
- `(713) 555-0102` — brunch (Grandma Smith)
- `(713) 555-0103` — night (Alex Johnson)

Any other number stays on the landing page with a warning and is not added to `guests`.

## 4. What syncs to Supabase

| Action | API | Table |
| --- | --- | --- |
| Phone unlock / login | `POST /api/auth/login` | `guests` |
| RSVP submit | `POST /api/rsvp` | `rsvps` (upsert by phone) |
| Connection check | `GET /api/health` | — |

Add more people in **Table Editor → guests** (`phone` digits only, `tier` = `both` | `brunch` | `night`).

## 5. Optional SMS code (Supabase Auth)

Default login is phone lookup against `guests` (no extra fields on the page).

To require a 6-digit SMS code in that **same** input:

1. Authentication → Providers → Phone → enable, then add Twilio.
2. Set `NEXT_PUBLIC_PHONE_OTP=true` in `.env`.
3. Guest enters phone → Unlock → text arrives → guest types the code in the same box → Unlock again.

## 6. UI source

`index.html` is unchanged. Next.js serves that markup from `public/wedding-body.html` (a copy of the original body). Do not restyle it; only APIs and data live in `app/api` and `lib`.
