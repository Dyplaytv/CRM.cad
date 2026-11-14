import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { AuthUser } from "@/types/crm";

const COOKIE_NAME = "nexus_crm_session";
const SESSION_SECRET =
  process.env.AUTH_SECRET || "nexus-crm-cadtech-session-key-2026";

const DEMO_USER: AuthUser = {
  username: "lucas.demo",
  name: "Lucas Andrade",
  role: "Head of Sales",
  initials: "LA",
  mode: "demo",
};

const MASTER_USER: AuthUser = {
  username: "Admin07",
  name: "Master Admin07",
  role: "Master Admin",
  initials: "MA",
  mode: "master",
};

function signPayload(payloadB64: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("hex");
}

function encodeSession(user: AuthUser): string {
  const payloadB64 = Buffer.from(JSON.stringify(user)).toString("base64url");
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

function decodeSession(token: string | undefined): AuthUser | null {
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

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = decodeSession(token);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({ authenticated: true, user });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mode?: "demo" | "master";
      username?: string;
      password?: string;
    };

    let authenticatedUser: AuthUser | null = null;

    if (body.mode === "demo") {
      authenticatedUser = DEMO_USER;
    } else {
      const normalizedUser = (body.username || "").trim().toLowerCase();
      const password = body.password || "";

      const isMasterUser =
        normalizedUser === "admin07" || normalizedUser === "master admin07";

      if (isMasterUser && password === "Admin007") {
        authenticatedUser = MASTER_USER;
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        {
          ok: false,
          error: "Usuário ou senha inválidos. Verifique suas credenciais.",
        },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      user: authenticatedUser,
    });

    res.cookies.set(COOKIE_NAME, encodeSession(authenticatedUser), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao processar autenticação." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
