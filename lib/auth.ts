import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const COOKIE_NAME = "vault_secure_token";

const getSecretKey = () => {
  const secret =
    process.env.SESSION_SECRET ||
    "default-vault-secret-key-replace-in-env-at-least-32-chars-long";
  return new TextEncoder().encode(secret);
};

export interface SessionPayload {
  sub: string; // userId
  username: string;
  email: string;
  role: "admin" | "user";
}

export async function createSessionToken(
  userId: string,
  username: string,
  email: string = "",
  role: "admin" | "user" = "user"
): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ sub: userId, username, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // 2-hour active session timeout for vault security
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

export async function isAuthenticated(req?: NextRequest): Promise<boolean> {
  const session = await getSessionUser(req);
  return !!session;
}

export function setSessionCookie(response: NextResponse, token: string) {
  // Session cookie: omitted maxAge so browser clears it when closed
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
  // Also clear old legacy cookie if present
  response.cookies.delete("vault_session");
}
