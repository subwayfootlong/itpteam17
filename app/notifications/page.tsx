import type { Metadata } from "next";
import NotificationsCenter from "../components/notifications-center";
import { systemNotifications } from "../data/system-notifications";

export const metadata: Metadata = {
  title: "Notifications | Pergas Member Portal",
  description:
    "Receive automated Pergas renewal reminders and event update alerts.",
};

export default function NotificationsPage() {
  return <NotificationsCenter initialNotifications={systemNotifications} />;
}
