import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookMessagesSince,
  pushWebhookMessage,
} from "@/lib/webhookStore";

interface EvolutionV23WebhookBody {
  event?: string;
  instance?: string;
  data?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
      imageMessage?: {
        caption?: string;
      };
      videoMessage?: {
        caption?: string;
      };
    };
    messageTimestamp?: number;
    state?: "open" | "close" | "connecting";
  };
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
    const remoteJid = body.data?.key?.remoteJid || "";
    const fromMe = Boolean(body.data?.key?.fromMe);
    const messageId =
      body.data?.key?.id ||
      `whk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const incomingText =
      body.data?.message?.conversation ||
      body.data?.message?.extendedTextMessage?.text ||
      body.data?.message?.imageMessage?.caption ||
      body.data?.message?.videoMessage?.caption ||
      "";

    const phone = remoteJid.split("@")[0].replace(/\D/g, "");

    if (
      (eventType === "messages.upsert" || eventType === "messages_upsert") &&
      !fromMe &&
      incomingText.trim() &&
      phone
    ) {
      pushWebhookMessage({
        id: messageId,
        instance,
        remoteJid,
        phone,
        pushName: body.data?.pushName || phone,
        text: incomingText.trim(),
        fromMe,
        receivedAt: Date.now(),
      });
    }

    return NextResponse.json(
      {
        received: true,
        timestamp: new Date().toISOString(),
        processedEvent: eventType,
        instance,
        contactJid: remoteJid || "unknown",
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
  const since = sinceParam ? Number(sinceParam) : 0;

  if (!Number.isNaN(since) && since > 0) {
    return NextResponse.json({
      status: "online",
      events: getWebhookMessagesSince(since),
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
