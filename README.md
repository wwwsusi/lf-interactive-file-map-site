# LF Interactive file map — operating dashboard

Read-only Slovak operating dashboard in the existing application. **Prehľad** is the default; **Mapa zdrojov** preserves the graph, search, filters, imports, evidence and registered-operation history. Other views: Kampane a obsah, Ponuky, Smer a nápady, Stav zdrojov.

This public repository contains code, licensed fonts, an empty graph and clearly synthetic demo data only. Business records, internal document names/URLs/IDs, original exports and credentials belong to the private service and canonical sources. Do not commit them here or upload them as public CI artifacts.

## Use

Connect the configured secure service with your owner passphrase. The one-hour viewer token and dashboard data stay in memory only. Reload requires login again. Disconnect/expiry clears dashboard items, details, graph and operation history from memory and screen; late responses cannot restore the session.

The dashboard does not change prices, task statuses, approvals or publication. Its detail panel links to canonical evidence and the associated map source. Source failures show an error and preserve the age of the last successful snapshot. A missing source is not a successful empty result.

Manual graph import remains an explicitly selected, separate feature: its JSON is saved in this browser's IndexedDB and never uploaded. **Vymazať uložený graf** deletes it. Disconnect clears the displayed graph, but does not silently delete an explicitly saved import; a later reload can restore that manual import in the map view. Authenticated inventory and dashboard projections are never saved there. Home / Reset clears map filters and returns to Prehľad.

Synthetic dashboard demo and synthetic activity demo are separate from authenticated business records. Neither writes to the service.

## Ownership and semantics

| Projection | Canonical owner |
|---|---|
| Central operations, priority, task status, next step | Single canonical operations list; next steps and priorities are views of the same items |
| Current campaign detail and local pending actions | Campaign brief |
| Global relationships, assets, approval/publication evidence | Creative register |
| Services, current price and availability | Services register |
| Retail product facts and current price | Product catalogue |
| Retail candidates | Proposals tab; never promoted to approved automatically |
| Strategic direction and open questions | Relevant thematic owner; summaries link back |
| Commit/implementation evidence | GitHub; never a substitute for business facts |

Verified task mapping: `to-do` → `NEZAČATÉ`; `preparing` → `V PRÍPRAVE`; `running` → `PREBIEHA`. This mapping applies only to task status. Lifecycle, Proposed/Executed placement, creative state, approval and publication are separate dimensions.

`APPROVED` does not imply publication; placement does not imply either. Reported publication without explicit platform verification and a publication link displays **Publikovanie oznámené · platformovo neoverené**. A commit on main does not verify deployment. Unknown dates, owners, prices and metrics stay TBD. Relative dates remain source text, never inferred calendar dates.

Records join only through stable business IDs and file IDs. Missing IDs use labelled derived source anchors; changes to a source's title can change that anchor. No name matching or row-number joins. Conflicting values retain both sources; no newest-timestamp resolution.

## Architecture and API

Canonical providers → secured read-only adapters → validation → rebuildable per-source projection/cache → authenticated `GET /api/dashboard` → memory-only dashboard. The existing private service is extended; no new backend/repository. Graph remains `GET /api/inventory`, with registered-operation endpoints unchanged.

Dashboard JSON v1:

```json
{
  "schema_version": 1,
  "generated_at": "2026-01-01T00:00:00Z",
  "sources": [{"id":"synthetic-source","title":"DEMO source","status":"ok","last_success_at":"2026-01-01T00:00:00Z","modified_at":null,"url":null}],
  "items": [{"id":"synthetic-item","kind":"task","title":"DEMO task","source_id":"synthetic-source","fields":{"priority":"P0","task_status":"to-do","next_step":"DEMO step"},"related_ids":[],"links":[],"conflicts":[],"provenance":{"owner":"DEMO","anchor":"synthetic-anchor","identity":"synthetic"}}]
}
```

Kinds: task, campaign, output, asset, service, product, idea, direction, decision, change. Source states: ok/error/missing/blocked. Timestamps distinguish document modification, successful provider read and projection assembly. Conflicts contain a field plus source/value pairs. Fields preserve source uncertainty. Known headers/identities are validated; schema changes produce an error. The API is read-only and uses no-store. No editing or manual cache overrides.

Brand: adult canonical pink/navy, white, pastel and neutral; locally hosted Inter for UI and Oswald for display headings. Font copyright and SIL OFL are bundled in `web/fonts/OFL.txt`; no external font calls or substituted logo.

## Validation / build / release

Node.js 22+, no npm dependencies. `npm run check`, `npm run build`. `scripts/build.mjs` uses an explicit code/font allowlist and always emits an empty public graph. Tests cover status mapping, conflicts, stale/error data, publication evidence, session clearing and public artifact privacy. Browser QA covers desktop/mobile, empty/demo/error, keyboard, reduced motion and logout.

**This change is prepared for review, not deployed.** Live business connection remains BLOCKED until server-side Google read-only OAuth access is configured and verified, then an explicitly authorized release passes authenticated end-to-end QA. A successful frontend build is not live-source verification. Existing production graph/events are a separate capability.

GitHub Pages workflow deploys only main. The private service review branch disables automatic Vercel deployment. Do not merge or deploy the dashboard without the owner's further instruction.

Overview uses two desktop columns with evidence counts and an accessible idea-state donut. Counts are scoped to the loaded projection, with partial coverage shown. Offers compare current and explicitly proposed prices; absent proposals stay TBD, never inferred from historical prices. Manual report refresh requests `/api/dashboard?refresh=1`, bypasses source cache freshness, and retains last successful source data on failure. Demo refresh is synthetic only. No deployment is authorized by this change.
