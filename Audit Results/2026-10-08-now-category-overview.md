# NOW category overview review — 2026-10-08

Reason: organize important NOW items and NEXT STEPS by source category; replace obsolete overview blocks with five newest NOW additions.

Findings: category comes from the explicit category/area field. Dates must be valid added dates; modification/import timestamps and priority cannot determine newest additions. Missing dates produce an explanatory empty state. Selection remains at most five important/NEXT items overall before grouping. Decisions remain accessible in their dedicated page.

Changes: vertically stacked category groups; removed PENDING DECISIONS and NEW PRODUCTS / SERVICES ADDED from overview; added NEW NOW items ADDED with visible added dates and strict date ordering.

Validation: unit checks and public build PASS; synthetic browser QA PASS for desktop/mobile, category grouping, latest-five order, removed blocks, navigation, export, theme persistence and zero runtime errors. No private fixtures are published.

Mitigation / next steps: populate missing canonical added dates through an independently authorized source-maintenance task, then import a refreshed snapshot. The report never invents them.

## Follow-up verification — current category schema

Reason: reported missing grouping and current NOW category column. Fresh canonical NOW blob `1e7976745a6b0055e858fe1c17f0c4c65ec47524` confirms Kategória replaces the legacy Oblasť field and includes explicit added dates. The earlier date finding applies only to the earlier source revision, not current main.

Findings / correction: current category must be projected explicitly, used for the NOW filter and grouping; legacy area must not silently substitute for the four-category model. Asset revision changed so cached modules reload. A read-only NOW projection refresh preserves all other source payloads and timestamps; current business values are copied from canonical NOW, never edited.

Validation: unit tests, synthetic desktop/mobile browser QA and private current-source import check. Mitigation: import the privately delivered refreshed snapshot; automatic live GitHub report refresh remains a separate integration.
