import type { Metadata } from "next";
import MemberPageShell from "@/components/member/MemberPageShell";
import NotificationsCenter from "@/components/member/NotificationsCenter";
import { systemNotifications } from "@/lib/data/system-notifications";

export const metadata: Metadata = {
  title: "Notifications | Pergas Member Portal",
  description:
    "Receive automated Pergas renewal reminders and event update alerts.",
};

export default function NotificationsPage() {
  return (
    <MemberPageShell>
      <NotificationsCenter
        initialNotifications={systemNotifications}
        showChrome={false}
      />
    </MemberPageShell>
  );
}
