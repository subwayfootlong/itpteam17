import { getCurrentUser } from "./currentUser";
import { logServerError } from "./serverErrors";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyPassword } from "@/lib/auth";
import { clearSessionCookies } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { EmailChangeError, maskEmail, requestEmailChange, verifyEmailChange, type EmailChangeDependencies, type EmailChangeUser } from "@/lib/emailChange";

async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.rpc(name, args);
  if (error) {
    logServerError("email-change.rpc", error);
    throw new Error("Email change database operation failed");
  }
  return data;
}

export async function deliverEmailChangeNotification(id: string) {
  const { data, error } = await supabaseAdmin.from("email_change_notifications")
    .select("id,old_email,new_email").eq("id", id).is("sent_at", null).maybeSingle();
  if (error) throw new Error("Unable to read notification");
  if (!data) return;
  await sendEmail(data.old_email, "Your Pergas email address was changed",
    `Your Pergas account email address has been changed to ${maskEmail(data.new_email)}.\n\nIf you made this change, no action is required.\n\nIf you did not make this change, please contact Pergas immediately.`,
    `email-change-notification-${id}`);
  const { error: updateError } = await supabaseAdmin.from("email_change_notifications")
    .update({ sent_at: new Date().toISOString() }).eq("id", id);
  if (updateError) throw new Error("Unable to mark notification sent");
}

const dependencies: EmailChangeDependencies = {
  get secret() { return process.env.EMAIL_CHANGE_SECRET ?? ""; },
  verifyPassword,
  throttle: (id) => rpc("email_change_throttle", { p_user_id: id }),
  start: (user, email, id, hash) => rpc("email_change_start", {
    p_user_id: user.id, p_old_email: user.email, p_new_email: email,
    p_id: id, p_otp_hash: hash, p_password_hash: user.password_hash,
  }),
  pending: async (userId) => {
    const { data, error } = await supabaseAdmin.from("email_change_requests")
      .select("id,new_email,otp_hash").eq("user_id", userId).is("verified_at", null).maybeSingle();
    if (error) throw new Error("Unable to read pending request");
    return data;
  },
  finish: (userId, id, matches) => rpc("email_change_finish", { p_user_id: userId, p_id: id, p_matches: matches }),
  sendCode: (email, otp, id) => sendEmail(email, "Pergas Email Verification",
    `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this change, no action is required.`, `email-change-code-${id}`),
  cancel: async (userId, id) => {
    const { error } = await supabaseAdmin.from("email_change_requests").delete().eq("user_id", userId).eq("id", id);
    if (error) throw new Error("Unable to cancel request");
  },
  notify: deliverEmailChangeNotification,
};

async function authenticatedMember(): Promise<EmailChangeUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabaseAdmin.from("users").select("id,email,password_hash,role")
    .eq("id", user.id).maybeSingle();
  if (error) throw new Error("Unable to authenticate");
  if (!data || data.email !== user.email) return null;
  if (data.role !== "member") throw new EmailChangeError("Forbidden", 403);
  return data;
}

export async function handleEmailChange(req: Request, action: "request" | "verify") {
  try {
    const user = await authenticatedMember();
    if (!user) throw new EmailChangeError("Please log in first.", 401);
    const expectedOrigin = new URL(process.env.APP_URL || req.url).origin;
    if (req.headers.get("origin") !== expectedOrigin || !req.headers.get("content-type")?.startsWith("application/json")) {
      throw new EmailChangeError("Invalid request origin or content type.", 403);
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new EmailChangeError("Invalid request.");
    const result = action === "request"
      ? await requestEmailChange(dependencies, user, body)
      : await verifyEmailChange(dependencies, user, body);
    const response = NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    if (action === "verify") clearSessionCookies(response);
    return response;
  } catch (error) {
    const status = error instanceof EmailChangeError ? error.status : 503;
    if (status >= 500) logServerError("email-change.handle", error);
    return NextResponse.json({ error: error instanceof EmailChangeError ? error.message : "Unable to change email. Please try again later." },
      { status, headers: { "Cache-Control": "no-store" } });
  }
}
