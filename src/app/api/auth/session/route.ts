import { NextRequest, NextResponse } from "next/server";
import { AuthUser } from "@/types/crm";
import {
  getCompanyById,
  verifyAgentCredentials,
  verifyManagerCredentials,
} from "@/lib/crmStore";
import {
  COOKIE_NAME,
  encodeSession,
  getSessionUser,
} from "@/lib/authSession";

const DEMO_USER: AuthUser = {
  username: "lucas.demo",
  name: "Lucas Andrade",
  role: "Head of Sales",
  initials: "LA",
  mode: "demo",
};

const SUPER_MASTER_USER: AuthUser = {
  username: "Admin07",
  name: "Master Admin07",
  role: "Master da Plataforma",
  initials: "MA",
  mode: "super_master",
};

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
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

      const isSuperMaster =
        normalizedUser === "admin07" || normalizedUser === "master admin07";

      if (isSuperMaster && password === "Admin007") {
        authenticatedUser = SUPER_MASTER_USER;
      } else {
        const manager = verifyManagerCredentials(
          body.username || "",
          password
        );
        if (manager) {
          authenticatedUser = {
            username: manager.username,
            name: manager.name,
            role: `Gerente • ${manager.companyName}`,
            initials: manager.initials,
            mode: "manager",
            companyId: manager.companyId,
            companyName: manager.companyName,
            color: manager.color,
          };
        } else {
          const agent = verifyAgentCredentials(body.username || "", password);
          if (agent) {
            const company = agent.companyId
              ? getCompanyById(agent.companyId)
              : undefined;
            authenticatedUser = {
              username: agent.username,
              name: agent.name,
              role: company ? `Atendente • ${company.name}` : "Atendente",
              initials: agent.initials,
              mode: "agent",
              agentId: agent.id,
              companyId: agent.companyId,
              companyName: company?.name,
              color: agent.color,
            };
          }
        }
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
      maxAge: 60 * 60 * 24 * 7,
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
