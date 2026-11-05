import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "stockvoice_admin";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function adminPassword() {
  return process.env.ADMIN_PASSWORD;
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

export function isAdminAuthConfigured() {
  return Boolean(adminPassword() && sessionSecret());
}

function safeEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function sign(payload: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return createHmac("sha256", secret).update(`admin:${payload}`).digest("hex");
}

export function verifyAdminPassword(password: string) {
  const expected = adminPassword();
  return expected !== undefined && expected.length > 0 && safeEqual(password, expected);
}

export function createSessionToken() {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token || !isAdminAuthConfigured()) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  return safeEqual(signature, sign(expiresAt));
}

export function isAdminRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.ADMIN_COOKIE_SECURE === "true",
  path: "/",
  maxAge: Math.floor(SESSION_TTL_MS / 1000),
};
