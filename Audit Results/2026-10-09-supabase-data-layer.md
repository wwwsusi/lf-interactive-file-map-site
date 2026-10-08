# Control Center V2 — implementation audit

Date: 09-10-2026 Europe/Prague. Review implementation only; no merge/deployment or database writes.

## Why

Replace operational GitHub NOW/legacy Sheet assumptions with a safe server-side Supabase read projection, while preserving file-map operations, manual refresh and explicit snapshot import.

## Sources and findings

- Fresh backend main `3f83bd9a62df108657696080232e8dc5eaab48cb`; frontend main `f2af50ad94e0f4f1f3d7e255432026085d60b4e1`. Both heads rechecked before preparing commits. Source governance main `20ae3803a0cc9602c91140e3c543c7335dd1f557`, project instructions and cutover audit read. No governance/routing modification.
- Read-only schema/validator/count checks against Supabase. Current counts: 36 services, 24 products, 9 campaigns, 1 final output, **22** management tasks, 0 social performance. The prompt's 21 tasks is historical; no task was created by this implementation. Validator remains 0 ERROR / 27 WARN. service_role SELECT privilege on validator confirmed.
- Actual service main returned a signed Bearer session but no HttpOnly cookie, despite prior documentation. New dashboard adds signed HttpOnly/Secure cookie compatibility while leaving the independent inventory/event Bearer model functional.
- Existing live report merged imported Sheet rows with GitHub. The initial V2 proposal replaced the complete live DTO and returned 410 for /api/report. Pre-merge review identified the backend-first deployment gap; the compatibility decision below supersedes that removal. V2 marks explicit imports SNAPSHOT and uses /api/dashboard only; old ingestion is retained for transition compatibility, not canonical authority.
- Optional Drive previews use a permission-preserving filename/ID/link fallback. No thumbnails fetched, permissions weakened or asset availability/approval inferred. Only campaign_outputs supplies approved-output records.

## Verification

Backend tests: authentication/cookie/origin/expiry, anonymous/writer/Bearer-only rejection, safe DTO fields and query allowlists, synthetic 36-service adapter, IDEA products, campaign progress, empty performance, 27 warning projection, bounded pagination and missing original added dates. Existing inventory/event/security regressions pass.

Frontend check/build pass. Synthetic model tests cover derived NOW deduplication, at most five actionable P0/P1, concrete next steps, inclusive five-day due window, overdue exclusions, exact dates/quarter separation, failed-refresh retention and explicit snapshot support. Public build contains empty inventory; an injected private sentinel is excluded. No business rows, secrets, purchase costs or margins are bundled.

Chromium browser QA uses an externally supplied synthetic fixture: new navigation, 36 services, separate current/proposed prices, IDEA product IDs, canonical output, calendar dates/quarters, warning count, empty social metrics, no automatic report request after 61 seconds, manual refresh, error retention and zero browser runtime errors. Screenshot is synthetic and kept outside the public build.

## Proposed mitigation / remaining steps

1. Review coordinated PRs. Backend must be activated before the matching frontend, only after owner merge/deploy approval.
2. Configure server-only SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the private Vercel service. No live privileged REST credential was available to this execution; real REST/cookie production readback remains an activation gate.
3. Verify cookie behavior in the user's browser. GitHub Pages and Vercel are different sites; third-party-cookie blocking can prevent authenticated reads. A same-site UI/API deployment is a separate deployment decision, not a reason to expose credentials.
4. Preserve legitimate WARN facts: owners/prices/publication evidence/legacy filenames remain unknown. Do not guess them to make QA green.
5. Parallel PostgREST reads publish one complete DTO, not a transactional database snapshot. A future atomic RPC requires separate schema authorization. Pagination assumes no concurrent insertion/removal during the bounded read.

QA verdict: implementation tests/build/browser/privacy PASS. Production activation/readback NOT PERFORMED. No claim of deployment or real Drive accessibility verification.


## Pre-merge activation review — 09-10-2026

### Why / finding

Backend-first activation with /api/report returning 410 would break the still-deployed pre-V2 frontend before its own release. Synthetic browser QA also did not prove third-party-cookie behavior for Pages → Vercel, particularly on tablet/Safari.

### Compatibility decision / correction

Restore the previous authenticated GET /api/report handler and sanitized response/error contract without requiring Supabase configuration. It is explicitly DEPRECATED with successor /api/dashboard; no removal date is fabricated. Anonymous/writer access remains rejected. Old GitHub ingestion is retained. The V2 frontend exclusively requests cookie-authenticated /api/dashboard; canonical business authority and V2 selection/refresh/snapshot/demo logic are unchanged. Remove compatibility only in a separate cleanup after confirmed V2 production cutover.

### Deployment review / proposed mitigation

Read-only Vercel metadata confirms service project lf-interactive-file-map-service (Node 24, framework unset), with one verified lf-interactive-file-map-service.vercel.app domain. Repo config currently directs the Pages frontend there; service/public contains only a placeholder. No real cross-site login/session, privileged REST read or production PC/tablet/Safari test was performed. Production cookie support remains NOT VERIFIED; mocked Chromium QA is insufficient evidence.

Recommended smallest robust topology: the existing safe Control Center shell and authenticated /api/* on the exact same HTTPS origin in the Vercel application. This needs a separate implementation PR for shell build/routing, same-origin requests and appropriate private UI entry protection; do not implement it in these compatibility fixes. Preserve the existing public Pages/file-map experience. Primary topology/security/activation documentation: private backend service/README.md, Recommended topology / activation gate. Future CRM can share the origin, but identity/roles/revocation need separate auth scope. Same-site custom subdomains are an owner-approved alternative, with CORS still required; no domain is assumed available. No DNS/domain/deployment changes made.

### Verification / activation sequence

Backend regression confirms old production Bearer client can log in and read the legacy projection with no Supabase variables, GET remains 200, deprecation is present, wrong methods remain rejected and provider errors are sanitized. Existing secure dashboard and private-field exclusion tests remain. Frontend regression verifies /api/dashboard-only credentialed live fetch; public build/sentinel/privacy, manual refresh and snapshot tests remain.

After owner approval: (1) backend environment/activation with compatibility intact; (2) old production frontend and independent file-map readback; (3) separately implemented same-origin target and real authenticated Supabase readback on PC/tablet/Safari; (4) V2 frontend cutover and manual-refresh/logout verification; (5) separate /api/report cleanup only after confirmed cutover. Until those gates pass, V2 production activation stays pending.

Verification result for this fix: backend tests/build PASS (12 passed, 1 optional real-Redis integration skipped because LF_REDIS_TEST_PORT is not configured); frontend tests/build PASS (43 tests), plus synthetic Chromium regression PASS. Secure dashboard cookie tests and purchase-cost/margin/credential exclusion pass; public-build sentinel/privacy checks pass. Real production cookie/API verification NOT PERFORMED. No merge or deployment performed. Supabase schema/business rows/RLS, Drive permissions and routing/governance were not changed.
