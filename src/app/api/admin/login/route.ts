import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createSessionToken,
  isAdminAuthConfigured,
  sessionCookieOptions,
  verifyAdminPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET before enabling admin access." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Please send valid JSON." }, { status: 400 });
  }

  const password =
    payload && typeof payload === "object" && "password" in payload
      ? (payload as { password?: unknown }).password
      : undefined;

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Enter your admin password." }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "That admin password is not correct." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
}
