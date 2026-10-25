import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import SessionTimeout from "@/components/SessionTimeout";
import MemberTopBar from "@/components/MemberTopBar";
import MemberBottomNav from "@/components/MemberBottomNav";
import { MemberFontSizeProvider } from "@/components/member/MemberFontSizeProvider";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/?screen=login");

  return (
    <>
      <SessionTimeout />
      <main className="member-theme flex min-h-screen justify-center bg-white member-dark:bg-member-canvas">
        <section className="min-h-screen w-full max-w-md bg-white member-dark:bg-member-canvas font-helvetica">
          <MemberTopBar user={user} />
          <MemberFontSizeProvider>{children}</MemberFontSizeProvider>
          <MemberBottomNav />
        </section>
      </main>
    </>
  );
}
