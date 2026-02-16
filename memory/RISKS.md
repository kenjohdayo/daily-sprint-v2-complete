# RISKS

| ID | Risk / Unknown | Impact | Mitigation | Status |
|---|---|---|---|---|
| R-001 | Raw transcript may be accidentally staged | Privacy/compliance issue | Keep `memory/threads_raw/` ignored and validate before commit | active |
| R-002 | Sanitized records may still contain sensitive tokens | Data leakage in committed history | Apply redaction + manual review checklist | active |
| R-003 | Input transcript may be missing/partial | Incomplete memory capture and weak traceability | Record explicit ingestion gap and request full transcript in future | active |
| R-004 | STATE/WBS/DECISIONS can drift over time | Execution inconsistency across threads | Update canonical docs in same change set as ingestion | active |
