import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/currentUser';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { eventType, targetId, category, metadata } = body;

  if (!eventType || !category) {
    return NextResponse.json({ error: 'eventType and category are required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('analytics_events')
    .insert({
      user_id: user.id,
      event_type: eventType,
      target_id: targetId || null,
      category,
      metadata: metadata || {},
    });

  if (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
