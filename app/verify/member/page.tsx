import type { Metadata } from "next";
import MembershipVerification from "@/components/MembershipVerification";

export const metadata: Metadata = {
  title: "Pergas Membership Verification",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function VerifyMemberPage({ searchParams }: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return <MembershipVerification token={typeof token === "string" ? token : ""} />;
}
