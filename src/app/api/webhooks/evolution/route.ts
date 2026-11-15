import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookMessagesSince,
  pushWebhookMessage,
} from "@/lib/webhookStore";
import { getWorkspaceEvolutionConfig } from "@/lib/crmStore";

interface EvolutionMessageContent {
  conversation?: string;
  base64?: string;
  extendedTextMessage?: {
    text?: string;
  };
  imageMessage?: {
    caption?: string;
    mimetype?: string;
    url?: string;
    jpegThumbnail?: string;
  };
  stickerMessage?: {
    mimetype?: string;
    url?: string;
  };
  documentMessage?: {
    caption?: string;
    mimetype?: string;
    fileName?: string;
    url?: string;
  };
  documentWithCaptionMessage?: {
    message?: {
      documentMessage?: {
        caption?: string;
        mimetype?: string;
        fileName?: string;
        url?: string;
      };
    };
  };
  videoMessage?: {
    caption?: string;
    mimetype?: string;
    url?: string;
  };
  audioMessage?: {
    mimetype?: string;
    url?: string;
  };
  ephemeralMessage?: {
    message?: EvolutionMessageContent;
  };
  viewOnceMessage?: {
    message?: EvolutionMessageContent;
  };
  viewOnceMessageV2?: {
    message?: EvolutionMessageContent;
  };
}

