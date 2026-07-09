import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { formatMemberName } from '@/lib/memberName';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('event_registrations')
    .select(`
      id,
      registered_at,
      user_id,
      users (
        first_name,
        last_name,
        email
      )
    `)
    .eq('event_id', id)
    .eq('status', 'registered')
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Events Registrations GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formattedData = data.map((reg) => {
    const user = Array.isArray(reg.users) ? reg.users[0] : reg.users;

    return {
      id: reg.id,
      user_id: reg.user_id,
      name: formatMemberName(user ?? {}, 'Unknown User'),
      email: user?.email || 'No email',
      date: reg.registered_at,
    };
  });

  return NextResponse.json({ registrations: formattedData });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const registrationId = url.searchParams.get('registrationId');
  const rejectionMessage = url.searchParams.get('rejectionMessage') || 'Registration cancelled by administrator.';

  if (!registrationId) {
    return NextResponse.json({ error: 'registrationId is required' }, { status: 400 });
  }

  // Fetch registration details to get user_id for analytics cleanup
  const { data: regDetails } = await supabaseAdmin
    .from('event_registrations')
    .select('user_id')
    .eq('id', registrationId)
    .maybeSingle();

  if (regDetails?.user_id) {
    // Delete the corresponding analytics RSVP click event so it doesn't double count if they reapply
    await supabaseAdmin
      .from('analytics_events')
      .delete()
      .eq('user_id', regDetails.user_id)
      .eq('target_id', id)
      .eq('event_type', 'event_rsvp_click');
  }

  const { error } = await supabaseAdmin
    .from('event_registrations')
    .update({
      status: 'rejected',
      rejection_message: rejectionMessage,
    })
    .eq('id', registrationId)
    .eq('event_id', id);

  if (error) {
    console.error('Events Registrations DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: eventData } = await supabaseAdmin
    .from('events')
    .select('spots_available')
    .eq('id', id)
    .single();

  if (eventData && eventData.spots_available !== null) {
    await supabaseAdmin
      .from('events')
      .update({ spots_available: eventData.spots_available + 1 })
      .eq('id', id);
  }

  return NextResponse.json({ ok: true });
}
