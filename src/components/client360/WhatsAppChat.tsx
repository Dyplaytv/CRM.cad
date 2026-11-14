"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  CheckCheck,
  Radio,
  Code2,
  Sparkles,
  Phone,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { ChatMessage, Deal, EvolutionConfig } from "@/types/crm";
import { sendEvolutionTextMessage } from "@/services/evolutionApi";

interface WhatsAppChatProps {
  deal: Deal;
  evolutionConfig: EvolutionConfig;
  onAddMessage: (dealId: string, msg: ChatMessage) => void;
}

export function WhatsAppChat({
  deal,
  evolutionConfig,
  onAddMessage,
}: WhatsAppChatProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showApiInspector, setShowApiInspector] = useState(false);
  const [lastApiLog, setLastApiLog] = useState<{
    method: string;
    endpoint: string;
    payload: unknown;
    response: unknown;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [deal.messages]);

  const quickTemplates = [
    `Olá ${deal.contactName.split(" ")[0]}, tudo bem? Vi que você abriu nossa proposta comercial.`,
    "Podemos agendar uma call rápida de 10 minutos hoje às 15h para alinhar os próximos passos?",
    "Acabei de enviar o link de assinatura digital no seu e-mail corporativo!",
  ];

  // Envia mensagem via POST /message/sendText (Evolution API)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending) return;

    const currentText = text.trim();
    setText("");
    setSending(true);

    const now = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "me",
      text: currentText,
      timestamp: now,
      status: "read",
    };

    onAddMessage(deal.id, newMsg);

    const apiResult = await sendEvolutionTextMessage(evolutionConfig, {
      number: deal.contactPhone,
      text: currentText,
    });

    setLastApiLog({
      method: "POST /message/sendText",
      endpoint: apiResult.endpoint,
      payload: {
        number: deal.contactPhone.replace(/\D/g, ""),
        textMessage: { text: currentText },
      },
      response: apiResult.response,
    });

    setSending(false);
  };

  // Dispara o listener real de Webhook do CRM (/api/webhooks/evolution) simulando uma resposta em tempo real do cliente
  const handleSimulateIncomingWebhook = async () => {
    const sampleReplies = [
      "Perfeito! Acabei de aprovar internamente com a diretoria financeira. Podemos avançar!",
      "Muito obrigado pelo retorno rápido. Você consegue incluir o treinamento da equipe no pacote?",
      "Excelente! Recebi aqui no WhatsApp. Vou assinar o contrato ainda hoje.",
    ];
    const chosenText =
      sampleReplies[Math.floor(Math.random() * sampleReplies.length)];

    const webhookPayload = {
      event: "messages.upsert",
      instance: evolutionConfig.instanceName,
      data: {
        key: {
          remoteJid: `${deal.contactPhone.replace(/\D/g, "")}@s.whatsapp.net`,
          fromMe: false,
          id: `WHK_${Date.now()}`,
        },
        pushName: deal.contactName,
        message: {
          conversation: chosenText,
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    };

    try {
      const res = await fetch("/api/webhooks/evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });
      const json = await res.json();

      setLastApiLog({
        method: "WEBHOOK -> POST /api/webhooks/evolution",
        endpoint: "/api/webhooks/evolution",
        payload: webhookPayload,
        response: json,
      });
    } catch {
      // ignore network error
    }

    const now = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    onAddMessage(deal.id, {
      id: `whk-${Date.now()}`,
      sender: "client",
      text: chosenText,
      timestamp: now,
    });
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-[#efeae2] dark:bg-[#0b141a]">
      {/* WhatsApp Web Style Header */}
      <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center">
              {deal.contactName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#202c33]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {deal.contactName}
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                Evolution API
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
              <Phone className="w-3 h-3" />
              {deal.contactPhone} • Online no WhatsApp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSimulateIncomingWebhook}
            title="Simular recebimento de Webhook da Evolution API (messages.upsert)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Simular Webhook</span>
          </button>

          <button
            type="button"
            onClick={() => setShowApiInspector(!showApiInspector)}
            title="Inspecionar Payload REST / Webhook da Evolution API"
            className={`p-1.5 rounded-xl border text-xs transition-colors ${
              showApiInspector
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Evolution API Live Inspector */}
      {showApiInspector && (
        <div className="p-3 bg-zinc-950 text-zinc-200 border-b border-zinc-800 text-[11px] font-mono max-h-44 overflow-y-auto">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span>
              Instância: {evolutionConfig.instanceName} (POST /message/sendText)
            </span>
            <span className="text-[10px] text-zinc-400">
              Webhook: /api/webhooks/evolution
            </span>
          </div>
          {lastApiLog ? (
            <pre className="text-[10px] text-zinc-300 whitespace-pre-wrap">
              {JSON.stringify(lastApiLog, null, 2)}
            </pre>
          ) : (
            <p className="text-zinc-400">
              Envie uma mensagem ou clique em &ldquo;Simular Webhook&rdquo; para
              inspecionar a requisição real.
            </p>
          )}
        </div>
      )}

      {/* Chat Messages Area (WhatsApp Web Familiar Bubbles) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="flex justify-center">
          <span className="text-[10px] px-3 py-1 rounded-full bg-white/90 dark:bg-[#182229] text-zinc-500 dark:text-zinc-400 shadow-sm border border-zinc-200/50 dark:border-zinc-800">
            Conversa sincronizada via Evolution API • Criptografia ponta-a-ponta
          </span>
        </div>

        {deal.messages.map((msg) => {
          const isMe = msg.sender === "me";
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                  isMe
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-zinc-900 dark:text-zinc-100 rounded-tr-none"
                    : "bg-white dark:bg-[#202c33] text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-200/60 dark:border-zinc-800"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-zinc-500 dark:text-zinc-300/80">
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <CheckCheck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick AI / Sales Templates */}
      <div className="px-3 py-2 bg-[#f0f2f5]/90 dark:bg-[#182229] border-t border-zinc-200/70 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        {quickTemplates.map((tpl, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setText(tpl)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-white dark:bg-[#202c33] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 whitespace-nowrap transition-colors"
          >
            {tpl.slice(0, 42)}...
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2"
      >
        <button
          type="button"
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 transition-colors"
          title="Anexar Proposta PDF"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma mensagem para enviar via Evolution API..."
          className="flex-1 rounded-xl px-3.5 py-2 text-xs bg-white dark:bg-[#2a3942] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none border border-zinc-200/70 dark:border-zinc-700/80"
        />

        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
}
