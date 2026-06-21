import type { Metadata } from "next";
import MemberBottomNav from "@/components/MemberBottomNav";
import MemberTopBar from "@/components/MemberTopBar";
import NotificationsCenter from "../../components/notifications-center";
import { systemNotifications } from "../../data/system-notifications";

export const metadata: Metadata = {
  title: "Notifications | Pergas Member Portal",
  description:
    "Receive automated Pergas renewal reminders and event update alerts.",
};

export default function NotificationsPage() {
  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <section className="min-h-screen w-full max-w-md bg-[#FFFFFF] pb-24">
        <MemberTopBar />

        <NotificationsCenter
          initialNotifications={systemNotifications}
          showChrome={false}
        />

        <MemberBottomNav />
      </section>
    </main>
  );
}
