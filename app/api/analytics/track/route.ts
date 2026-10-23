import { readJsonObject, invalidInput, InputValidationError } from "@/lib/inputValidation";
import { validateAnalyticsInput } from "@/lib/apiInputValidation";
import { NextResponse } from 'next/server';
import { requireMember } from '@/lib/currentUser';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const { user, response: authResponse } = await requireMember();
  if (authResponse) return authResponse;

  let body;
  try {
    body = await readJsonObject(req, validateAnalyticsInput);
  } catch (error) {
    return invalidInput(error instanceof InputValidationError ? error.message : "Invalid JSON payload");
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
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
