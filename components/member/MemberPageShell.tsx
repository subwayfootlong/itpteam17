import MemberTopBar from "@/components/MemberTopBar";
import MemberBottomNav from "@/components/MemberBottomNav";

type MemberPageShellProps = {
  children: React.ReactNode;
  showTopBar?: boolean;
  showBottomNav?: boolean;
};

export default function MemberPageShell({
  children,
  showTopBar = true,
  showBottomNav = true,
}: MemberPageShellProps) {
  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <section className="min-h-screen w-full max-w-md bg-[#FFFFFF] pb-24">
        {showTopBar && <MemberTopBar />}
        {children}
        {showBottomNav && <MemberBottomNav />}
      </section>
    </main>
  );
}
