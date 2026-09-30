# Architecture and Public Boundary

## Public Component

This repository contains the Next.js App Router frontend. Server components request public catalog data, while client components use credentialed requests for session-backed list operations. `NEXT_PUBLIC_API_BASE_URL` selects the compatible API endpoint.

## Private Components

The following remain private and proprietary:

- Fastify/TypeScript authentication, catalog, administrative, and list services.
- PostgreSQL schema, migrations, relationships, and operational deployment details.
- The provider-aware ingestion and normalization pipeline used to build the catalog.
- Credentials, provider policies, cached source material, and production data.

The public repository documents only the REST contract needed to understand the frontend. This boundary is deliberate: it provides reviewable UI and integration evidence without releasing the project's commercially useful backend structure.

## Data Flow

1. The ingestion pipeline obtains metadata from allowed external providers and normalizes it into the private catalog.
2. The API validates requests, manages sessions, and reads or updates PostgreSQL records.
3. Next.js server components render catalog content; browser components perform authenticated list actions.
4. The home and catalog pages fall back to sample records when the API is unavailable so the presentation layer remains inspectable.

## Implemented Interface

- Authentication: register, login, logout, and current-session lookup.
- Media: paginated/searchable catalog reads plus protected administrative mutations.
- Lists: authenticated list reads, additions, and removals.

This document is intentionally architectural rather than operational; it omits internal schema and ingestion details.
