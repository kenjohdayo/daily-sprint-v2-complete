# STATE (Single Source of Truth)

Last updated: 2026-02-16

## Current Offer
- Repository-level Memory-as-Code system for preserving business context across threads.
- Canonical memory docs in `memory/` plus sanitized thread records in `memory/threads/`.
- Optional helper scripts for thread creation and redaction in `scripts/`.

## Target
- Reliable cross-thread continuity with low context loss.
- Privacy-safe historical records that are commit-safe and auditable.
- Repeatable ingestion workflow: raw capture -> sanitize -> index -> update canonical docs.

## Pricing
- No direct pricing policy is defined in this repository yet.
- Assumption (2026-02-16): Memory process is internal enablement with zero external billing impact until monetization is specified.

## Constraints
- Do not commit raw transcripts from `memory/threads_raw/`.
- Do not commit PII/secrets in any committed memory artifact.
- Use ASCII filenames for thread artifacts.
- Keep this file canonical; reconcile `WBS`, `DECISIONS`, and `RISKS` when updates occur.

## Open Questions
- Should ingestion include mandatory quality gates beyond manual review?
- What minimum metadata schema is required for each sanitized thread record?
- Is an automated validator needed to enforce STATE section completeness?
