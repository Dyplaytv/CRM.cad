import { NextRequest } from "next/server";
import crypto from "crypto";
import { AuthUser } from "@/types/crm";

export const COOKIE_NAME = "nexus_crm_session";
const SESSION_SECRET =
  process.env.AUTH_SECRET || "nexus-crm-cadtech-session-key-2026";

function signPayload(payloadB64: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("hex");
}

export function encodeSession(user: AuthUser): string {
  const payloadB64 = Buffer.from(JSON.stringify(user)).toString("base64url");
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function decodeSession(token: string | undefined): AuthUser | null {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expectedSig = signPayload(payloadB64);
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    ) as AuthUser;
    if (!parsed?.username || !parsed?.mode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSessionUser(req: NextRequest): AuthUser | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return decodeSession(token);
}
