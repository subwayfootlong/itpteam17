import MemberTopBar from "@/components/MemberTopBar";
import MemberBottomNav from "@/components/MemberBottomNav";
import { MemberFontSizeProvider } from "@/components/member/MemberFontSizeProvider";
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
      {/* max-w-md must stay the flex child so justify-center keeps the column centered */}
      <section className="min-h-screen w-full max-w-md bg-white font-helvetica">
        <MemberFontSizeProvider>
          {showTopBar && <MemberTopBar user={currentUser} />}

          <div className={showBottomNav ? "min-h-screen pb-24" : "min-h-screen"}>
            {children}
          </div>

          {showBottomNav && <MemberBottomNav />}
        </MemberFontSizeProvider>
      </section>
    </main>
  );
}
