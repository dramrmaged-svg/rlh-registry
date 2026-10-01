# SIRT Patient Episode Extractor — Version Register

Rule: **no version is accepted until the full acceptance suite (`acceptance_test_spec.md`) has run against the reference patient with zero CRITICAL failures.** Accepted builds are tagged and never overwritten; fixes produce a new version.

| Version | Date | Status | Schema version | Extractor version | Test result | Change log |
|---|---|---|---|---|---|---|
| 0.0.0-unaccepted | 2026-10-01 | **NOT ACCEPTED** — Phase 0/1 only | 1 | none (no extractors yet) | Unit/DB invariants: 32/32 pass. Acceptance suite: not run (no release candidate). | Repository audit; target architecture; domain model; SQLite store with versioned, checksummed migrations and DB-enforced provenance invariants; field catalogue; generated registry field mapping; acceptance test spec. |
