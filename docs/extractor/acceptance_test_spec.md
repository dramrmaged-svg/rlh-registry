# Acceptance Test Specification — SIRT Patient Episode Extractor

Status: **SPECIFICATION ONLY.** No release candidate exists. `acceptance_test_report.md` is produced in Phase 9 by the acceptance runner from this spec; it is not hand-written.

Release rule: **any CRITICAL failure blocks release. No new version is accepted until every test below has run against the reference patient and no CRITICAL test has failed.** MAJOR failures require a written waiver in `VERSIONS.md`. MINOR failures are recorded.

Each executed test records: `test_id | expected | actual | pass/fail | severity | source` (source = fixture document id + character span, or calculation_run id).

---

## 1. Reference patient — `SYNTH-0001` (fully synthetic)

No real identifiers. Fixture documents will live in `apps/extractor/fixtures/synth-0001/` (built in Phase 2/3). Expected values below are the ground truth the runner compares against.

| # | Document (capture order) | Class | Clinical date | Capture method | Notes |
|---|---|---|---|---|---|
| D1 | Liver bloods | LABS | 2026-03-02 | DIRECT_TEXT_COPY | Bili 18 µmol/L, Alb 38 g/L, INR 1.1, Plt 142, Creat 81, Na 138, ALT 44, AST 52, ALP 131, Neut 3.9, AFP 412 kU/L |
| D2 | MRI liver | BASELINE_MRI | 2026-03-04 | DIRECT_TEXT_COPY | Cirrhotic liver. L1 seg 7 **63 mm** APHE + washout, LR-5. L2 seg 4a 25 mm LR-5. No PVTT. No ascites. No extrahepatic disease. |
| D3 | MRI liver (identical copy of D2) | BASELINE_MRI | 2026-03-04 | DIRECT_TEXT_COPY | Exact duplicate |
| D4 | HPB MDT outcome | MDT | 2026-03-08 | EXPORTED_TEXT | HCC, BCLC B, ECOG 0, Child-Pugh A5, dominant lesion **58 mm**; decision SIRT. Encephalopathy not mentioned. |
| D5 | Mapping angiogram | MAPPING_ANGIOGRAPHY | 2026-03-24 | DIRECT_TEXT_COPY | R CFA, 5F sheath, 5F SIM1, 2.7F microcatheter; replaced RHA from SMA (Michels III); CBCT performed, perfused vol 980 mL; GDA prophylactically coiled; 150 MBq MAA into RHA; no complication. |
| D6 | MAA SPECT/CT | MAA_SPECT_CT | 2026-03-24 | EXPORTED_PDF_TEXT | LSF **6.2%**, predicted lung dose 4.1 Gy, no extrahepatic uptake, T/N ratio 3.4 |
| D7 | Dosimetry plan | DOSIMETRY_PLAN | 2026-03-30 | EXPORTED_PDF_TEXT | Partition model, glass (TheraSphere), target vol 980 mL, tumour vol 142 mL, prescribed **3.2 GBq**, predicted tumour dose 210 Gy, predicted normal-liver dose 38 Gy, intent radiation lobectomy |
| D8 | Y-90 treatment report | Y90_TREATMENT | 2026-04-14 | DIRECT_TEXT_COPY | One position (replaced RHA), planned 3.2 GBq, residual 0.2 GBq, delivered **3.0 GBq**, no reflux, no stasis, technical success, same-day discharge |
| D9 | Blank report placeholder | — | 2026-04-14 | DIRECT_TEXT_COPY | Empty body (simulates report not yet loaded) |
| D10 | Post-Y90 PET/CT | POST_Y90_PET_CT | 2026-04-14 | DIRECT_TEXT_COPY | Distribution concordant with intended territory; L1 and L2 covered; no non-target activity. Delivered tumour dose not documented. |
| D11 | Follow-up MRI | FOLLOWUP_MRI | 2026-07-08 | DIRECT_TEXT_COPY | L1 55 mm, viable 20 mm; L2 18 mm non-enhancing; no new lesions |
| D12 | Follow-up MRI | FOLLOWUP_MRI | 2026-10-20 | SCREENSHOT_OCR | L1 48 mm; L2 not measurable; new seg 2 lesion 14 mm (out-of-field) |
| D13 | Unrelated chest X-ray | OTHER | 2026-05-02 | DIRECT_TEXT_COPY | Must be classified OTHER and default-excluded from SIRT timeline extraction |

Intentional traps: D2 vs D4 dominant-lesion size conflict; D3 duplicate; D9 blank; D12 OCR-derived (confidence cap, verification forced); encephalopathy never documented (Child-Pugh must **not** be calculated); no 9-month follow-up (completeness must flag MISSING); AFP in kU/L (must not be converted); delivered tumour dose undocumented (must not be filled from predicted 210 Gy).

## 2. Test cases

