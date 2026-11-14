import { NextRequest, NextResponse } from "next/server";
import { EvolutionWebhookPayload } from "@/services/evolutionApi";

/**
 * Endpoint oficial do CRM para escutar Webhooks da Evolution API em tempo real:
 * POST /api/webhooks/evolution
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvolutionWebhookPayload;

    const eventType = body.event || "messages.upsert";
    const instance = body.instance || "nexus-comercial-01";
    const remoteJid = body.data?.key?.remoteJid || "5511998124401@s.whatsapp.net";
    const incomingText =
      body.data?.message?.conversation ||
      body.data?.message?.extendedTextMessage?.text ||
      "Mensagem recebida via Webhook Evolution API";

    return NextResponse.json(
      {
        received: true,
        timestamp: new Date().toISOString(),
        processedEvent: eventType,
        instance,
        contactJid: remoteJid,
        extractedMessage: incomingText,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        received: false,
        error: "Payload inválido para o Webhook Evolution API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Nexus CRM - Evolution API Webhook Listener",
    supportedEvents: [
      "messages.upsert",
      "messages.update",
      "connection.update",
      "qrcode.updated",
    ],
  });
}
