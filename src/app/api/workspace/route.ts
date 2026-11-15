import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/authSession";
import {
  getWorkspaceDeals,
  getWorkspaceEvolutionConfig,
  setWorkspaceDeals,
  setWorkspaceEvolutionConfig,
  upsertWorkspaceDeal,
} from "@/lib/crmStore";
import { Deal, EvolutionConfig } from "@/types/crm";

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }

  if (user.mode === "demo" || user.mode === "super_master") {
    return NextResponse.json({ ok: true, deals: null, evolutionConfig: null });
  }

  const companyId = user.companyId || "company-default";
  const allDeals = getWorkspaceDeals(companyId);
  const evolutionConfig = getWorkspaceEvolutionConfig(companyId);

  if (user.mode === "agent") {
    const agentDeals = allDeals.filter(
      (d) => d.seller?.id && d.seller.id === user.agentId
    );
    return NextResponse.json({
      ok: true,
      deals: agentDeals,
      evolutionConfig,
    });
  }

  return NextResponse.json({
    ok: true,
    deals: allDeals,
    evolutionConfig,
  });
}

export async function PUT(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user || user.mode !== "manager") {
    return NextResponse.json(
      { ok: false, error: "Apenas o Gerente da empresa pode salvar o workspace." },
      { status: 403 }
    );
  }

  const companyId = user.companyId || "company-default";

  try {
    const body = (await req.json()) as {
      deals?: Deal[];
      evolutionConfig?: EvolutionConfig;
    };

    if (Array.isArray(body.deals)) {
      setWorkspaceDeals(companyId, body.deals);
    }
    if (body.evolutionConfig) {
      setWorkspaceEvolutionConfig(companyId, body.evolutionConfig);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao salvar workspace." },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user || user.mode === "demo" || user.mode === "super_master") {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 403 });
  }

  const companyId = user.companyId || "company-default";

  try {
    const body = (await req.json()) as { deal?: Deal };
    const deal = body.deal;
    if (!deal || !deal.id) {
      return NextResponse.json({ ok: false, error: "Negócio inválido." }, { status: 400 });
    }

    if (user.mode === "agent") {
      const existing = getWorkspaceDeals(companyId).find((d) => d.id === deal.id);
      if (existing && existing.seller?.id !== user.agentId) {
        return NextResponse.json(
          { ok: false, error: "Você não tem permissão para alterar este atendimento." },
          { status: 403 }
        );
      }
      if (!existing && deal.seller?.id !== user.agentId) {
        return NextResponse.json(
          { ok: false, error: "Atendimento deve pertencer ao seu usuário." },
          { status: 403 }
        );
      }
    }

    upsertWorkspaceDeal(companyId, deal);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar atendimento." },
      { status: 400 }
    );
  }
}
