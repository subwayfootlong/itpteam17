import type { Metadata } from "next";
import MemberPageShell from "@/components/member/MemberPageShell";
import NotificationsCenter from "@/components/member/NotificationsCenter";
import { getCurrentUser } from "@/lib/currentUser";
import {
  defaultNotificationPreferences,
  getMemberNotifications,
  getNotificationPreferences,
} from "@/lib/notifications";

export const metadata: Metadata = {
  title: "Notifications | Pergas Member Portal",
  description:
    "Receive automated Pergas renewal reminders and event update alerts.",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notifications = user ? await getMemberNotifications(user.id) : [];
  const preferences = user
    ? await getNotificationPreferences(user.id)
    : defaultNotificationPreferences;

  return (
    <MemberPageShell>
      <NotificationsCenter
        initialNotifications={notifications}
        initialPreferences={preferences}
        showChrome={false}
      />
    </MemberPageShell>
  );
}