Severity: **C** = CRITICAL, **M** = MAJOR, **m** = MINOR. "Phase" = earliest phase in which the test can execute.

### Document discovery (AT-DISC)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-DISC-01 | All 13 documents captured; each has non-null `text_sha256`, `capture_method`, `captured_at`, `source_order` 1..13 | C | 2 |
| AT-DISC-02 | Capture method recorded exactly as table §1; D12 is `SCREENSHOT_OCR` and flagged | C | 2 |
| AT-DISC-03 | D9 recorded with checkpoint outcome `BLANK`, retried per config, not passed to extraction | M | 2 |
| AT-DISC-04 | Patient-banner mismatch (injected) → hard stop, outcome `PATIENT_MISMATCH`, no document stored | C | 2 |

### Classification (AT-CLASS)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-CLASS-01 | D1–D13 classes as table §1 (D9 n/a) | M | 3 |
| AT-CLASS-02 | Every classification stores confidence + reasoning (title rule, content rule hits) | M | 3 |
| AT-CLASS-03 | Classification with confidence < 0.80 sets `class_needs_review = 1`; such documents excluded from extraction until confirmed | C | 3 |
| AT-CLASS-04 | Title-only and content-only disagreement (injected variant of D6 titled "CT ABDOMEN") → UNCERTAIN + review | M | 3 |

### Chronology (AT-CHRON)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-CHRON-01 | Timeline ordered by clinical date; ties (D5/D6, D8/D10) broken by source order | M | 3 |
| AT-CHRON-02 | Original capture order preserved and retrievable independently of timeline order | M | 2 |
| AT-CHRON-03 | Excluded documents (D3, D13) visible in timeline marked excluded with reason | m | 3 |

### Baseline extraction (AT-BASE)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-BASE-01 | diagnosis = HCC (D4); ECOG = 0 (D4); cirrhosis = true (D2); PVTT = none (D2); extrahepatic disease = false (D2); ascites = none (D2) | C | 4 |
| AT-BASE-02 | Labs from D1 with units exactly as documented; AFP unit `kU/L`, value 412, **not converted** | C | 4 |
| AT-BASE-03 | encephalopathy = NOT_DOCUMENTED (never inferred as "none") | C | 4 |
| AT-BASE-04 | Child-Pugh A5 from D4 stored as `child_pugh_documented`, not as calculated | M | 4 |

### Lesions (AT-LES)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-LES-01 | Two baseline lesions L1 (seg 7) and L2 (seg 4a); not collapsed into a dominant lesion | C | 4 |
| AT-LES-02 | L1 baseline longest diameter has two candidates 63 mm (D2) / 58 mm (D4) → CONFLICT | C | 4 |
| AT-LES-03 | New seg 2 lesion at D12 recorded as new lesion, out-of-field progression = true (UNCERTAIN until verified — OCR) | M | 4 |

### Mapping (AT-MAP)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-MAP-01 | access R CFA, sheath 5F, catheter 5F SIM1, microcatheter 2.7F, Michels III, CBCT performed, perfused vol 980 mL, GDA embolised (vessel role EMBOLISED), MAA injection vessel RHA (role MAA_INJECTION), MAA 150 MBq, technical success, no complication | C | 4 |
| AT-MAP-02 | CBCT A/T ratio = NOT_DOCUMENTED and not calculated (inputs absent) | M | 4/7 |

### MAA (AT-MAA)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-MAA-01 | LSF 6.2 **%**, lung dose 4.1 Gy, extrahepatic uptake = false, T/N 3.4 (documented) | C | 4 |
| AT-MAA-02 | LSF risk band = LOW via `LUNG_SHUNT_RISK_BAND`, CALCULATED with calculation_run | M | 7 |

### Dosimetry (AT-DOSI)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-DOSI-01 | Predicted: method partition, product TheraSphere/glass, target 980 mL, tumour 142 mL, prescribed 3.2 GBq, predicted tumour 210 Gy, normal liver 38 Gy | C | 4 |
| AT-DOSI-02 | Delivered tumour dose = NOT_DOCUMENTED; **never** populated with 210 Gy | C | 4 |

### Treatment (AT-TX)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-TX-01 | date 2026-04-14, glass, intent RADIATION_LOBECTOMY, 1 administration position, planned 3.2, residual 0.2, delivered 3.0 GBq, reflux false, stasis false, technical success true, same-day discharge true | C | 4 |
| AT-TX-02 | delivered_activity_gbq never sourced from D7 | C | 4 |

### Post-Y90 (AT-POST)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-POST-01 | modality PET_CT, concordance true, non-target activity none, untreated tumour false | C | 4 |

