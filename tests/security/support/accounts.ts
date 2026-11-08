// UAT accounts used by the SNFR-04/05 security tests.
//
// These are deliberately different from the accounts the SFR-05 suites use
// (member1, member2, admin2) so the two sets of tests never edit the same records.
// admin1 is not used: its password was changed outside the test suite.
// All UAT members are on the basic tier; tier tests create their own tier-locked
// content instead of changing a member's tier.
export const ACCOUNTS = {
  admin: "admin3@uat.pergas.org",
  memberA: "member3@uat.pergas.org",
  memberB: "member4@uat.pergas.org",
  memberC: "member5@uat.pergas.org",
} as const;

export type AccountRole = keyof typeof ACCOUNTS;

export function uatPassword(): string {
  const password = process.env.UAT_PASSWORD;
  if (!password) {
    throw new Error("UAT_PASSWORD is not set. Add the shared UAT test-account password to .env.local.");
  }
  return password;
}
