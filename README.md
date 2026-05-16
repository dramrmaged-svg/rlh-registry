# SIRT Planning Cockpit (Prototype)

Browser-based clinician-supervised SIRT/Y-90 planning decision-support cockpit.

## Safety
This prototype is **decision support only** and must not be used as an autonomous treatment planner.

## Run
Open `index.html` in a browser.

## Features in this prototype
- Structured data-entry across patient, labs, imaging, mapping, MAA, dosimetry and follow-up.
- Auto-calculations (BSA, MELD-Na, ALBI, basic MIRD activity estimate).
- Risk flags and treatment-strategy suggestion wording constrained to decision-support framing.
- Local save/load (`localStorage`) and JSON import/export.
- Printable generated report.
