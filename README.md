# Lady Fitness Control Center V2 — current implementation

Review branch; not merged or deployed. The private service now provides cookie-authenticated `/api/dashboard` backed by current Supabase data. The public shell fetches it on connection and on **Obnoviť report** only. File-map inventory/events retain their independent polling.

Structured current facts come from Supabase. GitHub narrative links remain references; 01_NOW parsing and Google Sheets do not supply live prices, priorities or statuses. Live results replace the whole projection, never merge onto a legacy snapshot. A failed refresh retains the last good projection with STALE / ERROR. Last successful backend read and projection generation timestamps are separate.

Navigation: Overview / Calendar / Services / Products / Campaigns / Management / Data Quality / Files. Exact dates display DD-MM-YYYY; quarters stay separate. Services show current and proposed prices independently. Products with lifecycle IDEA retain LF-PROD identities. Canonical campaign progression is DRAFT 25%, PREPARING 50%, PUBLISHED 75%, COMPLETED 100%. Final outputs come only from campaign_outputs; working assets never become approved outputs. Drive references use permission-preserving links with exact filenames/IDs, without automatic external image requests. Empty social metrics show "No performance data yet".

Modes: **LIVE SUPABASE**, **SNAPSHOT**, **DEMO**. Explicit imported projections are marked SNAPSHOT even if exported from a live response. They persist only by the existing explicit local import. Legacy snapshots remain historical; no private snapshot is bundled. Demo contains synthetic data. Public build allowlists source files/fonts and emits an empty graph. Authenticated operational data stays in session memory unless the user explicitly exports/imports it.

