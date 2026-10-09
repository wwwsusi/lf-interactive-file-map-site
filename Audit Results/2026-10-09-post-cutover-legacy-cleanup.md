# Legacy frontend retirement — 2026-10-09

Why: owner approved cutover and confirmed legacy Pages and Markdown CLI reporting are unused. This main branch remains explicit offline analysis/technical inventory only.

Findings: main app still called the retired business report; README/help recommended the obsolete CLI; Pages workflow could republish obsolete UI. Removed CLI entrypoints and Pages publication workflow, replaced legacy report fetch with an explicit retired-path error, updated README/help. Shared offline parser libraries/tests and import/demo/technical map remain.

QA: frontend check (7 test files) PASS; public build PASS; no active report API fetch or CLI documentation remains. Production V2 source branch and immutable pin unchanged.

Mitigation: review PR; after frontend main merge, owner must GitHub Settings → Pages → Unpublish site. Workflow deletion alone does not unpublish existing content. No redirect/private URL added.

The primary cross-repository dependency proof, backend changes and V2/session verification are in [backend cleanup audit](https://github.com/wwwsusi/lf-interactive-file-map/blob/codex/post-cutover-legacy-cleanup/docs/Audit%20Results/2026-10-09-post-cutover-legacy-cleanup.md). Git history preserves deleted implementations. No merge/deploy or data/settings changes in preparation.
