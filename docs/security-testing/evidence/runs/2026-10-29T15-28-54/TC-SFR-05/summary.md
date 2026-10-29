# TC-SFR-05: Database access control

Status: **PASS**  ·  2026-10-29T15:29:34.136Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 npm run test:sfr05:rls | exit 0, no failures | exit 0; SFR-05 DB-level RLS test: 24 passed, 0 failed, 1 skipped | PASS |
| 2 | 2 npm run test:sfr05:authz | exit 0, no failures | exit 0; Failed:       0 | PASS |
| 3 | 2 npm run test:sfr05:workflows | exit 0, no failures | exit 0; Phase 2 Test Summary: 28/28 PASSED (0 failed) | PASS |
| 4 | 3 browser bundle (.next/static) scanned | 57 files, 0 contain the key or supabaseAdmin | 57 files, 0 contain it | PASS |
| 5 | 3 page HTML / | no service-role key | not found | PASS |
| 6 | 3 page HTML /member | no service-role key | not found | PASS |
| 7 | 3 page HTML /member/events | no service-role key | not found | PASS |
| 8 | 3 page HTML /member/benefit | no service-role key | not found | PASS |
| 9 | 3 page HTML /member/community | no service-role key | not found | PASS |
| 10 | 3 page HTML /member/profile | no service-role key | not found | PASS |
| 11 | 4 key read only in lib/supabaseServer.ts | lib/supabaseServer.ts | lib/supabaseServer.ts | PASS |
| 12 | 4 no NEXT_PUBLIC_ service-role variable | none | none | PASS |
| 13 | 4 lib/supabaseServer.ts refuses to load in a browser | throws when window is defined | guard present | PASS |
| 14 | 4 no component imports the server client | 0 files | 0 files | PASS |
| 15 | 5 no committed file contains the UAT account password | 0 files | 0 files | PASS |
