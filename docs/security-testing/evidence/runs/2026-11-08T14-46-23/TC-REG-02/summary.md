# TC-REG-02: Regression: admin and member save actions complete

Status: **PASS**  ·  2026-11-08T14:47:04.959Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 admin creates a benefit | 201 | 201 | PASS |
| 2 | 1 admin edits the benefit | 200 | 200 | PASS |
| 3 | 1 benefit edit saved | 15% off | 15% off | PASS |
| 4 | 1 admin deletes the benefit | 200 | 200 | PASS |
| 5 | 1 benefit deleted | 0 rows | 0 rows | PASS |
| 6 | 2 admin creates a payment method | 200 or 201 | 201 | PASS |
| 7 | 2 admin edits the payment method | 200 | 200 | PASS |
| 8 | 2 admin deletes the payment method | 200 | 200 | PASS |
| 9 | 2 payment method deleted; real active method untouched | 0 rows; 1 active | 0 rows; 1 active | PASS |
| 10 | 3 admin creates a draft event | 201 | 201 | PASS |
| 11 | 3 admin edits the event | 200 | 200 | PASS |
| 12 | 3 admin deletes the event | 200 | 200 | PASS |
| 13 | 3 event deleted | 0 rows | 0 rows | PASS |
| 14 | 4 admin edits a member (memberC) | 200 | 200 | PASS |
| 15 | 4 member edit saved | [security-test] REG | [security-test] REG | PASS |
| 16 | 5 member submits a tier-upgrade request | 201 | 201 | PASS |
| 17 | 5 admin approves it | 200 | 200 | PASS |
| 18 | 5 member's tier updated | student | student | PASS |
| 19 | 6 member votes in the announcement poll | 200 | 200 | PASS |
| 20 | 6 vote saved | yes | yes | PASS |
| 21 | 7 member changes their password | 200 | 200 | PASS |
| 22 | 7 member signs in with the new password | 200 | 200 | PASS |
| 23 | 7 old password no longer works | 401 | 401 | PASS |
| 24 | 7 member changes it back | 200 | 200 | PASS |
| 25 | 7 original password works again | 200 | 200 | PASS |
| 26 | 8 member saves notification settings | 200 | 200 | PASS |
| 27 | 8 settings read back changed | event = false | event = false | PASS |
| 28 | 8 settings restored | 200 | 200 | PASS |
