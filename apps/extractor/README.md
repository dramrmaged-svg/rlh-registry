# SIRT Patient Episode Extractor (`apps/extractor`)

Local, source-traceable capture and extraction for one SIRT patient episode, feeding the existing RLH SIRT registry. **Not accepted for clinical use** — see `docs/extractor/VERSIONS.md`.

Docs: `docs/extractor/` — audit, architecture, field mapping (generated), acceptance spec.

```bash
pnpm install
pnpm run typecheck
pnpm test
pnpm run field-mapping   # regenerate docs/extractor/field_mapping.md after editing src/domain/field-catalogue.ts
```

Requires Node ≥ 22.13 (built-in `node:sqlite`; no native modules). Node prints an `ExperimentalWarning` for SQLite — expected.

Layout:
- `src/domain/vocab.ts` — controlled vocabularies (statuses, document classes, intents, windows)
- `src/domain/field-catalogue.ts` — every extractable/calculable field, source classes, verification rule, registry target
- `src/domain/registry-schema.ts` — parses `apps/api/prisma/schema.prisma`; registry-only annotations
- `src/store/` — SQLite store, migrations (append-only, checksummed), DB-enforced provenance invariants
