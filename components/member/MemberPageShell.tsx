type MemberPageShellProps = {
  children: React.ReactNode;
};

export default function MemberPageShell({
  children,
}: MemberPageShellProps) {
  return <div className="min-h-screen pb-24">{children}</div>;
}
