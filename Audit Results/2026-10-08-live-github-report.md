# Live GitHub report implementation QA — 2026-10-08

Reason: stop requiring a new manual snapshot for canonical Markdown changes.

Findings: production service had no report route; report refresh recalculated an imported snapshot. GitHub and non-MD provider freshness must remain separate. Viewer authentication and origin restrictions remain required for all private report data.

Implementation: authenticated server-only GitHub projection from one pinned main revision; current NOW categories/dates, master context and discovered campaign briefs. Frontend connection, manual refresh and 60-second polling update the canonical projection. Imported Sheets/Drive records and prices retain their original source timestamps. Credentials remain session-memory only. Provider failure retains the previous report with an error, never a false fresh timestamp. Logout clears the report.

Verification: service authentication/provider tests; frontend reconciliation/privacy tests; synthetic browser connection/manual refresh/failure/logout QA and existing desktop/mobile regression QA. Actual production viewer login requires the owner's existing password and is not fabricated from local tests.

Mitigation / next steps: connect the service and verify the current GitHub revision in the report. If server GH_TOKEN cannot read lady-fitness-core, extend its repository access; do not send the token to the browser. Sheets/Drive live integration remains separate. After browser reload, reconnect the viewer session; no Markdown snapshot import is needed while connected.
