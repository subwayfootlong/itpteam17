import { cookies } from "next/headers";
import MemberPageShell from "@/components/member/MemberPageShell";
import MemberSettingsView from "@/components/member/MemberSettingsView";
import {
  defaultNotificationPreferences,
  getNotificationPreferences,
} from "@/lib/notifications";
import { getCurrentUser } from "@/lib/currentUser";

const PUSH_NOTIFICATIONS_COOKIE = "pergas_push_notifications_enabled";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const initialPreferences = user
    ? await getNotificationPreferences(user.id)
    : defaultNotificationPreferences;
  const initialPushEnabled =
    cookieStore.get(PUSH_NOTIFICATIONS_COOKIE)?.value !== "0";

  return (
    <MemberPageShell showTopBar={false}>
      <MemberSettingsView
        initialPreferences={initialPreferences}
        initialPushEnabled={initialPushEnabled}
      />
    </MemberPageShell>
  );
}