Backend environment and cookie activation details: [private service README](https://github.com/wwwsusi/lf-interactive-file-map/blob/codex/control-center-supabase-v2/service/README.md). GitHub Pages → Vercel cross-site cookie support is **NOT production-verified**; mocked Chromium QA does not verify tablet/Safari behavior. Recommended durable target: this existing safe frontend and /api/* on the same HTTPS origin in the Vercel application. It needs a separate implementation PR; this PR only documents it. Existing public Pages/file-map functionality must remain. See the private service README for the primary topology/activation gate. No privileged credential belongs in this repository/config/build/Actions artifact.

Checks: `npm run check`, `npm run build`. Optional browser QA: `python scripts/qa-supabase-browser.py /path/to/synthetic-projection.json` with Python Playwright + Chromium. Its fixture is supplied externally and must contain synthetic data. [V2 audit](Audit%20Results/2026-10-09-supabase-data-layer.md).

Next activation requires owner approval: activate the backward-compatible backend first, verify the existing production /api/report frontend still works, then perform real /api/dashboard readback on the chosen same-origin topology and supported PC/tablet/Safari. Release the matching V2 frontend only after that gate. Keep /api/report DEPRECATED during transition; remove it in a separate cleanup after verified frontend cutover. V2 live code exclusively uses /api/dashboard. No domain/DNS change, merge or deployment was performed.

---

## Historical implementation documentation — superseded for live operational authority

The following earlier release notes are retained as history. Their offline-only/GitHub/NOW/Sheets descriptions do not describe V2 live mode.

# LF Interactive file map — operating dashboard

Read-only Slovak operating dashboard in the existing application. **Prehľad** is the default; **Mapa zdrojov** preserves the graph, search, filters, imports, evidence and registered-operation history. Other views: Kampane a obsah, Ponuky, Smer a nápady, Stav zdrojov.

This public repository contains code, licensed fonts, an empty graph and clearly synthetic demo data only. Business records, internal document names/URLs/IDs, original exports and credentials belong to the private service and canonical sources. Do not commit them here or upload them as public CI artifacts.

## Use

Import a private JSON snapshot using **Importovať snapshot** on the overview. No Google OAuth, API client credentials or provider requests are required by this browser. **Obnoviť report** recomputes the imported projection only and never updates source or import timestamps. New canonical facts require a newly prepared and imported snapshot. Source snapshot time/age, successful reads and local import time are distinct; missing dates stay unknown.

Import accepts the existing graph JSON, dashboard projection v1, or the combined format below. A graph-only import remains a file inventory and cannot populate business facts. Explicit user imports (including business projections) are saved only in this browser's IndexedDB, never uploaded; **Vymazať uložený snapshot** removes that copy. Do not import sensitive files on a shared device. No private snapshots are bundled or committed.

The configured secure service remains optional for the map and registered-operation history. Login/polling do not request `/api/dashboard`. Connecting retains the explicitly imported report; disconnecting clears displayed dashboard, details, graph and history; an explicitly saved snapshot remains until deleted and can be restored by reload. Home / Reset clears map filters and returns to Prehľad. Synthetic demo is separate and never persisted.

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

## Offline architecture and import contract

Canonical sources → explicit read-only export through an authorized tool → private snapshot → validated user import → browser-only dashboard. The export is derived evidence, never a second editable business master. An export may be partial and must preserve source errors, read times, provenance and conflicts. Do not infer campaign facts from graph names or links.

Combined snapshot JSON:

```json
{"format":"lf-operating-snapshot","version":1,"graph":{"nodes":[],"edges":[]},"dashboard":{"schema_version":1,"generated_at":null,"sources":[],"items":[]}}
```

Either `graph` or `dashboard` may be omitted, but not both. Old graph-only imports remain supported. The frontend never generates a fake business projection from inventory. Prepare updated private exports separately; do not commit/upload provider data as public CI artifacts.

Dashboard JSON v1:

```json
{
  "schema_version": 1,
  "generated_at": "2026-01-01T00:00:00Z",
  "sources": [{"id":"synthetic-source","title":"DEMO source","status":"ok","last_success_at":"2026-01-01T00:00:00Z","modified_at":null,"url":null}],
  "items": [{"id":"synthetic-item","kind":"task","title":"DEMO task","source_id":"synthetic-source","fields":{"priority":"P0","task_status":"to-do","next_step":"DEMO step"},"related_ids":[],"links":[],"conflicts":[],"provenance":{"owner":"DEMO","anchor":"synthetic-anchor","identity":"synthetic"}}]
}
```

Kinds: task, campaign, output, asset, service, product, idea, direction, decision, change. Source states: ok/error/missing/blocked. Timestamps distinguish document modification, successful provider read and projection assembly. Conflicts contain a field plus source/value pairs. Fields preserve source uncertainty. Known headers/identities are validated; schema changes produce an error. Imports are read-only. No editing or manual business overrides.

Brand: adult canonical pink/navy, white, pastel and neutral; locally hosted Inter for UI and Oswald for display headings. Font copyright and SIL OFL are bundled in `web/fonts/OFL.txt`; no external font calls or substituted logo.

## Validation / build / release

Node.js 22+, no npm dependencies. `npm run check`, `npm run build`. `scripts/build.mjs` uses an explicit code/font allowlist and always emits an empty public graph. Tests cover status mapping, conflicts, stale/error data, publication evidence, session clearing and public artifact privacy. Browser QA covers desktop/mobile, empty/demo/error, keyboard, reduced motion and logout.

**This change is prepared for review, not deployed.** The selected dashboard mode is offline snapshot import; Google OAuth is not a release prerequisite. Existing production graph/events are independent. The previously prepared optional private dashboard API is not called by this frontend and is not required for the offline release.

GitHub Pages deploys only main. Do not merge or deploy without the owner's further instruction. No new OAuth privacy-policy page or credentials are needed for this mode.

Overview uses two desktop columns with scoped evidence counts, an accessible idea-state donut and explicit partial coverage. Current/proposed pricing stays distinct; absent proposals remain TBD. Historical prices are not proposed prices. Report refresh is local only; the UI states that new data requires a new import.

Service views distinguish ACTIVE, IDEA/PROPOSED, PREPARING/PILOT and other lifecycle values from the imported register. ACTIVE never implies confirmed availability. Idea counts include service candidates by stable service ID without duplicating records or mixing NOW tasks. Service details retain descriptions, audience, value, included items, booking route and capacity when present; absent values stay TBD.

CEO reporting v2 now separates the full NOW register from a maximum of five
P0/P1 actionable NEXT items. Business decisions require explicit
`decision_type: business`; unclassified open questions appear in Data Quality.
Conflicted campaigns are excluded from the unambiguous running/preparing list.
The AI JSON download exports the complete imported projection with source
provenance, snapshot/import times, view IDs and current UI filters. Refresh only
recalculates the imported snapshot; it never refreshes provider read timestamps.

NOW provides priority, task status, area and owner filters; Services independently
filters availability and audience/type. Stable LF-SVC IDs merge into one entity,
retaining conflicting field values and additional source provenance. Ideas use
only explicit FOCUS NOW/LATER/PARKED classifications; otherwise UNCLASSIFIED.
Campaign coverage reports missing or unavailable GitHub briefs separately from
creative approval and publication evidence. Public builds contain no imported
business snapshots; use explicit private JSON import for current reporting data.

### Compact reporting / campaign ingestion

Overview uses stacked, full-width sections. NOW and NEXT are separate projections
(maximum five rows on Overview); services, campaign states and Facebook posts use
compact tables. ACTIVE is independent of current availability. Colors map status
semantics without changing the canonical value. Unknown/conflicting campaign
lifecycle appears in REVIEW. Business decisions still require explicit evidence;
missing supplier, dates and metadata remain data gaps.

The former `coverage:campaign-details` was a synthetic coverage marker, not a
provider source. It is excluded from source counts and replaced by per-campaign
brief availability. Source reads older than 24 hours are marked stale; failed
reads retain their original successful timestamps. Refresh never refreshes these
timestamps. A real GitHub discovery/API failure remains a named unavailable source.

Campaign discovery is a read-only local/server-side snapshot step, not an
unauthenticated browser call into the private repository:

```sh
node scripts/enrich-campaign-briefs.mjs /outside/repo/input.json /outside/repo/new-output.json
```

Use `GH_TOKEN` or `GITHUB_TOKEN` from the execution environment when needed. The
script resolves `lady-fitness-core/main`, pins its SHA, discovers only matching
`MD campaigns/LF_CAMPAIGN_<SLUG>/LF_CAMPAIGN_<SLUG>_BRIEF.md` paths, reads briefs,
and joins only an exact Business Campaign ID or explicit storage slug/link.
It never falls back to Drive Markdown, writes canonical files, updates Sheets,
or changes campaign approval. Previous successful briefs remain stale on read
failure. Output must be a new file outside this public repo (mode 0600). Scripts,
provider payloads and private snapshots are excluded from the public build.
Import the enriched snapshot explicitly; service connection still only supplies
map/event data. Old imports need enrichment to include current canonical briefs.

An available asset link means recorded evidence, not verified publication or
anonymous file access. Drive media is linked rather than automatically embedded.
Post-specific objectives missing in the output register remain TBD; a campaign
objective is not silently substituted. New-product dates are shown only when the
source supports them; unknown dates do not establish a newest-first business fact.

## Same-origin activation profile

Default `npm run build` preserves GitHub Pages. `node scripts/build.mjs --profile=same-origin --output=/tmp/lf-shell` emits the same canonical allowlisted frontend with relative `/api/*`, cookie credentials and a locked service address. No private source data is read during either build. The Vercel service consumes an immutable reviewed commit with per-file Git blob integrity checks; do not maintain a second frontend source copy.

Same-origin local HTTPS Chromium QA passed. This is not production Chrome/Safari/tablet verification. Keep the existing Pages endpoint/profile until owner-approved production cutover. No merge/deployment is performed by this implementation.
