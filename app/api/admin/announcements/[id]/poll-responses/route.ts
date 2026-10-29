import { isUuid, invalidInput } from "@/lib/inputValidation";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { formatMemberName } from '@/lib/memberName';

type PollResponseRow = {
  id: string;
  response: 'yes' | 'no' | 'maybe';
  users: { first_name: string | null; last_name: string | null; email: string | null } | { first_name: string | null; last_name: string | null; email: string | null }[] | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const { id } = await params;
  if (!isUuid(id)) return invalidInput("ID must be a UUID");

  const { data, error } = await supabaseAdmin
    .from('announcement_poll_responses')
    .select(`
      id,
      response,
      users (
        first_name,
        last_name,
        email
      )
    `)
    .eq('announcement_id', id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Announcement Poll Responses GET Error:');
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }

  const rows = (data ?? []) as PollResponseRow[];
  const counts = { yes: 0, no: 0, maybe: 0 };
  const responses = rows.map((row) => {
    counts[row.response] += 1;
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      name: formatMemberName(user ?? {}, 'Unknown User'),
      email: user?.email || 'No email',
      response: row.response,
    };
  });

  return NextResponse.json({ counts, responses });
}
