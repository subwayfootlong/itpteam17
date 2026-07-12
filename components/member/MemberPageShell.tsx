import MemberTopBar from "@/components/MemberTopBar";
import MemberBottomNav from "@/components/MemberBottomNav";
import { getCurrentUser } from "@/lib/currentUser";

type MemberPageShellProps = {
  children: React.ReactNode;
  showTopBar?: boolean;
  showBottomNav?: boolean;
};

export default async function MemberPageShell({
  children,
  showTopBar = true,
  showBottomNav = true,
}: MemberPageShellProps) {
  const currentUser = showTopBar ? await getCurrentUser() : null;

  return (
    <main className="flex min-h-screen justify-center bg-white">
      <section className="min-h-screen w-full max-w-md bg-[#FFFFFF] pb-24">
        {showTopBar && <MemberTopBar user={currentUser} />}
        {children}
        {showBottomNav && <MemberBottomNav />}
      </section>
    </main>
  );
}
