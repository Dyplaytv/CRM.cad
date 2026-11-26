import { ChatMessage, Deal, Seller } from "@/types/crm";
import {
  buildVirtualAgentSeller,
  findCompanyIdByInstance,
  findEvolutionConfigByInstance,
  findVirtualAgentForDeal,
  getCompanyAutomationConfig,
  getWorkspaceDeals,
  listAgents,
  resolveFirstContactSeller,
  resolveManagerSeller,
  upsertWorkspaceDeal,
} from "@/lib/crmStore";

interface InboundWebhookParams {
  id: string;
  instance: string;
  remoteJid: string;
  phone: string;
  pushName: string;
  text: string;
  receivedAt: number;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video" | "audio";
  fileName?: string;
}

async function generateOpenAiReply(params: {
  apiKey: string;
  model: string;
  agentName: string;
  specialty?: string;
  personality?: string;
  knowledgeBase: string;
  contactName: string;
  messages: ChatMessage[];
}): Promise<string | null> {
  const systemPrompt = [
    `Você é ${params.agentName}, atendente virtual oficial da empresa no WhatsApp.`,
    params.specialty?.trim()
      ? `Sua especialidade/função: ${params.specialty.trim()}.`
      : "",
    params.personality?.trim()
      ? `Personalidade e tom de voz: ${params.personality.trim()}.`
      : "",
    `Responda sempre em português do Brasil, de forma cordial, clara, objetiva e natural.`,
    `Nunca invente informações que não estejam na base de conhecimento; se não souber algo específico, informe que um especialista humano dará sequência.`,
    params.knowledgeBase.trim()
      ? `\n--- BASE DE CONHECIMENTO DA EMPRESA ---\n${params.knowledgeBase.trim()}\n--- FIM DA BASE ---`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const history = params.messages.slice(-12).map((m) => ({
    role: m.sender === "client" ? ("user" as const) : ("assistant" as const),
    content: m.text || "[Mídia enviada]",
  }));

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model || "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 450,
        messages: [{ role: "system", content: systemPrompt }, ...history],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || null;
  } catch {
    return null;
  }
}

