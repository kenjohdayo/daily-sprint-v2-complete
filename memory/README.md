# Memory-as-Code

This directory stores persistent project memory for multi-thread work.

## Data classes

1. **Canonical business memory (committed)**
   - `STATE.md`: Current truth for business context and constraints.
   - `WBS.md`: Priority and progress of current work breakdown.
   - `DECISIONS.md`: Dated decision history and rationale.
   - `RISKS.md`: Active risks, unknowns, and mitigations.

2. **Thread memory**
   - `threads/`: Sanitized thread records (committed).
   - `threads_raw/`: Raw transcripts (unredacted, never committed).

## Workflow

1. Save raw transcript in `threads_raw/`.
2. Redact/summarize into `threads/` using ASCII filename.
3. Register the sanitized record in `THREAD_INDEX.md`.
4. Update `STATE.md` first when business context changes.
5. Sync related docs (`WBS`, `DECISIONS`, `RISKS`) to stay consistent.

## Privacy requirements
Committed files must not include direct PII or secrets.
When in doubt, redact or replace with placeholders.
