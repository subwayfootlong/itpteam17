import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? '';

  let query = supabaseAdmin
    .from('announcements')
    .select('id, title, category, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const body = await req.json();

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcement: data }, { status: 201 });
}
