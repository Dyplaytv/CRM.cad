import { NextRequest, NextResponse } from "next/server";
import { EvolutionConfig } from "@/types/crm";
import { getSessionUser } from "@/lib/authSession";
import {
  getCompanyInstanceName,
  getGlobalEvolutionServer,
} from "@/lib/crmStore";

interface EvolutionProxyBody {
  action: "sendText" | "sendMedia" | "connect" | "status" | "logout" | "setWebhook";
  config: EvolutionConfig;
  payload?: {
    number?: string;
    text?: string;
    delay?: number;
    linkPreview?: boolean;
    mediatype?: "image" | "document" | "video" | "audio";
    mimetype?: string;
    caption?: string;
    media?: string;
    fileName?: string;
  };
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvolutionProxyBody;
    const { action, config, payload } = body;

    const user = getSessionUser(req);
    const isTenantUser =
      user && (user.mode === "manager" || user.mode === "agent");
    const globalServer = isTenantUser ? getGlobalEvolutionServer() : null;

    const baseUrl = normalizeBaseUrl(
      isTenantUser ? globalServer?.baseUrl || "" : config?.baseUrl || ""
    );
    const apiKey = (
      isTenantUser ? globalServer?.apiKey || "" : config?.apiKey || ""
    ).trim();
    const rawInstance = isTenantUser
      ? getCompanyInstanceName(user.companyId || "company-default")
      : (config?.instanceName || "").trim();
    const instanceName = encodeURIComponent(rawInstance);
    const resolvedWebhookUrl = (
      isTenantUser
        ? globalServer?.webhookUrl || config?.webhookUrl || ""
        : config?.webhookUrl || ""
    ).trim();

    if (!baseUrl || !apiKey || !instanceName) {
      return NextResponse.json(
        {
          ok: false,
          error: isTenantUser
            ? "O Master da plataforma ainda não configurou o servidor da Evolution API."
            : "Preencha URL Base, Nome da Instância e API Key da Evolution API v2.3.",
        },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: apiKey,
    };

    if (action === "status") {
      const endpoint = `${baseUrl}/instance/connectionState/${instanceName}`;
      const res = await fetch(endpoint, { method: "GET", headers });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { ok: res.ok, status: res.status, endpoint, data },
        { status: res.ok ? 200 : res.status }
      );
    }

    if (action === "connect") {
      const connectEndpoint = `${baseUrl}/instance/connect/${instanceName}`;
      let res = await fetch(connectEndpoint, { method: "GET", headers });

      // Na Evolution API v2.3, se a instância ainda não existir (404), criamos automaticamente com WHATSAPP-BAILEYS
      if (res.status === 404) {
        const createEndpoint = `${baseUrl}/instance/create`;
        const createRes = await fetch(createEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            instanceName: rawInstance,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true,
          }),
        });
        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          return NextResponse.json(
            {
              ok: false,
              status: createRes.status,
              endpoint: createEndpoint,
              data: createData,
              error:
                createData?.message ||
                createData?.error ||
                "Falha ao criar instância na Evolution API v2.3.",
            },
            { status: createRes.status }
          );
        }

        // Registra o webhook automaticamente ao criar instância da empresa
        if (resolvedWebhookUrl) {
          await fetch(`${baseUrl}/webhook/set/${instanceName}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              webhook: {
                enabled: true,
                url: resolvedWebhookUrl,
                webhookByEvents: false,
                webhookBase64: true,
                events: [
                  "MESSAGES_UPSERT",
                  "MESSAGES_UPDATE",
                  "CONNECTION_UPDATE",
                  "QRCODE_UPDATED",
                ],
              },
            }),
          }).catch(() => {});
        }

        if (createData?.qrcode?.base64 || createData?.qrcode?.code) {
          return NextResponse.json({
            ok: true,
            status: 200,
            endpoint: createEndpoint,
            data: createData.qrcode,
          });
        }

        res = await fetch(connectEndpoint, { method: "GET", headers });
      }

      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          ok: res.ok,
          status: res.status,
          endpoint: connectEndpoint,
          data,
          error: !res.ok
            ? data?.message || data?.error || "Erro ao obter QR Code."
            : undefined,
        },
        { status: res.ok ? 200 : res.status }
      );
    }

    if (action === "logout") {
      const endpoint = `${baseUrl}/instance/logout/${instanceName}`;
      const res = await fetch(endpoint, { method: "DELETE", headers });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { ok: res.ok, status: res.status, endpoint, data },
        { status: res.ok ? 200 : res.status }
      );
    }

    if (action === "setWebhook") {
      const endpoint = `${baseUrl}/webhook/set/${instanceName}`;
      const webhookBody = {
        webhook: {
          enabled: true,
          url: resolvedWebhookUrl,
          webhookByEvents: false,
          webhookBase64: true,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "CONNECTION_UPDATE",
            "QRCODE_UPDATED",
          ],
        },
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(webhookBody),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          ok: res.ok,
          status: res.status,
          endpoint,
          data,
          error: !res.ok
            ? data?.message || data?.error || "Erro ao registrar webhook."
            : undefined,
        },
        { status: res.ok ? 200 : res.status }
      );
    }

    if (action === "sendText") {
      const cleanNumber = (payload?.number || "").replace(/\D/g, "");
      const text = (payload?.text || "").trim();
      if (!cleanNumber || !text) {
        return NextResponse.json(
          { ok: false, error: "Número e texto são obrigatórios." },
          { status: 400 }
        );
      }

      // Padrão oficial da Evolution API v2.3: campos no nível raiz (number, text, delay, linkPreview)
      const endpoint = `${baseUrl}/message/sendText/${instanceName}`;
      const v23Body = {
        number: cleanNumber,
        text,
        delay: payload?.delay ?? 1200,
        linkPreview: payload?.linkPreview ?? true,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(v23Body),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          ok: res.ok,
          status: res.status,
          endpoint,
          data,
          error: !res.ok
            ? data?.message || data?.error || "Falha ao enviar mensagem."
            : undefined,
        },
        { status: res.ok ? 200 : res.status }
      );
    }

    if (action === "sendMedia") {
      const cleanNumber = (payload?.number || "").replace(/\D/g, "");
      const media = (payload?.media || "").trim();
      if (!cleanNumber || !media) {
        return NextResponse.json(
          { ok: false, error: "Número e arquivo são obrigatórios." },
          { status: 400 }
        );
      }

      const endpoint = `${baseUrl}/message/sendMedia/${instanceName}`;
      const v23MediaBody = {
        number: cleanNumber,
        mediatype: payload?.mediatype || "document",
        mimetype: payload?.mimetype || "application/octet-stream",
        caption: payload?.caption || "",
        media,
        fileName: payload?.fileName || "arquivo",
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(v23MediaBody),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          ok: res.ok,
          status: res.status,
          endpoint,
          data,
          error: !res.ok
            ? data?.message || data?.error || "Falha ao enviar mídia."
            : undefined,
        },
        { status: res.ok ? 200 : res.status }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Ação Evolution API inválida." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? `Erro de conexão com Evolution API: ${err.message}`
            : "Erro desconhecido ao conectar com Evolution API.",
      },
      { status: 502 }
    );
  }
}
