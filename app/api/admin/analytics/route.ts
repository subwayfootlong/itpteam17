import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { announcements as mockAnnouncements } from '@/lib/data/announcements';
import { partners as mockPartners } from '@/lib/data/partners';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const range = url.searchParams.get('range') ?? '30d';

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let startDate = new Date();
  if (range === '7d') {
    startDate.setDate(today.getDate() - 6);
  } else if (range === '90d') {
    startDate.setDate(today.getDate() - 89);
  } else if (range === 'all') {
    startDate = new Date(0); // Beginning of time
  } else {
    // default 30d
    startDate.setDate(today.getDate() - 29);
  }
  startDate.setHours(0, 0, 0, 0);

  let dbStartDate = new Date(startDate);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  if (dbStartDate > thirtyDaysAgo) {
    dbStartDate = thirtyDaysAgo;
  }

  // 1. Fetch raw logs in the period
  const query = supabaseAdmin
    .from('analytics_events')
    .select('id, user_id, event_type, target_id, category, created_at')
    .gte('created_at', dbStartDate.toISOString())
    .lte('created_at', today.toISOString());

  const { data: logs, error: logsError } = await query;
  if (logsError) {
    console.error('Analytics GET Logs Error:', logsError);
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  const allLogs = logs ?? [];

  // 2. Fetch events, benefits, and announcements details to resolve names
  const [eventsResult, benefitsResult, announcementsResult] = await Promise.all([
    supabaseAdmin.from('events').select('id, title, category, event_date'),
    supabaseAdmin.from('benefits').select('id, merchant_name, discount_description'),
    supabaseAdmin.from('announcements').select('id, title, content')
  ]);

  // Log any DB lookup errors for diagnostics (non-fatal)
  if (eventsResult.error) console.error('[Analytics] events lookup error:', eventsResult.error.message);
  if (benefitsResult.error) console.error('[Analytics] benefits lookup error:', benefitsResult.error.message);
  if (announcementsResult.error) console.error('[Analytics] announcements lookup error:', announcementsResult.error.message);

  const eventsMap = new Map((eventsResult.data ?? []).map(e => [e.id, e]));

  const benefitsMap = new Map<string, { merchant_name: string; discount_description: string }>();
  mockPartners.forEach(b => {
    benefitsMap.set(b.id, { merchant_name: b.name, discount_description: b.offer });
  });
  (benefitsResult.data ?? []).forEach(b => {
    benefitsMap.set(b.id, b);
  });

  // Build announcements title map — seed with mock data first (fallback for string IDs like "1","2").
  const announcementsMap = new Map<string, { title: string }>();
  mockAnnouncements.forEach(a => {
    announcementsMap.set(a.id, { title: a.title });
  });
  (announcementsResult.data ?? []).forEach((a: { id: string; title?: string | null; content?: string | null }) => {
    // Admin announcements are tracked with an `admin:` prefix from the member app.
    const resolvedTitle = a.title?.trim() || (a.content ? a.content.slice(0, 60).trim() + '…' : 'Untitled Announcement');
    announcementsMap.set(`admin:${String(a.id)}`, { title: resolvedTitle });
  });

  // 3. Compute KPI Metrics (filtered by actual user-selected range)
  const rangeLogs = allLogs.filter(l => new Date(l.created_at) >= startDate);
  const totalViews = rangeLogs.filter(l => l.event_type === 'event_view').length;
  const totalRsvps = rangeLogs.filter(l => l.event_type === 'event_rsvp_click').length;
  
  // Calculate Conversion Rate
  const conversionRate = totalViews > 0 ? ((totalRsvps / totalViews) * 100).toFixed(1) : '0.0';

  // Calculate Unique Active Members in the selected range
  const uniqueUsersRange = new Set(rangeLogs.map(l => l.user_id).filter(Boolean));
  const activeMembersCount = uniqueUsersRange.size;

  // 4. Generate daily timeline data (Timezone-robust calendar matching)
  const dateList: string[] = [];
  const curr = new Date(startDate);
  while (curr <= today) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    dateList.push(`${yyyy}-${mm}-${dd}`);
    curr.setDate(curr.getDate() + 1);
  }

  const dailyStats = dateList.map(dateStr => {
    const dayLogs = rangeLogs.filter(l => {
      const d = new Date(l.created_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}` === dateStr;
    });
    return {
      date: dateStr,
      views: dayLogs.filter(l => l.event_type === 'event_view').length,
      rsvps: dayLogs.filter(l => l.event_type === 'event_rsvp_click').length,
      perkViews: dayLogs.filter(l => l.event_type === 'benefit_view').length,
      announcementViews: dayLogs.filter(l => l.event_type === 'announcement_view').length,
      activeUsers: new Set(dayLogs.map(l => l.user_id).filter(Boolean)).size,
    };
  });

  // 5. Aggregate Event Conversion Metrics (using range-specific logs)
  const eventMetrics: Record<string, { views: number; rsvps: number }> = {};
  rangeLogs.forEach(l => {
    if (l.category === 'event' && l.target_id) {
      if (!eventMetrics[l.target_id]) {
        eventMetrics[l.target_id] = { views: 0, rsvps: 0 };
      }
      if (l.event_type === 'event_view') eventMetrics[l.target_id].views++;
      if (l.event_type === 'event_rsvp_click') eventMetrics[l.target_id].rsvps++;
    }
  });

  const formattedEventRankings = Object.entries(eventMetrics).map(([id, stats]) => {
    const event = eventsMap.get(id);
    return {
      id,
      title: event?.title ?? 'Unknown Event',
      category: event?.category ?? 'General',
      views: stats.views,
      rsvps: stats.rsvps,
      conversionRate: stats.views > 0 ? ((stats.rsvps / stats.views) * 100).toFixed(1) : '0.0'
    };
  }).sort((a, b) => b.views - a.views);

  // 6. Aggregate Benefit Usage Leaderboard (using range-specific logs)
  const benefitMetrics: Record<string, number> = {};
  rangeLogs.forEach(l => {
    if (l.category === 'benefit' && l.target_id && l.event_type === 'benefit_view') {
      benefitMetrics[l.target_id] = (benefitMetrics[l.target_id] ?? 0) + 1;
    }
  });

  const formattedBenefitRankings = Object.entries(benefitMetrics).map(([id, clicks]) => {
    const benefit = benefitsMap.get(id);
    return {
      id,
      name: benefit?.merchant_name ?? 'Unknown Partner',
      offer: benefit?.discount_description ?? 'Discount Perk',
      clicks
    };
  }).sort((a, b) => b.clicks - a.clicks);

  // 7. Aggregate Announcement Views (using range-specific logs)
  const announcementViews: Record<string, number> = {};
  rangeLogs.forEach(l => {
    if (l.category === 'announcement' && l.target_id && l.event_type === 'announcement_view') {
      announcementViews[l.target_id] = (announcementViews[l.target_id] ?? 0) + 1;
    }
  });

  const formattedAnnouncementRankings = Object.entries(announcementViews).map(([id, clicks]) => {
    const announcement = announcementsMap.get(id);
    return {
      id,
      title: announcement?.title ?? 'Unknown Announcement',
      clicks
    };
  }).sort((a, b) => b.clicks - a.clicks);

  // Find preferred perk for KPI header
  const preferredPerk = formattedBenefitRankings[0]
    ? `${formattedBenefitRankings[0].name} (${formattedBenefitRankings[0].clicks} clicks)`
    : 'None';

  // 8. Cohorts and Peak Hours Calculations (using full 30-day allLogs)
  const nowMs = today.getTime();
  const logUsers24h = new Set<string>();
  const logUsers7d = new Set<string>();
  const logUsers30d = new Set<string>();

  allLogs.forEach(l => {
    if (!l.user_id) return;
    const logTime = new Date(l.created_at).getTime();
    const diffMs = nowMs - logTime;
    if (diffMs <= 24 * 60 * 60 * 1000) logUsers24h.add(l.user_id);
    if (diffMs <= 7 * 24 * 60 * 60 * 1000) logUsers7d.add(l.user_id);
    if (diffMs <= 30 * 24 * 60 * 60 * 1000) logUsers30d.add(l.user_id);
  });

  const cohorts = {
    dau: logUsers24h.size,
    wau: logUsers7d.size,
    mau: logUsers30d.size
  };

  const hourlyActivity = Array(24).fill(0);
  allLogs.forEach(l => {
    const logTime = new Date(l.created_at);
    const hour = logTime.getHours();
    hourlyActivity[hour]++;
  });

  return NextResponse.json({
    kpi: {
      totalViews,
      totalRsvps,
      conversionRate,
      activeMembersCount,
      preferredPerk
    },
    dailyStats,
    eventRankings: formattedEventRankings.slice(0, 10), // Top 10 events
    benefitRankings: formattedBenefitRankings.slice(0, 10), // Top 10 perks
    announcementRankings: formattedAnnouncementRankings.slice(0, 10), // Top 10 announcements
    cohorts,
    hourlyActivity
  });
}
