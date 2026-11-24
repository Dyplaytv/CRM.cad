import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/authSession";
import {
  getCompanyAutomationConfig,
  getCompanyInstanceName,
  getGlobalEvolutionServer,
  getWorkspaceDeals,
  getWorkspaceEvolutionConfig,
  getWorkspaceRevenueTargets,
  setCompanyAutomationConfig,
  setWorkspaceDeals,
  setWorkspaceEvolutionConfig,
  setWorkspaceRevenueTargets,
  upsertWorkspaceDeal,
} from "@/lib/crmStore";
import {
  CompanyAutomationConfig,
  Deal,
  EvolutionConfig,
  FirstContactConfig,
  VirtualAgentConfig,
  VirtualAgentProfile,
} from "@/types/crm";

function buildTenantEvolutionConfig(
  companyId: string,
  companyEvo: EvolutionConfig | null
): EvolutionConfig {
  const globalServer = getGlobalEvolutionServer();
  const instanceName = getCompanyInstanceName(companyId);
  return {
    baseUrl: "",
    apiKey: "",
    instanceName,
    webhookUrl:
      globalServer.webhookUrl ||
      companyEvo?.webhookUrl ||
      "https://crm.cadtech.com.br/api/webhooks/evolution",
    status: companyEvo?.status || "disconnected",
    phoneConnected: companyEvo?.phoneConnected,
    managedByMaster: Boolean(globalServer.baseUrl && globalServer.apiKey),
  };
}

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
  const evolutionConfig = buildTenantEvolutionConfig(
    companyId,
    getWorkspaceEvolutionConfig(companyId)
  );
  const automation = getCompanyAutomationConfig(companyId);
  const revenueTargets = getWorkspaceRevenueTargets(companyId);

  if (user.mode === "agent") {
    const agentDeals = allDeals.filter(
      (d) => d.seller?.id && d.seller.id === user.agentId
    );
    const sanitizedAutomation: CompanyAutomationConfig = {
      ...automation,
      virtualAgent: {
        ...automation.virtualAgent,
        openAiApiKey: "",
      },
    };
    return NextResponse.json({
      ok: true,
      deals: agentDeals,
      evolutionConfig,
      automation: sanitizedAutomation,
      revenueTargets,
    });
  }

  return NextResponse.json({
    ok: true,
    deals: allDeals,
    evolutionConfig,
    automation,
    revenueTargets,
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
      automation?: {
        virtualAgent?: Partial<VirtualAgentConfig>;
        virtualAgents?: VirtualAgentProfile[];
        firstContact?: Partial<FirstContactConfig>;
      };
      revenueTargets?: number[];
    };

    if (Array.isArray(body.deals)) {
      setWorkspaceDeals(companyId, body.deals);
    }
    if (body.evolutionConfig) {
      const existing = getWorkspaceEvolutionConfig(companyId);
      setWorkspaceEvolutionConfig(companyId, {
        ...body.evolutionConfig,
        baseUrl: existing?.baseUrl || "",
        apiKey: existing?.apiKey || "",
        instanceName: getCompanyInstanceName(companyId),
      });
    }
    let updatedAutomation: CompanyAutomationConfig | undefined;
    if (body.automation) {
      updatedAutomation = setCompanyAutomationConfig(companyId, body.automation);
    }
    let updatedTargets: number[] | undefined;
    if (Array.isArray(body.revenueTargets)) {
      updatedTargets = setWorkspaceRevenueTargets(companyId, body.revenueTargets);
    }

    return NextResponse.json({
      ok: true,
      automation: updatedAutomation,
      revenueTargets: updatedTargets,
    });
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
