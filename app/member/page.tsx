import MemberPageShell from "@/components/member/MemberPageShell";
import FeaturedBenefitCard from "@/components/member/home/FeaturedBenefitCard";
import HomeActionPrompt from "@/components/member/home/HomeActionPrompt";
import HomeAnnouncementCard from "@/components/member/home/HomeAnnouncementCard";
import HomeGreeting from "@/components/member/home/HomeGreeting";
import HomeMembershipCard from "@/components/member/home/HomeMembershipCard";
import HomeQuickActions from "@/components/member/home/HomeQuickActions";
import NextRegisteredEventCard from "@/components/member/home/NextRegisteredEventCard";
import UpcomingEventBanner from "@/components/member/home/UpcomingEventBanner";
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
  const shouldShowFeaturedEvent =
    homeData.featuredEvent &&
    homeData.featuredEvent.id !== homeData.nextRegisteredEvent?.id;

  return (
    <MemberPageShell>
      <div className="px-5 py-6">
        <HomeGreeting
          firstName={displayFirstName}
          lastName={displayLastName}
        />

        {homeData.latestAnnouncement && (
          <HomeAnnouncementCard announcement={homeData.latestAnnouncement} />
        )}

        {shouldShowFeaturedEvent && homeData.featuredEvent && (
          <UpcomingEventBanner event={homeData.featuredEvent} />
        )}

        <HomeMembershipCard
          tierLabel={tierLabel}
          expiryLabel={expiryLabel}
          expiryDate={user.expiryDate}
        />

        <HomeQuickActions />

        <NextRegisteredEventCard event={homeData.nextRegisteredEvent} />

        {homeData.featuredBenefit && (
          <FeaturedBenefitCard benefit={homeData.featuredBenefit} />
        )}

        <HomeActionPrompt user={user} />
      </div>
    </MemberPageShell>
  );
}
