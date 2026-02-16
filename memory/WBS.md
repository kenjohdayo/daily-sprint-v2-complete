# WBS

Last updated: 2026-02-16

| Task | Priority | Owner | Status | Next action |
|---|---|---|---|---|
| Keep `memory/STATE.md` aligned with latest canonical facts | P0 | CODEX | doing | Reconcile state sections on each ingestion. |
| Ingest each new thread into `threads_raw` and sanitized `threads` | P0 | CODEX | doing | Execute raw->sanitize workflow per thread. |
| Ensure `memory/threads_raw/` remains git-ignored | P0 | CODEX | done | Verify via `git check-ignore` during updates. |
| Update `THREAD_INDEX.md` for every sanitized transcript | P0 | CODEX | doing | Add row with synopsis immediately after sanitization. |
| Enforce no-PII policy in committed memory files | P0 | USER | doing | Review sanitized artifacts before merge. |
| Append dated outcomes in `DECISIONS.md` per thread | P1 | CODEX | doing | Add “No new decisions” when none are made. |
| Track newly surfaced unknowns in `RISKS.md` | P1 | CODEX | doing | Add risk entries on each ingestion pass. |
| Define pricing/commercial policy for memory outputs | P2 | USER | todo | Provide explicit pricing guidance for STATE. |
| Add lightweight memory validation script | P2 | CODEX | todo | Draft script to check required sections and forbidden patterns. |
| Standardize sanitized thread template fields | P2 | CODEX | todo | Propose and document fixed schema in README. |
