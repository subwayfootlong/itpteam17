import { logServerError } from "@/lib/serverErrors";
import { readJsonObject, InputValidationError, invalidInput } from "@/lib/inputValidation";
import { validateLoginInput } from "@/lib/apiInputValidation";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { verifyPassword } from '@/lib/auth';
import { setLastActivityCookie, SESSION_COOKIE_OPTIONS } from '@/lib/session';
import { createSession } from '@/lib/sessionServer';
import { emailMatchPattern } from '@/lib/emailIdentity';

export async function POST(req: Request) {
  try {
    const { email, password } = await readJsonObject(req, validateLoginInput);
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash')
      .regexIMatch('email', emailMatchPattern(email))
      .maybeSingle();

    if (error) {
      logServerError("app/api/auth/login/route.POST", error);
      return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createSession(user, user.password_hash);
    const res = NextResponse.json({ ok: true });
    res.cookies.set('token', token, { ...SESSION_COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 7 });
    setLastActivityCookie(res);
    return res;
  } catch (err: unknown) {
    if (!(err instanceof InputValidationError)) logServerError("app/api/auth/login/route.POST", err);
    if (err instanceof InputValidationError) return invalidInput(err.message);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
