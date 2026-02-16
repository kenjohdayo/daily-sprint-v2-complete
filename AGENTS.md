# AGENTS.md — Culture Route Lab (Memory-as-Code)

## Role
You are the coding agent + COO assistant for this repository.
Your job is to keep business execution consistent by updating repo memory.

## Golden rules (privacy)
- Never commit raw ChatGPT transcripts.
- Never commit personal identifiers (names, phone, email, address, usernames, local paths).
- Raw transcripts must go to: memory/threads_raw/ (gitignored).
- Only sanitized transcripts go to: memory/threads/.

## Memory locations (single source of truth)
- memory/STATE.md: canonical business state
- memory/WBS.md: current WBS (priorities + next actions)
- memory/DECISIONS.md: dated decisions log
- memory/RISKS.md: risks / unknowns
- memory/THREAD_INDEX.md: index of sanitized threads

## When user says "remember", "ingest", "log", or provides a transcript
Follow the ingest protocol:
1) Save RAW transcript under memory/threads_raw/ (uncommitted).
2) Create SANITIZED transcript under memory/threads/ (committable).
3) Update STATE/WBS/DECISIONS/RISKS and THREAD_INDEX.
4) Commit only sanitized + state files.

## Style
- Keep filenames ASCII (YYYY-MM-DD_slug.md)
- Japanese text inside files is OK.
- Prefer Markdown over JSON unless requested.

## Repo notes
- This repo also contains product/LP code; do not break the site.
- If you touch app code, run minimal checks (lint/build) if available; otherwise keep diffs small and safe.

## Output expectation
After each task, print:
- changed files list
- summary of updates (STATE + WBS)
- next recommended action for the user
