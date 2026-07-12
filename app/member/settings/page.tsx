import MemberPageShell from "@/components/member/MemberPageShell";
import MemberSettingsView from "@/components/member/MemberSettingsView";

export default function SettingsPage() {
  return (
    <MemberPageShell showTopBar={false}>
      <MemberSettingsView />
    </MemberPageShell>
  );
}
