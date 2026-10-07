import MemberPageShell from "@/components/member/MemberPageShell";
import HomeActionPrompt from "@/components/member/home/HomeActionPrompt";
import HomeAnnouncementCard from "@/components/member/home/HomeAnnouncementCard";
import HomeGreeting from "@/components/member/home/HomeGreeting";
import HomeMembershipCard from "@/components/member/home/HomeMembershipCard";
import HomeQuickActions from "@/components/member/home/HomeQuickActions";
import HomeRegistrations from "@/components/member/home/HomeRegistrations";
import { getCurrentUser } from "@/lib/currentUser";
import { formatMemberDate } from "@/lib/dates";
import { getMemberHomeData } from "@/lib/memberHome";
import { formatTierLabel } from "@/lib/membershipTiers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const homeData = await getMemberHomeData(user);
  const displayFirstName = user.firstName || user.fullName || "Member";
  const displayLastName = user.lastName ?? "";
  const tierLabel = formatTierLabel(user.membershipTier);
  const expiryLabel = formatMemberDate(user.expiryDate ?? null);

  return (
    <MemberPageShell>
      <div className="px-5 pb-6">
        {/* Soft tinted header: who you are, where to go, what is new */}
        <div className="-mx-5 bg-gradient-to-b from-brand-primary-50 to-white px-5 pb-1 pt-6">
          <HomeGreeting
            firstName={displayFirstName}
            lastName={displayLastName}
          />

          <HomeQuickActions />

          {/* Time-sensitive prompts (profile, renewal) come before promotion */}
          <HomeActionPrompt user={user} />

          <HomeAnnouncementCard
            announcement={homeData.latestAnnouncement}
            nextRegisteredEvent={homeData.nextRegisteredEvent}
            featuredEvents={homeData.featuredEvents}
            featuredBenefit={homeData.featuredBenefit}
          />
        </div>

        <HomeMembershipCard
          tierLabel={tierLabel}
          expiryLabel={expiryLabel}
          expiryDate={user.expiryDate}
        />

        <HomeRegistrations events={homeData.registeredEvents} />
      </div>
    </MemberPageShell>
  );
}
