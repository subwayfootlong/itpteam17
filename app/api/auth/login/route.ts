import { readJsonObject, InputValidationError, invalidInput } from "@/lib/inputValidation";
import { validateLoginInput } from "@/lib/apiInputValidation";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { verifyPassword, createAccessToken } from '@/lib/auth';
import { setSessionCookies } from '@/lib/session';
import { logServerError } from '@/lib/serverLog';

export async function POST(req: Request) {
  try {
    const { email, password } = await readJsonObject(req, validateLoginInput);
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (error) {
      logServerError("auth/login POST", error);
      return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createAccessToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({ ok: true });
    setSessionCookies(res, token);
    return res;
  } catch (err: unknown) {
    if (err instanceof InputValidationError) return invalidInput(err.message);
    logServerError("auth/login POST", err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
