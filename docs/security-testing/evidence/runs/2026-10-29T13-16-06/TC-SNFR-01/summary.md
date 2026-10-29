# TC-SNFR-01: Secure session configuration

Status: **FAIL**  ·  2026-10-29T13:18:02.924Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 login: token cookie | HttpOnly; Secure; SameSite=Lax\|Strict; Path=/; Max-Age | missing: Secure, SameSite | **FAIL** |
| 2 | 2 login: last_activity cookie | HttpOnly; Secure; SameSite=Lax\|Strict; Path=/; Max-Age | missing: Secure | **FAIL** |
| 3 | 3 throwaway registration succeeds | 200 | 200 | PASS |
| 4 | 3 register: token cookie | HttpOnly; Secure; SameSite=Lax\|Strict; Path=/; Max-Age | missing: Secure, SameSite | **FAIL** |
| 5 | 3 logout clears token with matching attributes | Max-Age=0; HttpOnly; Secure; SameSite | Max-Age=0; HttpOnly | **FAIL** |
| 6 | 4 token has an expiry of 7 days | 604800 s | 604800 s | PASS |
| 7 | 4 cookie Max-Age matches token lifetime | 604800 s | 604800 s | PASS |
| 8 | 5 session lifetime (7 days) documented | documented | not found in README.md, docs\setup.md, docs\project-overview.md, docs\workflow.md | **FAIL** |
| 9 | 5 idle timeout (15 minutes) documented | documented | not found in README.md, docs\setup.md, docs\project-overview.md, docs\workflow.md | **FAIL** |
