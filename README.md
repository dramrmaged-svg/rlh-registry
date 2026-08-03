# RLH SIRT Registry

A clinical registry for SIRT (Selective Internal Radiation Therapy) treatment
tracking in liver oncology, built around a `Patient → Episode → {mapping,
dosimetry, treatment, follow-up, lesions, toxicity}` data model — a patient
with repeat SIRT treatments gets independent data per episode, never a
silent overwrite. See `apps/api/docs/adr/0001-episode-architecture.md` for
the architecture rationale.

Two editions exist, sharing the same data model, calculation engine and
vocabulary lists:

- **`RLH_SIRT_Registry_v2.html`** (repo root) — a single self-contained HTML
  file, no install/server/database required. Data is stored only in the
  browser's `localStorage`. Use this to start entering real data today; see
  "Local HTML edition" below for what it does and doesn't do.
- **`apps/api` (NestJS + Prisma + PostgreSQL) + `apps/web` (React + Vite)** —
  the multi-user server version: real database, concurrent access, auth,
  audit logging, optimistic locking. Upgrade to this whenever you're ready;
  it uses the same episode structure, so an exported HTML-edition backup can
  be migrated in without re-entering anything.

## Local HTML edition — quick start

Open `RLH_SIRT_Registry_v2.html` directly in a browser (double-click it, or
`File → Open`). No build step, no server, nothing to install.

- **Single-user, single-browser only.** Data lives in that browser's
  `localStorage` — it is not shared between users or devices, and two people
  opening the file at the same time will not see each other's entries.
- **Export a backup regularly** (sidebar button) — a JSON file you can store
  safely. Clearing browser data, or opening the file on a different
  computer, loses anything that wasn't exported. **Import backup** loads a
  previously exported file back in (this replaces whatever is currently in
  the browser).
- Implements the same episode-per-treatment model as the server edition: a
  repeat SIRT episode is always a brand-new episode record linked to the
  previous one via `previousEpisodeId` — no legacy-style silent overwrite.
- Carries over the full calculation engine (age, BMI/BSA, Child-Pugh,
  MELD-3.0/MELD-Na, ALBI, BCLC 2022, lung-shunt risk banding) and the
  controlled vocabulary lists (tumour type, aetiology, PVTT, LI-RADS,
  Michels hepatic arterial anatomy, embolic materials, dosimetry planning
  model/particle products, progression reasons, REILD grade, outcome
  status) verbatim from `apps/api`, including the same flagged-not-fixed
  legacy defects (see the "unverified formula" badge on MELD-Na).
- Enforces the same core safety rules as the backend, client-side: episode
  status transitions block on missing outcome/treatment data where the
  backend does; adding a treatment session without an approved dosimetry
  plan requires an explicit override reason (≥10 characters), logged to the
  episode's timeline; an approved dosimetry plan is locked until explicitly
  unlocked with a reason.
- **Not included in this edition** (available in the server edition, or
  roadmapped): multi-user concurrent access, authentication/RBAC, a
  database-level audit trail (a lightweight per-episode timeline is kept
  instead), legacy-data import, reports/exports, analytics.

## Server edition — quick start (local development)

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
