# V2 frontend source consolidation — 2026-10-09

## Why
The owner chose to resolve the V2-to-main source split before LF-TASK-024 UX implementation. Frontend main is retired legacy/offline code, while the private backend consumes a separate immutable V2 revision. This is migration evidence, not a second task register.

## Baselines and observed evidence
Frontend main: b91b002bc4eb0314b2281fbf61a5ae2d3dbbc510.
Observed backend service/frontend-pin.json source: 805a00aef1b3057e9bda4ef79d738d88ed24021a, 20 allowlisted blobs.
The codex/control-center-supabase-v2 branch is older than that pin and must not be used as an equivalent source.
No claim of newly verified production behavior.

## Prepared changes
Transfer pinned V2 implementation/build helpers and corresponding tests into a branch based on current main. Preserve main's retired Pages workflow and deleted current-state CLI entrypoints. Update README/help to avoid obsolete activation and CLI instructions. Preserve both historical source audits without rewriting their dated verdicts.
Correct the transferred privacy test's exact build-file assertion to include status-model.mjs, which the pinned builder already allowlists. This strengthens the exact assertion; no validation rule is removed.

## Verification and limits
Preparation used GitHub connector fresh reads and source blob identities. 19 of the 20 backend allowlisted files are transferred byte-for-byte or inherited identically from main; web/README.html is deliberately updated help text. Runtime app/auth/refresh/validation code remains exactly pinned.
Execution workspace pending/offline: npm run check and npm run build NOT RUN; browser QA NOT PERFORMED. Safari direct QA NOT PERFORMED. These are blockers before readiness, not PASS claims. Remote file/PR readback must be checked after creation.

## Mitigation / next steps
Keep PR DRAFT until check/build and synthetic same-origin/session browser regression pass. Confirm main has not drifted before merge. Merge requires owner authorization; none performed.
Backend source pin remains unchanged. A main merge alone cannot release UX or alter production. Future pin update/release is a separate authorized operation.
LF-TASK-024 UX work remains deferred until the source baseline decision is completed. No schema/DTO/auth-model changes, CRM, legacy runtime restoration, merge or deployment.