async function sendEvolutionReply(params: {
  instance: string;
  phone: string;
  text: string;
}): Promise<boolean> {
  const evo = findEvolutionConfigByInstance(params.instance);
  const baseUrl = evo?.baseUrl?.trim().replace(/\/+$/, "");
  const apiKey = evo?.apiKey?.trim();
  const targetInstance = (evo?.instanceName || params.instance || "").trim();
  if (!baseUrl || !apiKey || !targetInstance) return false;

  try {
    const res = await fetch(
      `${baseUrl}/message/sendText/${encodeURIComponent(targetInstance)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: params.phone.replace(/\D/g, ""),
          text: params.text,
          delay: 900,
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function evaluateSupervisorRouting(params: {
  companyId: string;
  apiKey: string;
  model: string;
  instructions: string;
  deal: Deal;
  isNewLead: boolean;
}): Promise<{ nextSeller: Seller; reason: string } | null> {
  const auto = getCompanyAutomationConfig(params.companyId);
  const humanAgents = listAgents(params.companyId).filter((a) => a.active);
  const aiAgents = (auto.virtualAgents || []).filter((a) => a.active);
  const managerSeller = resolveManagerSeller(params.companyId);

  const candidates = [
    ...aiAgents.map((a) => ({
      id: a.id,
      tipo: "Atendente IA",
      nome: a.name,
      caracteristicas: [a.specialty, a.personality].filter(Boolean).join(" | ") || "Atendimento virtual geral",
    })),
    ...humanAgents.map((a) => ({
      id: a.id,
      tipo: "Atendente Humano",
      nome: a.name,
      caracteristicas: a.specialty || "Atendente humano geral",
    })),
    {
      id: managerSeller.id,
      tipo: "Gerente Humano",
      nome: managerSeller.name,
      caracteristicas: "Escalonamento, reclamações graves, negociações especiais ou casos sem especialista.",
    },
  ];

  if (candidates.length === 0) return null;

  const historyText = params.deal.messages
    .slice(-10)
    .map((m) => `${m.sender === "client" ? "Cliente" : "Atendente"}: ${m.text}`)
    .join("\n");

  const systemPrompt = [
    "Você é o Gerente Artificial (Supervisor de Atendimento) de um CRM no WhatsApp.",
    "Sua função é ler as mensagens do cliente, avaliar o assunto, a intenção e o TOM da conversa (ex: dúvida simples, interesse comercial, suporte técnico, reclamação, irritação, pedido de cancelamento) e decidir qual atendente da equipe tem as características ideais para atender neste momento.",
    params.instructions.trim()
      ? `\nRegras da Empresa:\n${params.instructions.trim()}`
      : "",
    `\nEquipe disponível (use exatamente o "id" ao escolher):\n${JSON.stringify(candidates, null, 2)}`,
    '\nResponda EXCLUSIVAMENTE em JSON válido no formato: {"action":"keep"|"transfer","targetId":"<id>","reason":"<motivo curto em português>"}',
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = params.isNewLead
    ? `Novo lead entrou em contato.\nMensagens:\n${historyText}\nEscolha o melhor atendente (action: "transfer").`
    : `Atendente atual: ${params.deal.seller.name} (id: ${params.deal.seller.id}, função: ${params.deal.seller.role}).\nMensagens recentes:\n${historyText}\nDecida se mantém ("keep") ou se a conversa mudou de assunto/tom e precisa transferir ("transfer") para outro atendente.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      action?: string;
      targetId?: string;
      reason?: string;
    };

    if (parsed.action !== "transfer" || !parsed.targetId) return null;
    if (!params.isNewLead && parsed.targetId === params.deal.seller.id) {
      return null;
    }

    const aiMatch = aiAgents.find((a) => a.id === parsed.targetId);
    if (aiMatch) {
      return {
        nextSeller: buildVirtualAgentSeller(
          aiMatch.name,
          aiMatch.id,
          aiMatch.specialty,
          aiMatch.initials,
          aiMatch.color
        ),
        reason: parsed.reason || "Assunto compatível com atendente IA",
      };
    }

    const humanMatch = humanAgents.find((a) => a.id === parsed.targetId);
    if (humanMatch) {
      return {
        nextSeller: {
          id: humanMatch.id,
          name: humanMatch.name,
          role: humanMatch.specialty ? `Humano • ${humanMatch.specialty}` : "Atendente",
          avatar: "",
          initials: humanMatch.initials,
          color: humanMatch.color,
        },
        reason: parsed.reason || "Assunto ou tom direcionado para atendente humano",
      };
    }

    if (parsed.targetId === managerSeller.id) {
      return {
        nextSeller: managerSeller,
        reason: parsed.reason || "Escalonado para o Gerente",
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function processInboundWebhookAndAi(
  params: InboundWebhookParams
): Promise<{ assignedSeller: Seller; aiReply?: ChatMessage }> {
  const companyId = findCompanyIdByInstance(params.instance);
  const deals = getWorkspaceDeals(companyId);
  const phoneDigits = params.phone.replace(/\D/g, "");
  const suffix = phoneDigits.slice(-8);

  const timeLabel = new Date(params.receivedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const inboundMsg: ChatMessage = {
    id: params.id,
    sender: "client",
    text: params.text,
    timestamp: timeLabel,
    mediaUrl: params.mediaUrl,
    mediaType: params.mediaType,
    fileName: params.fileName,
  };

  let targetDeal =
    suffix.length >= 8
      ? deals.find((d) => d.contactPhone.replace(/\D/g, "").endsWith(suffix))
      : undefined;

  const isNewLead = !targetDeal;

  if (targetDeal) {
    if (!targetDeal.messages.some((m) => m.id === inboundMsg.id)) {
      targetDeal = {
        ...targetDeal,
        unreadCount: (targetDeal.unreadCount ?? 0) + 1,
        messages: [...targetDeal.messages, inboundMsg],
        timeline: [
          {
            id: `ev-${inboundMsg.id}`,
            title: "Mensagem recebida via Evolution API v2.3",
            description: inboundMsg.text.slice(0, 70),
            timestamp: timeLabel,
            type: "whatsapp",
          },
          ...targetDeal.timeline,
        ],
      };
      upsertWorkspaceDeal(companyId, targetDeal);
    }
  } else {
    const assignedSeller = resolveFirstContactSeller(companyId);
    const displayName = params.pushName || `+${params.phone}`;
    const newDeal: Deal = {
      id: `wa-${suffix || phoneDigits}-${params.receivedAt}`,
      title: "Atendimento WhatsApp (Inbound)",
      company: displayName,
      contactName: displayName,
      contactRole: "Lead WhatsApp",
      contactEmail: "pendente@whatsapp.lead",
      contactPhone: params.phone.startsWith("+") ? params.phone : `+${params.phone}`,
      cnpj: "A preencher",
      city: "Brasil",
      value: 0,
      stage: "leads",
      priority: "Alta",
      stagnantDays: 0,
      seller: assignedSeller,
      tags: ["WhatsApp", "Inbound"],
      customFields: {
        origin: "WhatsApp Evolution API v2.3",
        segment: "A classificar",
        employees: "-",
        expectedClose: "A definir",
      },
      notes: `<p>Lead criado automaticamente ao receber mensagem via Evolution API v2.3.</p>`,
      tasks: [],
      messages: [inboundMsg],
      unreadCount: 1,
      timeline: [
        {
          id: `ev-${params.id}`,
          title: "Lead criado via WhatsApp (Evolution API v2.3)",
          description: params.text.slice(0, 70),
          timestamp: timeLabel,
          type: "whatsapp",
        },
      ],
    };
    upsertWorkspaceDeal(companyId, newDeal);
    targetDeal = newDeal;
  }

  let aiReply: ChatMessage | undefined;
  const automation = getCompanyAutomationConfig(companyId);

  // Supervisão Contínua do Gerente Artificial (IA): lê as mensagens e roteia/transfere se mudar o assunto ou tom
  const supervisor = automation.aiSupervisor;
  const shouldRunSupervisor =
    automation.aiAllowedByMaster &&
    Boolean(automation.virtualAgent.openAiApiKey) &&
    (Boolean(supervisor?.enabled) ||
      (isNewLead && automation.firstContact.mode === "ai_manager"));

  const currentIsAi = Boolean(
    findVirtualAgentForDeal(companyId, targetDeal.seller?.id)
  );
  const canReassignCurrent =
    isNewLead ||
    currentIsAi ||
    supervisor?.allowReassignFromHuman !== false;

  if (shouldRunSupervisor && canReassignCurrent) {
    const decision = await evaluateSupervisorRouting({
      companyId,
      apiKey: automation.virtualAgent.openAiApiKey,
      model: supervisor?.model || automation.virtualAgent.model,
      instructions: supervisor?.instructions || "",
      deal: targetDeal,
      isNewLead,
    });

    if (decision && decision.nextSeller.id !== targetDeal.seller?.id) {
      targetDeal = {
        ...targetDeal,
        seller: decision.nextSeller,
        timeline: [
          {
            id: `ev-sup-${Date.now()}`,
            title: `Gerente IA ${isNewLead ? "direcionou" : "transferiu"} para ${decision.nextSeller.name}`,
            description: decision.reason,
            timestamp: timeLabel,
            type: "stage",
          },
          ...targetDeal.timeline,
        ],
      };
      upsertWorkspaceDeal(companyId, targetDeal);
    }
  }

  const matchedAi = findVirtualAgentForDeal(companyId, targetDeal.seller?.id);

  if (
    matchedAi &&
    automation.aiAllowedByMaster &&
    automation.virtualAgent.openAiApiKey
  ) {
    const replyText = await generateOpenAiReply({
      apiKey: automation.virtualAgent.openAiApiKey,
      model: matchedAi.model || automation.virtualAgent.model,
      agentName: matchedAi.name,
      specialty: matchedAi.specialty,
      personality: matchedAi.personality,
      knowledgeBase: matchedAi.knowledgeBase,
      contactName: targetDeal.contactName,
      messages: targetDeal.messages,
    });

    if (replyText) {
      const sent = await sendEvolutionReply({
        instance: params.instance,
        phone: params.phone,
        text: replyText,
      });

      const replyTime = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      aiReply = {
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: "me",
        text: replyText,
        timestamp: replyTime,
        status: sent ? "sent" : "delivered",
      };

      const refreshedDeal: Deal = {
        ...targetDeal,
        unreadCount: 0,
        messages: [...targetDeal.messages, aiReply],
        timeline: [
          {
            id: `ev-${aiReply.id}`,
            title: `Resposta automática (${matchedAi.name})`,
            description: replyText.slice(0, 70),
            timestamp: replyTime,
            type: "whatsapp",
          },
          ...targetDeal.timeline,
        ],
      };
      upsertWorkspaceDeal(companyId, refreshedDeal);
    }
  }

  return {
    assignedSeller: targetDeal.seller,
    aiReply,
  };
}
