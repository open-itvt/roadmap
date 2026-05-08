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

### API Endpoints

Current base path: `/api`

Public/project data endpoints (currently no server-side session check in handlers):

- `GET /api/check-cache`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PUT /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `GET /api/projects/:projectId/stages`
- `POST /api/projects/:projectId/stages`
- `POST /api/projects/:projectId/stages/reorder`
- `GET /api/projects/:projectId/stages/:stageId`
- `PUT /api/projects/:projectId/stages/:stageId`
- `DELETE /api/projects/:projectId/stages/:stageId`
- `GET /api/projects/:projectId/stages/:stageId/links`
- `POST /api/projects/:projectId/stages/:stageId/links`
- `PUT /api/projects/:projectId/stages/:stageId/links/:linkId`
- `DELETE /api/projects/:projectId/stages/:stageId/links/:linkId`

Auth endpoints:

- `POST /api/auth/init`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-totp`
- `POST /api/auth/set-password`
- `POST /api/auth/webauthn/register/start`
- `POST /api/auth/webauthn/register/complete`
- `POST /api/auth/webauthn/auth/start`
- `POST /api/auth/webauthn/auth/complete`

Development/debug-only auth endpoints (do not expose in production):

- `POST /api/auth/bypass-tmp` (development only)
- `GET /api/auth/debug/admins`
- `POST /api/auth/debug/create-admin`
- `POST /api/auth/debug/delete-admin`

Admin utility endpoints:

- `POST /api/admin/init` (seeds sample data)
- `POST /api/admin/reset`

Security note:

- The project/stage/link and admin utility endpoints above should be protected by backend authentication/authorization before production use (for example: verify a valid admin session token in each handler or in a shared middleware).


Created with 💖 for iTVT
