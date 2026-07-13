import { supabaseAdmin } from "@/lib/supabaseServer";

export type MemberHomeData = {
  latestAnnouncement: {
    id: string;
    title: string;
    content: string;
    publishedAt: string | null;
  } | null;
  nextRegisteredEvent: {
    id: string;
    title: string;
    eventDate: string;
    startTime: string | null;
    venue: string | null;
    category: string | null;
    imageUrl: string | null;
  } | null;
  featuredEvent: {
    id: string;
    title: string;
    description: string | null;
    eventDate: string;
    startTime: string | null;
    venue: string | null;
    category: string | null;
    imageUrl: string | null;
  } | null;
  featuredBenefit: {
    id: string;
    title: string;
    description: string | null;
    discountText: string | null;
    imageUrl: string | null;
    merchantName: string | null;
  } | null;
};

type AnnouncementRow = {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string | null;
};

type EventRow = {
  id: string;
  title: string | null;
  description?: string | null;
  event_date: string | null;
  start_time: string | null;
  venue: string | null;
  category: string | null;
  image_url: string | null;
};

type RegistrationRow = {
  events: EventRow | EventRow[] | null;
};

type BenefitRow = {
  id: string;
  merchant_name: string | null;
  discount_description: string | null;
  description: string | null;
  image_url: string | null;
};

function getTodayInSingapore() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function compareRegisteredEvents(
  a: NonNullable<ReturnType<typeof normalizeRegisteredEvent>>,
  b: NonNullable<ReturnType<typeof normalizeRegisteredEvent>>,
) {
  const dateCompare = a.eventDate.localeCompare(b.eventDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return (a.startTime ?? "").localeCompare(b.startTime ?? "");
}

function normalizeEvent(event: EventRow | null | undefined) {
  if (!event?.id || !event.title || !event.event_date) {
    return null;
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    eventDate: event.event_date,
    startTime: event.start_time ?? null,
    venue: event.venue ?? null,
    category: event.category ?? null,
    imageUrl: event.image_url ?? null,
  };
}

function normalizeRegisteredEvent(event: EventRow | null | undefined) {
  const normalized = normalizeEvent(event);

  if (!normalized) {
    return null;
  }

  return {
    id: normalized.id,
    title: normalized.title,
    eventDate: normalized.eventDate,
    startTime: normalized.startTime,
    venue: normalized.venue,
    category: normalized.category,
    imageUrl: normalized.imageUrl,
  };
}

function normalizeBenefit(benefit: BenefitRow | null | undefined) {
  if (!benefit?.id) {
    return null;
  }

  return {
    id: benefit.id,
    title: benefit.merchant_name?.trim() || "Pergas Partner",
    description: benefit.description?.trim() || null,
    discountText: benefit.discount_description?.trim() || null,
    imageUrl: benefit.image_url?.trim() || null,
    merchantName: benefit.merchant_name?.trim() || null,
  };
}

export async function getMemberHomeData(
  userId: string,
): Promise<MemberHomeData> {
  const today = getTodayInSingapore();

  const [
    announcementResult,
    registrationResult,
    featuredEventResult,
    benefitResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("announcements")
      .select("id, title, content, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<AnnouncementRow>(),

    supabaseAdmin
      .from("event_registrations")
      .select(
        `
          events (
            id,
            title,
            event_date,
            start_time,
            venue,
            category,
            image_url
          )
        `,
      )
      .eq("user_id", userId)
      .eq("status", "registered")
      .returns<RegistrationRow[]>(),

    supabaseAdmin
      .from("events")
      .select(
        `
          id,
          title,
          description,
          event_date,
          start_time,
          venue,
          category,
          image_url
        `,
      )
      .eq("status", "published")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle<EventRow>(),

    supabaseAdmin
      .from("benefits")
      .select(
        `
          id,
          merchant_name,
          discount_description,
          description,
          image_url
        `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<BenefitRow>(),
  ]);

  if (announcementResult.error) {
    console.error(
      "Home announcement query failed:",
      announcementResult.error.message,
    );
  }

  if (registrationResult.error) {
    console.error(
      "Home registration query failed:",
      registrationResult.error.message,
    );
  }

  if (featuredEventResult.error) {
    console.error(
      "Home featured event query failed:",
      featuredEventResult.error.message,
    );
  }

  if (benefitResult.error) {
    console.error(
      "Home benefit query failed:",
      benefitResult.error.message,
    );
  }

  const registeredEvents =
    registrationResult.data
      ?.flatMap((registration) => {
        if (Array.isArray(registration.events)) {
          return registration.events;
        }

        return registration.events ? [registration.events] : [];
      })
      .map(normalizeRegisteredEvent)
      .filter(
        (
          event,
        ): event is NonNullable<ReturnType<typeof normalizeRegisteredEvent>> =>
          Boolean(event),
      )
      .filter((event) => event.eventDate >= today)
      .sort(compareRegisteredEvents) ?? [];

  return {
    latestAnnouncement: announcementResult.data
      ? {
          id: announcementResult.data.id,
          title: announcementResult.data.title?.trim() || "Latest announcement",
          content: announcementResult.data.content?.trim() || "",
          publishedAt: announcementResult.data.created_at,
        }
      : null,
    nextRegisteredEvent: registeredEvents[0] ?? null,
    featuredEvent: normalizeEvent(featuredEventResult.data),
    featuredBenefit: normalizeBenefit(benefitResult.data),
  };
}