interface EvolutionV23WebhookBody {
  event?: string;
  instance?: string;
  sender?: string;
  base64?: string;
  data?: {
    key?: {
      remoteJid?: string;
      remoteJidAlt?: string;
      participant?: string;
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    message?: EvolutionMessageContent;
    base64?: string;
    messageTimestamp?: number;
    state?: "open" | "close" | "connecting";
  };
}

function extractPhoneFromKey(
  key?: EvolutionV23WebhookBody["data"] extends infer D
    ? D extends { key?: infer K }
      ? K
      : never
    : never
): { phone: string; remoteJid: string } {
  const jid = key?.remoteJid || "";
  const alt = key?.remoteJidAlt || "";
  const participant = key?.participant || "";

  // Na Evolution API v2.3 / Baileys, contas com @lid trazem o número real em remoteJidAlt
  const preferredJid = jid.endsWith("@lid") && alt ? alt : jid || alt || participant;
  const phone = preferredJid.split("@")[0].replace(/\D/g, "");
  return { phone, remoteJid: preferredJid };
}

/**
 * Endpoint oficial do CRM para escutar Webhooks da Evolution API v2.3 em tempo real:
 * POST /api/webhooks/evolution
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvolutionV23WebhookBody;

    const eventType = (body.event || "messages.upsert").toLowerCase();
    const instance = body.instance || "nexus-comercial-01";
    const fromMe = Boolean(body.data?.key?.fromMe);
    const messageId =
      body.data?.key?.id ||
      `whk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const rawMsg = body.data?.message;
    const msg =
      rawMsg?.ephemeralMessage?.message ||
      rawMsg?.viewOnceMessage?.message ||
      rawMsg?.viewOnceMessageV2?.message ||
      rawMsg;

    const docMsg =
      msg?.documentMessage ||
      msg?.documentWithCaptionMessage?.message?.documentMessage;

    let mediaType: "image" | "document" | "video" | "audio" | undefined;
    let mimetype = "application/octet-stream";
    let fileName: string | undefined;

    if (msg?.imageMessage || msg?.stickerMessage) {
      mediaType = "image";
      mimetype =
        msg.imageMessage?.mimetype ||
        msg.stickerMessage?.mimetype ||
        "image/jpeg";
    } else if (docMsg) {
      mediaType = "document";
      mimetype = docMsg.mimetype || "application/pdf";
      fileName = docMsg.fileName || "Documento";
    } else if (msg?.videoMessage) {
      mediaType = "video";
      mimetype = msg.videoMessage.mimetype || "video/mp4";
    } else if (msg?.audioMessage) {
      mediaType = "audio";
      mimetype = msg.audioMessage.mimetype || "audio/ogg";
    }

    let rawBase64 =
      msg?.base64 || rawMsg?.base64 || body.data?.base64 || body.base64 || "";

    // Se a Evolution API não enviou o base64 inline no webhook, buscamos diretamente via REST v2.3
    if (mediaType && !rawBase64 && !fromMe && body.data?.key) {
      const evoConfig = getWorkspaceEvolutionConfig();
      const baseUrl = evoConfig?.baseUrl?.trim().replace(/\/+$/, "");
      const apiKey = evoConfig?.apiKey?.trim();
      const targetInstance = (
        evoConfig?.instanceName ||
        instance ||
        ""
      ).trim();

      if (baseUrl && apiKey && targetInstance) {
        try {
          const mediaRes = await fetch(
            `${baseUrl}/chat/getBase64FromMediaMessage/${encodeURIComponent(
              targetInstance
            )}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: apiKey,
              },
              body: JSON.stringify({
                message: {
                  key: body.data.key,
                  message: body.data.message,
                },
                convertToMp4: false,
              }),
            }
          );
          if (mediaRes.ok) {
            const mediaJson = (await mediaRes.json()) as {
              base64?: string;
              mimetype?: string;
            };
            if (mediaJson?.base64) {
              rawBase64 = mediaJson.base64;
              if (mediaJson.mimetype) {
                mimetype = mediaJson.mimetype;
              }
            }
          }
        } catch {
          // fallback below
        }
      }
    }

    if (mediaType === "image" && !rawBase64 && msg?.imageMessage?.jpegThumbnail) {
      rawBase64 = msg.imageMessage.jpegThumbnail;
      mimetype = "image/jpeg";
    }

    const mediaUrl =
      mediaType && rawBase64
        ? rawBase64.startsWith("data:")
          ? rawBase64
          : `data:${mimetype};base64,${rawBase64}`
        : undefined;

    const fallbackLabel =
      mediaType === "image"
        ? "📷 Imagem recebida"
        : mediaType === "document"
        ? `📎 Documento: ${fileName || "arquivo"}`
        : mediaType === "video"
        ? "🎥 Vídeo recebido"
        : mediaType === "audio"
        ? "🎤 Áudio recebido"
        : "";

    const incomingText =
      msg?.conversation ||
      msg?.extendedTextMessage?.text ||
      msg?.imageMessage?.caption ||
      docMsg?.caption ||
      msg?.videoMessage?.caption ||
      fallbackLabel;

    const { phone, remoteJid } = extractPhoneFromKey(body.data?.key);

    if (
      (eventType === "messages.upsert" ||
        eventType === "messages_upsert" ||
        eventType === "messages-upsert") &&
      !fromMe &&
      (incomingText.trim() || mediaUrl) &&
      phone
    ) {
      pushWebhookMessage({
        id: messageId,
        instance,
        remoteJid,
        phone,
        pushName: body.data?.pushName || phone,
        text: incomingText.trim() || fallbackLabel,
        fromMe,
        receivedAt: Date.now(),
        mediaUrl,
        mediaType,
        fileName,
      });
    }

    return NextResponse.json(
      {
        received: true,
        timestamp: new Date().toISOString(),
        processedEvent: eventType,
        instance,
        contactJid: remoteJid || "unknown",
        extractedPhone: phone || null,
        extractedMessage: incomingText || null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        received: false,
        error: "Payload inválido para o Webhook Evolution API v2.3",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const sinceParam = req.nextUrl.searchParams.get("since");
  const recentParam = req.nextUrl.searchParams.get("recent");

  if (recentParam === "1") {
    return NextResponse.json({
      status: "online",
      events: getWebhookMessagesSince(0).slice(-15).reverse(),
      serverTime: Date.now(),
    });
  }

  if (sinceParam !== null) {
    const since = Number(sinceParam);
    return NextResponse.json({
      status: "online",
      events: getWebhookMessagesSince(Number.isNaN(since) ? 0 : since),
      serverTime: Date.now(),
    });
  }

  return NextResponse.json({
    status: "online",
    service: "Nexus CRM - Evolution API v2.3 Webhook Listener",
    supportedEvents: [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED",
    ],
    serverTime: Date.now(),
  });
}
