# LF file-map frontend — legacy main / offline analysis

## Operational disposition

The owner confirmed this GitHub Pages dashboard and the manual Markdown current-state CLI tools are no longer used for Lady Fitness operations. Current operations use the private Supabase-backed V2 application. This `main` branch is retained for explicitly labelled offline snapshot analysis and technical file-map/event functionality; it is not a supported live business dashboard.

The Pages publication workflow is removed. **One owner setting remains:** repository Settings → Pages → Unpublish site. Removing a workflow alone does not unpublish an existing deployment. Do not re-enable automatic Pages publication or restore a legacy live report caller. No public redirect or private deployment URL is added here.

The immutable production V2 frontend source is maintained separately and consumed through the backend checksum manifest. This cleanup does not modify that source branch or the manifest.

## Removed tools and retained dependencies

`scripts/refresh-now.mjs` and `scripts/enrich-campaign-briefs.mjs` are removed from active tooling. Git history preserves their original implementation. They must not be used to obtain current business facts.

`scripts/lib/now-ingestion.mjs` and `scripts/lib/campaign-ingestion.mjs` remain only as offline/historical parsers with existing synthetic tests. Shared browser validation, reporting, graph, import and event modules remain. Offline parsing does not confer current-state authority on Markdown or Sheets.

## Explicit offline import

Import a user-prepared JSON snapshot via Importovať snapshot. The snapshot is derived read-only evidence, labelled SNAPSHOT, never current operational truth. A graph-only import supplies technical inventory, not business facts. Imported records retain provenance, errors and original read times. Obnoviť report recomputes the snapshot without refreshing its source timestamps.

Explicit imports are stored only in this browser's IndexedDB and removed through Vymazať uložený snapshot; use a trusted device. Synthetic demo is separate. No private snapshots, credentials or provider data may be committed or uploaded as public artifacts. The same-origin production profile does not silently restore imported business snapshots.

The independent secure-service connection may supply technical inventory and registered-operation history. The removed legacy live business endpoint is not called from this branch. Status, lifecycle, approval and publication remain separate; unknown values stay unknown.

## Build and validation

Node.js 22+: `npm run check`, `npm run build`. The explicit code/font allowlist generates an empty public graph and synthetic demo only. The PR QA workflow remains; Pages publication is decommissioned. Inter/Oswald licence files remain bundled. No database, auth/session or business-data change is included.

Dated audit evidence remains historical, not executable release instructions.
