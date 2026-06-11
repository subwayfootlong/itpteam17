import { NextResponse } from 'next/server';
import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();

  const [members, events, announcements, benefits] = await Promise.all([
    supabaseAdmin.from('users').select('id, membership_status, created_at').eq('role', 'member'),
    supabaseAdmin.from('events').select('id, status, event_date').eq('status', 'published'),
    supabaseAdmin.from('announcements').select('id, status').eq('status', 'published'),
    supabaseAdmin.from('benefits').select('id').eq('is_active', true),
  ]);

  const allMembers = members.data ?? [];
  const totalMembers = allMembers.length;
  const activeMembers = allMembers.filter((m) => m.membership_status === 'active').length;
  const expiredMembers = allMembers.filter((m) => m.membership_status === 'expired').length;

  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = (events.data ?? []).filter((e) => e.event_date >= today).length;

  // Build a simple recent-activity feed from newest members
  const recentMembers = [...allMembers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentActivity = recentMembers.map((m, i) => ({
    id: m.id ?? String(i),
    message: 'New member registered',
    timestamp: new Date(m.created_at).toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    type: 'member' as const,
  }));

  return NextResponse.json({
    stats: {
      totalMembers,
      activeMembers,
      expiredMembers,
      upcomingEvents,
      publishedAnnouncements: (announcements.data ?? []).length,
      activePerks: (benefits.data ?? []).length,
    },
    recentActivity,
  });
}
