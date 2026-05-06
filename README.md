# Roadmap

Roadmap tool built with Vite, React, Tailwind CSS, and serverless Upstash-backed auth.

## Stack

- Frontend: Vite, React, Tailwind CSS
- Backend: Vercel serverless functions + Upstash Redis
- Auth: TOTP, password sessions, and WebAuthn/passkeys

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm run dev:api
pnpm dev
```

The local API server loads environment variables from `.env.local` or `.env`.

## Environment Variables

Set these values in `.env.local` and in Vercel project settings:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JWT_SECRET`
- `WEBAUTHN_ORIGIN`
- `WEBAUTHN_RP_ID`
- `VITE_API_BASE_URL`

## Deployment

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add the environment variables above in the Vercel dashboard.
4. Deploy from the default branch.

## Notes

- Use `pnpm` for installs and scripts.
- The public roadmap is available at `/`.
- The admin panel is available at `/roadmap-manage`.
