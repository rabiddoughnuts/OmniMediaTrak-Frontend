# Web (Next.js)

## Project Description

Next.js frontend for OmniMedia. It renders catalog, auth, and list pages and communicates with the Fastify API.

## API Route List

Frontend integrates with these backend routes:

Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Media

- `GET /media`
- `GET /media/:id`
- `POST /media`
- `PUT /media/:id`
- `PATCH /media/:id`
- `DELETE /media/:id`

List

- `GET /list`
- `POST /list`
- `DELETE /list/:mediaId`

## Setup Instructions

From the `frontend/` directory:

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:3000`

Note: Start the backend separately (see `../backend/README.md`) before testing features that require the API.

## Environment Variable Requirements

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:3001`)

Backend environment variables (set in `../backend` for local dev):

- `DATABASE_URL` (PostgreSQL connection string)
- `SESSION_SECRET` (session encryption secret, minimum 32 characters)
- `MEDIA_ADMIN_TOKEN` (required for admin media mutations)

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Assets

Fonts and images used by the frontend are under `public/` (e.g. `public/fonts`, `public/images`). If fonts are missing, update `app/globals.css` or convert TTF→WOFF2 as needed.

## Pages

- / (home)
- /catalog (media catalog + filters)
- /list (personal list)
- /auth/register
- /auth/login
- /auth/logout

## Documentation

See the top-level [docs/proposal.md](../docs/proposal.md) for overall design notes and wireframes.
