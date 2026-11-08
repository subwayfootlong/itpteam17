# TC-SNFR-01: Secure session configuration

Status: **PASS**  ·  2026-11-08T13:55:13.735Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 login: token cookie | HttpOnly; Secure; SameSite=Lax\|Strict; Path=/; Max-Age | all set (SameSite=lax, Max-Age=604800) | PASS |
| 2 | 2 login: last_activity cookie | HttpOnly; Secure; SameSite=Lax\|Strict; Path=/; Max-Age | all set (SameSite=lax, Max-Age=604800) | PASS |
| 3 | 3 throwaway registration succeeds | 200 | 200 | PASS |
| 4 | 3 register: token cookie | HttpOnly; Secure; SameSite=Lax\|Strict; Path=/; Max-Age | all set (SameSite=lax, Max-Age=604800) | PASS |
| 5 | 3 logout clears token with matching attributes | Max-Age=0; HttpOnly; Secure; SameSite | Max-Age=0; HttpOnly; Secure; SameSite=lax | PASS |
| 6 | 4 token has an expiry of 7 days | 604800 s | 604800 s | PASS |
| 7 | 4 cookie Max-Age matches token lifetime | 604800 s | 604800 s | PASS |
| 8 | 5 session lifetime (7 days) documented | documented | in docs\setup.md | PASS |
| 9 | 5 idle timeout (15 minutes) documented | documented | in docs\setup.md | PASS |
