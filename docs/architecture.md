# Architecture and Public Boundary

## Public Component

This repository contains the Next.js App Router frontend and its same-origin API
proxy. Server components use `INTERNAL_API_BASE_URL`; browser components default
to `/api`, which the Next.js BFF forwards to the compatible private Fastify API.
`NEXT_PUBLIC_API_BASE_URL` is an optional development override, not the hosted
production boundary.

## Private Components

The following remain private and proprietary:

- Fastify/TypeScript authentication, catalog, administrative, list-sharing,
  profile, privacy, trend, and support services.
- PostgreSQL schema, migrations, relationships, and operational deployment details.
- The provider-aware ingestion and normalization pipeline used to build the catalog.
- Credentials, provider policies, cached source material, and production data.

The public repository documents only the REST contract needed to understand the frontend. This boundary is deliberate: it provides reviewable UI and integration evidence without releasing the project's commercially useful backend structure.

## Data Flow

1. The ingestion pipeline obtains metadata from allowed external providers and normalizes it into the private catalog.
2. The API validates requests, manages sessions, and reads or updates PostgreSQL records.
3. Next.js server components call the private API directly; browser components
   call the same-origin `/api` BFF for authenticated operations.
4. The BFF forwards method, body, and session cookies without exposing the
   private API address to the browser.
5. When the API is unavailable, catalog-dependent views show their real
   empty/error state; the frontend does not substitute fictional records.

The public Next.js boundary emits a baseline content security policy,
anti-framing, content-type, referrer, and browser-permission headers. Hosted
browser traffic remains same-origin through the BFF.

## Implemented Interface

- Authentication: register, login, logout, email verification, password change,
  current-session lookup, and other-session revocation.
- Media: paginated/searchable catalog reads plus protected administrative mutations.
- Discovery controls: six collapsible media-family groups, shared catalog/list
  filters, selectable overview and category/value filter layouts, and exact or
  lower/upper-bound filtering for supported fields.
- Lists: tracking and named-list writes, direct viewer grants, revocation,
  private-field-redacted shared reads, friends/share links, exact static
  memberships, and saved filter/list-set dynamic collections.
- Account: profile updates, verification/security controls, statistics, export,
  and authenticated deletion.
- Recommendations: opt-in rating aggregates with minimum cohort and per-signal
  thresholds. Coarse cohort reporting remains behind the private administrative
  API and has no normal-site page.
- Alpha feedback: public layout-feedback submission, local anonymous layout
  preference, signed-in latest-choice aggregation, and token-gated feedback
  review/status controls.

This document is intentionally architectural rather than operational; it omits internal schema and ingestion details.
