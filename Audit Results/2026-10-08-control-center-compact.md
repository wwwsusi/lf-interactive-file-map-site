# Control Center compact UI / projection audit — 2026-10-08

## Why
The owner requested an information-dense internal dashboard with table-first
services and Facebook outputs, clear lifecycle colors, full-width Overview and
canonical GitHub campaign discovery. This audit contains implementation evidence
only. It does not contain business payloads or redefine canonical facts.

## Findings and changes
- An inherited first-group CSS override forced large single-column cards.
  Replaced scattered dashboard overrides with one token-based UI system.
- The former `coverage:campaign-details` was a synthetic coverage marker.
  Replaced it with per-campaign brief availability and real GitHub discovery
  source errors. Old imported markers are excluded from provider counts.
- Services use explicit lifecycle and availability fields in compact tables.
  The previous current/proposed price comparison has been removed.
- Overview sections are stacked in the requested order, with maximum five
  priority/NEXT/decision rows. Full NOW remains a separate clickable register.
- Campaign display groups do not mutate raw lifecycle. Conflicts/unmapped
  statuses remain REVIEW; publication claims remain separate from approval.
- FB posts expose goal, MD brief and image-link evidence separately. Missing
  post-specific goals are not inferred from a campaign name or objective.

## Verification
- npm run check: PASS, including source discovery, identity joins, partial
  failure retention, status semantics, source counts and availability tests.
- npm run build: PASS; strict allowlist and empty public inventory retained.
- Real Chromium browser QA: PASS for all requested layouts, dark/light mode,
  desktop/mobile overflow, import persistence, modal details, AI export and map.
- Overview, NOW, Services and Campaigns screenshots use synthetic data only.
- Live provider evidence was read through an authorized connector and stored
  outside this public repository. No source payloads are part of this audit.

## Mitigation / next steps
Import an enriched private snapshot to replace old coverage-only imports.
Use scripts/enrich-campaign-briefs.mjs in an authorized local/server execution
with read-only GitHub access; output is forced outside this public repository.
Google Sheets retain their original read times and need a new authorized read
for current prices/statuses. No OAuth or automatic provider refresh is added.
Unknown Campaign IDs, post goals, approval and live publication evidence remain
TBD or per-entity warnings. A link does not prove publication or anonymous access.

## Boundaries
NO BUSINESS DATA CHANGED
NO CANONICAL MD CHANGED
NO PRIVATE DATA COMMITTED