### Follow-up (AT-FU)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-FU-01 | Two follow-ups; D11 interval 85 days → M3; D12 interval 189 days → M6 | C | 4/7 |
| AT-FU-02 | Per-lesion serial values: L1 63/58→55→48; L2 25→18→not measurable | C | 4 |
| AT-FU-03 | No RECIST/mRECIST assigned for L1 while its baseline is in CONFLICT | C | 7 |
| AT-FU-04 | L2 % change at M3 = −28.0% (25→18), stored with inputs, rule, version | M | 7 |

### Calculations (AT-CALC)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-CALC-01 | ALBI = −2.4015 (±0.0005), grade 2, inputs = D1 field_value ids | C | 7 |
| AT-CALC-02 | Child-Pugh NOT_CALCULABLE; missing = encephalopathy | C | 7 |
| AT-CALC-03 | Delivery % = 93.75% (3.0/3.2) | M | 7 |
| AT-CALC-04 | MELD 3.0 NOT_CALCULABLE until sex documented/verified (no male default) | C | 7 |
| AT-CALC-05 | Every calculation has unit tests incl. boundary values; LLM never invoked for any calculation (assert AI provider call count = 0 during calc runs) | C | 7 |

### Conflicts (AT-CONF)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-CONF-01 | L1 baseline diameter: status CONFLICT, both candidates (63 mm D2 2026-03-04; 58 mm D4 2026-03-08) exposed with source text | C | 4/6 |
| AT-CONF-02 | No automatic resolution by recency, source type, or confidence | C | 4/6 |
| AT-CONF-03 | Resolution requires named user + reason; audit holds previous and new value | C | 6 |

### Missing data (AT-MISS)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-MISS-01 | Completeness: baseline imaging COMPLETE; diagnosis COMPLETE; bilirubin/albumin/INR COMPLETE; ECOG COMPLETE; mapping COMPLETE; MAA COMPLETE; LSF COMPLETE; dosimetry COMPLETE; planned activity COMPLETE; delivered activity COMPLETE; treatment report COMPLETE; post-treatment scan COMPLETE; 3-month FU COMPLETE; 6-month FU UNCERTAIN (OCR, unverified) | C | 4/6 |
| AT-MISS-02 | 9-month FU reported MISSING (not silently absent) | M | 6 |

### Provenance (AT-PROV)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-PROV-01 | Every EXTRACTED field_value has source_document_id + evidence span whose quoted text equals the document substring | C | 1 ✔ (DB-enforced) / 4 |
| AT-PROV-02 | Source text cannot be modified or deleted | C | 1 ✔ |
| AT-PROV-03 | Provenance report lists every registry-bound value with document, date, method, confidence, verification | M | 6 |

### Verification (AT-VER)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-VER-01 | Verifying a value preserves the original; verified_value, user, timestamp stored; append-only verification log | C | 1 ✔ (DB) / 6 |
| AT-VER-02 | Only CLINICIAN_VERIFIED (or CALCULATED from verified inputs) values are pushed to the registry | C | 5 |
| AT-VER-03 | AI output cannot change any field_value or registry value | C | 1 ✔ (DB) / 8 |

### Export (AT-EXP)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-EXP-01 | JSON, CSV, XLSX and registry-format (Prisma API payload + HTML-edition backup) produced; row counts match store | M | 5 |
| AT-EXP-02 | No export contains NHS number, MRN, name or DOB | C | 5 |
| AT-EXP-03 | SIRT Episode Summary, Data Completeness, Source Provenance and Validation reports generated | M | 6 |

### Pause/resume, duplicates, crash recovery (AT-RUN)
| ID | Expected | Sev | Phase |
|---|---|---|---|
| AT-RUN-01 | Pause after D5; resume captures D6..D13 only; final state identical to uninterrupted run | C | 2 |
| AT-RUN-02 | D3 detected as exact duplicate of D2, linked via `duplicate_of_id`, excluded by default | M | 2 |
| AT-RUN-03 | Re-capturing an already-stored document is idempotent (no second row) | C | 1 ✔ / 2 |
| AT-RUN-04 | Process killed mid-D8 (simulated); restart resumes at D8 from last checkpoint; no partial D8 row; store opens without corruption | C | 2 |
| AT-RUN-05 | Application restart reopens store at same schema version; migrations not re-applied | C | 1 ✔ |
| AT-RUN-06 | Slow load (driver delay > timeout) → retry with backoff, then NOT_FOUND/ERROR checkpoint; session continues | M | 2 |
| AT-RUN-07 | Unexpected window focus (driver reports foreground ≠ RIS) → re-assert + re-validate patient banner before copy | C | 2 |

## 3. Phase 1 coverage (executed now)

Phase 1 delivers the store and mapping; the following are DB-level/unit guarantees already exercised by `apps/extractor` tests (32 tests): AT-PROV-01 (span check), AT-PROV-02, AT-VER-01 (DB level), AT-VER-03 (DB level), AT-RUN-03, AT-RUN-05, plus registry-mapping completeness. These are **pre-conditions**, not acceptance: the full suite runs in Phase 9 against `SYNTH-0001`.
