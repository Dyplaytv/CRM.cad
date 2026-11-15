import { NextRequest, NextResponse } from "next/server";
import { EvolutionConfig } from "@/types/crm";

interface EvolutionProxyBody {
  action: "sendText" | "connect" | "status" | "logout" | "setWebhook";
  config: EvolutionConfig;
  payload?: {
    number?: string;
    text?: string;
    delay?: number;
    linkPreview?: boolean;
  };
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvolutionProxyBody;
    const { action, config, payload } = body;

    const baseUrl = normalizeBaseUrl(config?.baseUrl || "");
    const apiKey = (config?.apiKey || "").trim();
    const instanceName = encodeURIComponent((config?.instanceName || "").trim());

    if (!baseUrl || !apiKey || !instanceName) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Preencha URL Base, Nome da Instância e API Key da Evolution API v2.3.",
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
            instanceName: config.instanceName.trim(),
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
          url: config.webhookUrl.trim(),
          webhookByEvents: false,
          webhookBase64: false,
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
