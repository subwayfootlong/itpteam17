import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { notifyAnnouncementPublished } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? '';

  let query = supabaseAdmin
    .from('announcements')
    .select('id, title, category, status, created_at, updated_at, image_url')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('Announcements GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ announcements: data ?? [] });
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
