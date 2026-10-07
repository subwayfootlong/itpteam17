import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/currentUser";
import { supabaseAdmin } from "@/lib/supabaseServer";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

type ChangePasswordBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 },
      );
    }

    let body: ChangePasswordBody;
    try {
      body = (await request.json()) as ChangePasswordBody;
    } catch {
      return NextResponse.json(
        { error: "Please complete all password fields and try again." },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword, confirmPassword } = body;
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        { error: "Please complete all password fields." },
        { status: 400 },
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Your new password must contain at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    if (new TextEncoder().encode(newPassword).length > MAX_PASSWORD_BYTES) {
      return NextResponse.json(
        { error: "Your new password is too long. Please use a shorter password." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "The new passwords do not match." },
        { status: 400 },
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("password_hash")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { error: "We could not check your password. Please try again." },
        { status: 500 },
      );
    }

    if (!user?.password_hash) {
      return NextResponse.json(
        { error: "Your account could not be found. Please log in again." },
        { status: 404 },
      );
    }

    const currentPasswordIsCorrect = await verifyPassword(
      currentPassword,
      user.password_hash,
    );
    if (!currentPasswordIsCorrect) {
      return NextResponse.json(
        { error: "Your current password is incorrect." },
        { status: 400 },
      );
    }

    const passwordIsUnchanged = await verifyPassword(
      newPassword,
      user.password_hash,
    );
    if (passwordIsUnchanged) {
      return NextResponse.json(
        { error: "Please choose a new password that is different from your current password." },
        { status: 400 },
      );
    }

    const newPasswordHash = await hashPassword(newPassword);
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password_hash: newPasswordHash })
      .eq("id", currentUser.id);

    if (updateError) {
      return NextResponse.json(
        { error: "We could not update your password. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating your password. Please try again." },
      { status: 500 },
    );
  }
}
