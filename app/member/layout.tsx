import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import SessionTimeout from "@/components/SessionTimeout";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!await getCurrentUser()) redirect("/?screen=login");

  return (
    <>
      <SessionTimeout />
      {children}
    </>
  );
}
