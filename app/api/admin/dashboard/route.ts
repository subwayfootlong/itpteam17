import { NextResponse } from 'next/server';
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function timeAgo(dateInput: string | Date) {
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  if (interval === 1) return '1 day ago';
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  if (interval === 1) return '1 hour ago';
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' mins ago';
  if (interval === 1) return '1 min ago';
  return 'just now';
}

function generateSparkline(dataDates: Date[], totalCurrentCount: number): string {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentItems = dataDates.filter(d => d >= sevenDaysAgo);
  let runningTotal = totalCurrentCount - recentItems.length;

  for (let i = 0; i < 7; i++) {
    const startOfDay = new Date(sevenDaysAgo);
    startOfDay.setDate(startOfDay.getDate() + i);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);
    
    const addedToday = recentItems.filter(d => d >= startOfDay && d <= endOfDay).length;
    runningTotal += addedToday;
    counts[i] = runningTotal;
  }

  // Normalize to Y values between 4 and 20 for the SVG. Higher value = lower Y (svg draws top-down)
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min;
  
  const pathParts = counts.map((val, i) => {
    const x = i * 10;
    const y = range === 0 ? 12 : 20 - ((val - min) / range) * 16;
    return `${x},${y.toFixed(1)}`;
  });

  return 'M' + pathParts.join(' L ');
}

export async function GET() {
  const [members, events, announcements, benefits] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name, membership_status, created_at').neq('role', 'admin'),
    supabaseAdmin.from('events').select('id, title, status, event_date, created_at'),
    supabaseAdmin.from('announcements').select('id, title, status, created_at'),
    supabaseAdmin.from('benefits').select('id').eq('is_active', true),
  ]);

  const allMembers = members.data ?? [];
  const totalMembers = allMembers.length;
  const activeMembersList = allMembers.filter((m) => m.membership_status === 'active');
  const activeMembers = activeMembersList.length;
  const expiredMembers = allMembers.filter((m) => m.membership_status === 'expired').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = (events.data ?? []).filter((e) => e.event_date >= todayStr).length;
  const publishedAnnouncementsList = (announcements.data ?? []).filter(a => a.status === 'published');
  const publishedAnnouncements = publishedAnnouncementsList.length;

  // Calculate simple real trends (last 30 days vs prior)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newMembersCount = allMembers.filter(m => new Date(m.created_at) >= thirtyDaysAgo).length;
  const newEventsCount = (events.data ?? []).filter(e => new Date(e.created_at) >= thirtyDaysAgo).length;
  const newAnnouncementsCount = (announcements.data ?? []).filter(a => new Date(a.created_at) >= thirtyDaysAgo).length;

  // Generate Real Sparklines
  const sparklines = {
    totalMembers: generateSparkline(allMembers.map(m => new Date(m.created_at)), totalMembers),
    activeMembers: generateSparkline(activeMembersList.map(m => new Date(m.created_at)), activeMembers),
    upcomingEvents: generateSparkline((events.data ?? []).map(e => new Date(e.created_at)), upcomingEvents),
    publishedAnnouncements: generateSparkline(publishedAnnouncementsList.map(a => new Date(a.created_at)), publishedAnnouncements),
  };

  // Generate Real Insights
  const insights = [];
  if (newAnnouncementsCount > newEventsCount * 2 && newAnnouncementsCount > 0) {
    insights.push("Announcement engagement is high. Consider aligning announcement timing with new event launches to capitalise on traffic spikes.");
  }
  if (newMembersCount === 0) {
    insights.push("No new members in the last 30 days. Consider sending out a promotional campaign or exclusive perk to attract new registrations.");
  } else if (newMembersCount > 5) {
    insights.push("Great member growth! Several new members joined recently. Engage them quickly with a welcome announcement or onboarding event.");
  }
  if (upcomingEvents === 0) {
    insights.push("There are no upcoming events scheduled. Create a new event to keep the community active and engaged.");
  }
  if (expiredMembers > 0) {
    insights.push(`You have ${expiredMembers} expired members. Reach out to them via email to renew their memberships and retain your base.`);
  }

  let selectedInsight = "Your dashboard is looking good. Keep monitoring engagement metrics to ensure steady community growth.";
  if (insights.length > 0) {
    selectedInsight = insights[Math.floor(Math.random() * insights.length)];
  }

  // Build a unified recent-activity feed
  const activityList = [];
  
  for (const m of allMembers) {
    activityList.push({
      id: `m_${m.id}`,
      message: `${m.full_name || 'A user'} registered as a new member`,
      createdAt: new Date(m.created_at),
      type: 'member',
      author: 'User',
    });
  }
  for (const e of events.data ?? []) {
    activityList.push({
      id: `e_${e.id}`,
      message: `"${e.title}" event was successfully created`,
      createdAt: new Date(e.created_at),
      type: 'event',
      author: 'Admin Team',
    });
  }
  for (const a of announcements.data ?? []) {
    activityList.push({
      id: `a_${a.id}`,
      message: `Announcement "${a.title}" was published`,
      createdAt: new Date(a.created_at),
      type: 'announcement',
      author: 'Admin Team',
    });
  }

  activityList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const recentActivity = activityList.slice(0, 5).map(act => ({
    id: act.id,
    message: act.message,
    timeAgo: timeAgo(act.createdAt),
    author: act.author,
    type: act.type,
  }));

  return NextResponse.json({
    stats: {
      totalMembers,
      activeMembers,
      expiredMembers,
      upcomingEvents,
      publishedAnnouncements,
      activePerks: (benefits.data ?? []).length,
      trends: {
        totalMembers: `+${newMembersCount}`,
        activeMembers: `+${newMembersCount}`,
        upcomingEvents: `+${newEventsCount}`,
        publishedAnnouncements: `+${newAnnouncementsCount}`,
      },
      sparklines,
      insight: selectedInsight
    },
    recentActivity,
  });
}
