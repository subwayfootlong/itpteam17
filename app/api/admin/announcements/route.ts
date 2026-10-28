import { readJsonObject, invalidInput, InputValidationError, isOneOf } from "@/lib/inputValidation";
import { validateAnnouncementInput } from "@/lib/apiInputValidation";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from 'next/server';
import { notifyAnnouncementPublished } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { tierAudienceToDatabase, validateTierAudience } from '@/lib/tierAccess';

type AnnouncementWithCommentCount = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  audience_type: string | null;
  eligible_tiers: string[] | null;
  show_locked_preview: boolean | null;
  announcement_comments: { count: number }[] | null;
};

export async function GET(req: Request) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? '';
  if (status && !isOneOf(status, ['draft', 'published', 'archived'])) return invalidInput('Invalid status filter');

  let query = supabaseAdmin
    .from('announcements')
    .select('id, title, category, status, created_at, updated_at, image_url, audience_type, eligible_tiers, show_locked_preview, announcement_comments(count)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('Announcements GET Error:');
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
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
        console.error("Announcement views query failed");
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
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  let body;
  try {
    body = await readJsonObject(req, validateAnnouncementInput);
  } catch (error) {
    return invalidInput(error instanceof InputValidationError ? error.message : "Invalid JSON payload");
  }

  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
  }
  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json({ error: 'Content is required and must be a string' }, { status: 400 });
  }

  const audience = validateTierAudience(body);
  if (!audience.ok) {
    return NextResponse.json({ error: audience.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({
      title: body.title,
      content: body.content,
      category: body.category ?? 'General',
      image_url: body.image_url || null,
      status: body.status ?? 'draft',
      poll_enabled: Boolean(body.poll_enabled),
      poll_question: body.poll_enabled ? (body.poll_question || null) : null,
      ...tierAudienceToDatabase({
        ...audience.value,
        showLockedPreview: false,
      }),
      // Add created_by: admin.sub if the announcements table includes it.
    })
    .select('id, title, status')
    .single();

  if (error) {
    console.error('Announcements POST Error:');
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }
  if (data?.status === 'published') {
    await notifyAnnouncementPublished({
      id: String(data.id),
      title: data.title,
      audience: { ...audience.value, showLockedPreview: false },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
