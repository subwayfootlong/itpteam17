import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { notifyAnnouncementPublished } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabaseServer';

type AnnouncementWithCommentCount = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  announcement_comments: { count: number }[] | null;
};

export async function GET(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? '';

  let query = supabaseAdmin
    .from('announcements')
    .select('id, title, category, status, created_at, updated_at, image_url, announcement_comments(count)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('Announcements GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const announcements = (data ?? []) as AnnouncementWithCommentCount[];
  const viewCounts = await Promise.all(
    announcements.map(async (announcement) => {
      const { count, error: viewError } = await supabaseAdmin
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'announcement_view')
        .eq('category', 'announcement')
        .in('target_id', [announcement.id, `admin:${announcement.id}`]);

      if (viewError) {
        console.error(
          `Announcement views query failed for ${announcement.id}:`,
          viewError,
        );
        return null;
      }

      return count ?? 0;
    }),
  );

  return NextResponse.json({
    announcements: announcements.map((announcement, index) => {
      const { announcement_comments: commentCounts, ...details } = announcement;
      return {
        ...details,
        views: viewCounts[index],
        comments: commentCounts?.[0]?.count ?? 0,
      };
    }),
  });
}

export async function POST(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
  }
  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json({ error: 'Content is required and must be a string' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({
      title: body.title,
      content: body.content,
      category: body.category ?? 'General',
      image_url: body.image_url || null,
      status: body.status ?? 'draft',
      // created_by: admin.sub,
    })
    .select()
    .single();

  if (error) {
    console.error('Announcements POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (data?.status === 'published') {
    await notifyAnnouncementPublished({
      id: String(data.id),
      title: data.title,
    });
  }

  return NextResponse.json({ announcement: data }, { status: 201 });
}
