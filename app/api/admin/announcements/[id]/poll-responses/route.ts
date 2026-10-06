import { NextResponse } from 'next/server';
import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { formatMemberName } from '@/lib/memberName';

type PollResponseRow = {
  id: string;
  response: 'yes' | 'no' | 'maybe';
  updated_at: string;
  user_id: string;
  users: { first_name: string | null; last_name: string | null; email: string | null } | { first_name: string | null; last_name: string | null; email: string | null }[] | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('announcement_poll_responses')
    .select(`
      id,
      response,
      updated_at,
      user_id,
      users (
        first_name,
        last_name,
        email
      )
    `)
    .eq('announcement_id', id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Announcement Poll Responses GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as PollResponseRow[];
  const counts = { yes: 0, no: 0, maybe: 0 };
  const responses = rows.map((row) => {
    counts[row.response] += 1;
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      userId: row.user_id,
      name: formatMemberName(user ?? {}, 'Unknown User'),
      email: user?.email || 'No email',
      response: row.response,
      updatedAt: row.updated_at,
    };
  });

  return NextResponse.json({ counts, responses });
}
