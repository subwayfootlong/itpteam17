import Link from "next/link";
import MemberPageShell from "@/components/member/MemberPageShell";
import FeaturedBenefitCard from "@/components/member/home/FeaturedBenefitCard";
import FeaturedEventCard from "@/components/member/home/FeaturedEventCard";
import HomeActionPrompt from "@/components/member/home/HomeActionPrompt";
import HomeAnnouncementCard from "@/components/member/home/HomeAnnouncementCard";
import HomeGreeting from "@/components/member/home/HomeGreeting";
import HomeMembershipCard from "@/components/member/home/HomeMembershipCard";
import HomeQuickActions from "@/components/member/home/HomeQuickActions";
import NextRegisteredEventCard from "@/components/member/home/NextRegisteredEventCard";
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
  const registeredEventId = homeData.nextRegisteredEvent?.id;
  const displayEvents = (homeData.featuredEvents && homeData.featuredEvents.length > 0
    ? homeData.featuredEvents
    : homeData.featuredEvent
      ? [homeData.featuredEvent]
      : []
  ).filter((event) => event.id !== registeredEventId);

  return (
    <MemberPageShell>
      <div className="mx-auto max-w-md px-4 py-5">
        <HomeGreeting
          firstName={displayFirstName}
          lastName={displayLastName}
        />

        <HomeAnnouncementCard
          announcement={homeData.latestAnnouncement}
          featuredEvent={homeData.featuredEvent}
          featuredBenefit={homeData.featuredBenefit}
        />

        <HomeMembershipCard
          tierLabel={tierLabel}
          expiryLabel={expiryLabel}
          expiryDate={user.expiryDate}
        />

        <HomeQuickActions />

        <NextRegisteredEventCard event={homeData.nextRegisteredEvent} />

        {displayEvents.length > 0 && (
          <section className="mt-8">
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-neutral-900">
                  Featured Events
                </h2>
                <p className="text-xs text-neutral-500">
                  Curated programs & gatherings
                </p>
              </div>

              <Link
                href="/member/events"
                className="text-xs font-semibold text-[#0F6E00] transition-colors hover:text-[#173F14]"
              >
                See all
              </Link>
            </div>

            <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 no-scrollbar">
              {displayEvents.map((event) => (
                <FeaturedEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {homeData.featuredBenefit && (
          <FeaturedBenefitCard benefit={homeData.featuredBenefit} />
        )}

        <HomeActionPrompt user={user} />
      </div>
    </MemberPageShell>
  );
}
