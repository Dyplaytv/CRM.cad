import { EvolutionConfig } from "@/types/crm";

export interface SendTextPayload {
  number: string;
  text: string;
  delay?: number;
  linkPreview?: boolean;
}

export interface SendMediaPayload {
  number: string;
  mediatype: "image" | "document" | "video" | "audio";
  mimetype: string;
  caption?: string;
  media: string;
  fileName: string;
}

export interface EvolutionWebhookPayload {
  event: "messages.upsert" | "connection.update" | "qrcode.updated";
  instance: string;
  data: {
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp?: number;
    state?: "open" | "close" | "connecting";
  };
}

function isDemoConfig(config: EvolutionConfig): boolean {
  if (config.managedByMaster) return false;
  return (
    !config.baseUrl?.trim() ||
    config.baseUrl.includes("sua-evolution-api.com") ||
    !config.apiKey?.trim()
  );
}

/**
 * Envia mensagem de texto diretamente do CRM para a Evolution API v2.3:
 * POST {baseUrl}/message/sendText/{instanceName}
 */
export async function sendEvolutionTextMessage(
  config: EvolutionConfig,
  payload: SendTextPayload
): Promise<{
  ok: boolean;
  simulated: boolean;
  endpoint: string;
  response: Record<string, unknown>;
  error?: string;
}> {
  const cleanNumber = payload.number.replace(/\D/g, "");
  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/message/sendText/${config.instanceName}`;

  if (!isDemoConfig(config)) {
    try {
      const res = await fetch("/api/evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendText",
          config,
          payload,
        }),
      });
      const json = await res.json();
      return {
        ok: Boolean(json.ok),
        simulated: false,
        endpoint: json.endpoint || endpoint,
        response: json.data || json,
        error: json.error,
      };
    } catch (err) {
      return {
        ok: false,
        simulated: false,
        endpoint,
        response: {},
        error:
          err instanceof Error
            ? err.message
            : "Erro de rede ao enviar para Evolution API v2.3.",
      };
    }
  }

  // Modo simulado (DEMO)
  await new Promise((r) => setTimeout(r, 350));
  return {
    ok: true,
    simulated: true,
    endpoint,
    response: {
      key: {
        remoteJid: `${cleanNumber}@s.whatsapp.net`,
        fromMe: true,
        id: `BAE5${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
      message: {
        conversation: payload.text,
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      status: "PENDING",
    },
  };
}

/**
 * Envia imagem ou documento diretamente do CRM para a Evolution API v2.3:
 * POST {baseUrl}/message/sendMedia/{instanceName}
 */
export async function sendEvolutionMediaMessage(
  config: EvolutionConfig,
  payload: SendMediaPayload
): Promise<{
  ok: boolean;
  simulated: boolean;
  endpoint: string;
  response: Record<string, unknown>;
  error?: string;
}> {
  const cleanNumber = payload.number.replace(/\D/g, "");
  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/message/sendMedia/${config.instanceName}`;

  if (!isDemoConfig(config)) {
    try {
      const res = await fetch("/api/evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendMedia",
          config,
          payload,
        }),
      });
      const json = await res.json();
      return {
        ok: Boolean(json.ok),
        simulated: false,
        endpoint: json.endpoint || endpoint,
        response: json.data || json,
        error: json.error,
      };
    } catch (err) {
      return {
        ok: false,
        simulated: false,
        endpoint,
        response: {},
        error:
          err instanceof Error
            ? err.message
            : "Erro de rede ao enviar mídia para Evolution API v2.3.",
      };
    }
  }

  await new Promise((r) => setTimeout(r, 350));
  return {
    ok: true,
    simulated: true,
    endpoint,
    response: {
      key: {
        remoteJid: `${cleanNumber}@s.whatsapp.net`,
        fromMe: true,
        id: `BAE5${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
      status: "PENDING",
    },
  };
}

/**
 * Consulta QR Code (base64 + pairingCode) na Evolution API v2.3:
 * GET {baseUrl}/instance/connect/{instanceName}
 */
export async function fetchEvolutionQrCode(config: EvolutionConfig): Promise<{
  ok: boolean;
  simulated: boolean;
  endpoint: string;
  pairingCode: string;
  code: string;
  base64?: string;
  count: number;
  error?: string;
}> {
  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/instance/connect/${config.instanceName}`;

  if (!isDemoConfig(config)) {
    try {
      const res = await fetch("/api/evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          config,
        }),
      });
      const json = await res.json();
      const data = json.data || {};
      return {
        ok: Boolean(json.ok),
        simulated: false,
        endpoint: json.endpoint || endpoint,
        pairingCode: data.pairingCode || "AGUARDANDO",
        code: data.code || "",
        base64: data.base64,
        count: data.count || 1,
        error: json.error,
      };
    } catch (err) {
      return {
        ok: false,
        simulated: false,
        endpoint,
        pairingCode: "ERRO",
        code: "",
        count: 0,
        error:
          err instanceof Error
            ? err.message
            : "Erro ao consultar QR Code na Evolution API v2.3.",
      };
    }
  }

  await new Promise((r) => setTimeout(r, 400));
  return {
    ok: true,
    simulated: true,
    endpoint,
    pairingCode: "NXS8-92BR",
    code: `2@${Math.random().toString(36).substring(2, 15)},NexusCRM_EvolutionAPI_v2.3`,
    count: 1,
  };
}

/**
 * Verifica estado da instância na Evolution API v2.3:
 * GET {baseUrl}/instance/connectionState/{instanceName}
 */
export async function checkEvolutionStatus(config: EvolutionConfig): Promise<{
  ok: boolean;
  state: "connected" | "disconnected" | "connecting";
  raw?: unknown;
  error?: string;
}> {
  if (isDemoConfig(config)) {
    return { ok: true, state: config.status };
  }

  try {
    const res = await fetch("/api/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", config }),
    });
    const json = await res.json();
    const rawState = (
      json?.data?.instance?.state ||
      json?.data?.state ||
      ""
    ).toLowerCase();

    const mappedState: "connected" | "disconnected" | "connecting" =
      rawState === "open"
        ? "connected"
        : rawState === "connecting"
        ? "connecting"
        : "disconnected";

    return {
      ok: Boolean(json.ok),
      state: mappedState,
      raw: json.data,
      error: json.error,
    };
  } catch (err) {
    return {
      ok: false,
      state: "disconnected",
      error: err instanceof Error ? err.message : "Erro ao verificar status.",
    };
  }
}

/**
 * Registra automaticamente o Webhook do CRM na Evolution API v2.3:
 * POST {baseUrl}/webhook/set/{instanceName}
 */
export async function configureEvolutionWebhook(
  config: EvolutionConfig
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  if (isDemoConfig(config)) {
    return { ok: true, data: { simulated: true, webhook: config.webhookUrl } };
  }

  try {
    const res = await fetch("/api/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setWebhook", config }),
    });
    const json = await res.json();
    return { ok: Boolean(json.ok), data: json.data, error: json.error };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao configurar webhook.",
    };
  }
}

/**
 * Desconecta a instância na Evolution API v2.3:
 * DELETE {baseUrl}/instance/logout/{instanceName}
 */
export async function logoutEvolutionInstance(
  config: EvolutionConfig
): Promise<{ ok: boolean; error?: string }> {
  if (isDemoConfig(config)) {
    return { ok: true };
  }
  try {
    const res = await fetch("/api/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", config }),
    });
    const json = await res.json();
    return { ok: Boolean(json.ok), error: json.error };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao desconectar.",
    };
  }
}
