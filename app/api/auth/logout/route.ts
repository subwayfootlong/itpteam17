import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return res;
}