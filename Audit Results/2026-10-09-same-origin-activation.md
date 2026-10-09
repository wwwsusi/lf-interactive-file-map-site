# Same-origin activation audit

## Why
Remove third-party-cookie dependency for private Control Center while preserving public Pages/file-map compatibility.

## Findings and results
A separate build profile locks API calls to the shell origin and includes cookies for login/dashboard/logout/inventory/events. No JS bearer is retained in this profile. Pages retains its existing remote profile. Both builds use one canonical allowlist, empty graph and synthetic demo only. Tests/build pass; local HTTPS Chromium with the real handler validates Secure/HttpOnly/Lax cookie, anonymous denial, authenticated dashboard, manual refresh retention, logout and expiry. Existing Pages synthetic browser regression passes. These checks do not prove production Safari/tablet behavior.

## Next mitigation steps
Stacked implementation PR follows frontend #10; retarget to main after #10 merges. Backend shell pin must point to the exact reviewed frontend commit. Activate only in the owner-approved sequence documented in backend service README. Verify actual production Chrome/Safari/tablet, cookie expiry/logout and Supabase readback before declaring V2 primary. No production activation, business/governance/schema change or approval is recorded.
