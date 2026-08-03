# RLH SIRT Registry

A clinical registry for SIRT (Selective Internal Radiation Therapy) treatment
tracking in liver oncology, built around a `Patient → Episode → {mapping,
dosimetry, treatment, follow-up, lesions, toxicity}` data model — a patient
with repeat SIRT treatments gets independent data per episode, never a
silent overwrite. See `apps/api/docs/adr/0001-episode-architecture.md` for
the architecture rationale.

- `apps/api` — NestJS + Prisma + PostgreSQL backend.
- `apps/web` — React + TypeScript + Vite frontend.

## Quick start (local development)

### 1. PostgreSQL

You need a local Postgres instance with a `rlh_user`/`rlh_pass` login and a
`rlh_sirt` database (matching `apps/api/.env`'s `DATABASE_URL`), e.g.:

```bash
sudo -u postgres psql -c "CREATE ROLE rlh_user WITH LOGIN PASSWORD 'rlh_pass' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE rlh_sirt OWNER rlh_user;"
```

### 2. Backend

```bash
cd apps/api
pnpm install
pnpm exec prisma migrate deploy   # applies the schema
pnpm exec ts-node prisma/seed.ts  # seeds vocabularies + a bootstrap admin user
pnpm run start                    # http://localhost:3001/api/v1
```

The seed script creates an admin login (`admin@rlh-registry.local` /
`ChangeMe123!` by default, overridable via `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` env vars) — **change this password before any real
deployment**, and use it to create real named user accounts (`POST /users`)
for actual clinical staff rather than sharing it.

### 3. Frontend

```bash
cd apps/web
pnpm install
pnpm run dev                      # http://localhost:3000
```

Log in with the seeded admin (or any user account created via the API).
The frontend expects the API at `http://localhost:3001/api/v1` by default
(override with `VITE_API_BASE_URL` in an `apps/web/.env.local` file).

### Running tests (backend)

```bash
cd apps/api
pnpm run test:unit          # pure logic — calculations, readiness rules, status graph
pnpm run test:integration   # requires a second Postgres database for tests, see jest.integration.config.json
```

## What's built so far

- **Data architecture**: the full episode-centric Prisma schema (Episode,
  Diagnosis with calculated/confirmed staging, Lesion, MappingSession,
  MaaStudy, DosimetryPlan, TreatmentSession, FollowUp, ToxicityEvent,
  CalculationAudit, Vocabulary).
- **Calculation engine**: age, BMI/BSA, Child-Pugh, MELD-3.0, MELD-Na, ALBI,
  BCLC 2022 staging, lung-shunt risk banding — ported from the legacy
  single-file registry as tested pure functions, with known legacy defects
  flagged (not silently fixed) in the ADR.
  <br>Every function returns a typed result. This is
  **decision-support software, not a diagnostic device** — it does not
  replace clinical judgment.
- **Backend API**: full CRUD for patients, episodes (17-status workflow),
  diagnosis/staging (+ a recalculate action wiring the calculation engine),
  lesions, mapping sessions + MAA studies, dosimetry plans (+ approval
  workflow), treatment sessions (+ dose injections, gated by a
  dosimetry-approval readiness check), follow-ups, and toxicity events —
  all with optimistic locking, audit logging, and soft delete.
- **Frontend**: a functional (not yet fully polished) UI covering patient
  search/create, episode creation and status transitions, diagnosis entry
  with live calculation results, and data entry for every episode
  sub-resource above.

## Not yet built

- Legacy-data import from the old single-file HTML registry.
- Reports/exports (PDF/Word case reports, CSV research exports, MDT
  minutes, etc.) and analytics dashboards.
- Full UI polish (dark mode, richer validation messaging, printable views,
  a proper episode timeline visualisation beyond the current simple list).
- A production deployment configuration (this is dev-mode only today: no
  Docker/CI setup, no HTTPS termination, no secrets management beyond
  `.env` files).
