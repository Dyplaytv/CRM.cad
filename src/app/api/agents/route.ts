import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/authSession";
import { createAgent, deleteAgent, listAgents } from "@/lib/crmStore";

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }
  if (user.mode !== "manager") {
    return NextResponse.json({ ok: true, agents: [] });
  }
  return NextResponse.json({ ok: true, agents: listAgents(user.companyId) });
}

export async function POST(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user || user.mode !== "manager") {
    return NextResponse.json(
      { ok: false, error: "Apenas o Gerente pode adicionar atendentes." },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      username?: string;
      password?: string;
    };

    const result = createAgent({
      companyId: user.companyId,
      name: body.name || "",
      username: body.username || "",
      password: body.password || "",
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, agent: result.agent });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao criar atendente." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user || user.mode !== "manager") {
    return NextResponse.json(
      { ok: false, error: "Apenas o Gerente pode remover atendentes." },
      { status: 403 }
    );
  }

  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "ID do atendente é obrigatório." },
      { status: 400 }
    );
  }

  const removed = deleteAgent(id, user.companyId);
  if (!removed) {
    return NextResponse.json(
      { ok: false, error: "Atendente não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
