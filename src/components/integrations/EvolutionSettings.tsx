"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  RefreshCw,
  CheckCircle2,
  XCircle,
  KeyRound,
  Globe,
  Webhook,
  Server,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Radio,
  Activity,
  AlertCircle,
} from "lucide-react";
import { EvolutionConfig } from "@/types/crm";
import {
  checkEvolutionStatus,
  configureEvolutionWebhook,
  fetchEvolutionQrCode,
  logoutEvolutionInstance,
} from "@/services/evolutionApi";

interface EvolutionSettingsProps {
  config: EvolutionConfig;
  onUpdateConfig: (next: EvolutionConfig) => void;
  companyOnly?: boolean;
}

export function EvolutionSettings({
  config,
  onUpdateConfig,
  companyOnly = false,
}: EvolutionSettingsProps) {
  const [loadingQr, setLoadingQr] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [qrPayload, setQrPayload] = useState<{
    pairingCode: string;
    code: string;
    base64?: string;
    endpoint: string;
  }>({
    pairingCode: "NXS8-92BR",
    code: "2@EvolutionAPI_v2.3_NexusCRM",
    endpoint: `${config.baseUrl}/instance/connect/${config.instanceName}`,
  });
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(
    null
  );

  const isRealServer =
    Boolean(config.managedByMaster) ||
    (Boolean(config.baseUrl?.trim()) &&
      !config.baseUrl.includes("sua-evolution-api.com") &&
      Boolean(config.apiKey?.trim()));

  const handleGenerateQrCode = async () => {
    setFeedback(null);
    setLoadingQr(true);
    onUpdateConfig({ ...config, status: "connecting" });
    const res = await fetchEvolutionQrCode(config);
    if (!res.ok) {
      setFeedback({
        type: "error",
        message:
          res.error || "Não foi possível obter o QR Code da Evolution API v2.3.",
      });
      onUpdateConfig({ ...config, status: "disconnected" });
    } else {
      setQrPayload({
        pairingCode: res.pairingCode,
        code: res.code,
        base64: res.base64,
        endpoint: res.endpoint,
      });
      if (!res.simulated) {
        setFeedback({
          type: "success",
          message:
            "QR Code gerado na Evolution API v2.3! Escaneie com seu WhatsApp e clique em 'Verificar Status'.",
        });
      }
    }
    setLoadingQr(false);
  };

  const handleCheckStatus = async () => {
    setFeedback(null);
    setCheckingStatus(true);
    const res = await checkEvolutionStatus(config);
    setCheckingStatus(false);

    if (!res.ok) {
      setFeedback({
        type: "error",
        message:
          res.error || "Erro ao consultar connectionState na Evolution API v2.3.",
      });
      return;
    }

    onUpdateConfig({
      ...config,
      status: res.state,
      phoneConnected:
        res.state === "connected"
          ? `Instância ${config.instanceName} (Online)`
          : undefined,
    });
    setFeedback({
      type: "success",
      message:
        res.state === "connected"
          ? "Instância conectada (state: open) na Evolution API v2.3!"
          : `Estado atual na Evolution API v2.3: ${res.state}`,
    });
  };

  const handleApplyWebhookToEvolution = async () => {
    setFeedback(null);
    setSavingWebhook(true);
    const res = await configureEvolutionWebhook(config);
    setSavingWebhook(false);

    if (!res.ok) {
      setFeedback({
        type: "error",
        message: res.error || "Falha ao registrar webhook na Evolution API v2.3.",
      });
      return;
    }

    setFeedback({
      type: "success",
      message: "Webhook MESSAGES_UPSERT configurado na Evolution API v2.3!",
    });
  };

  const handleToggleConnection = async () => {
    setFeedback(null);
    if (config.status === "connected") {
      if (isRealServer) {
        await logoutEvolutionInstance(config);
      }
      onUpdateConfig({ ...config, status: "disconnected", phoneConnected: undefined });
    } else {
      if (isRealServer) {
        await handleCheckStatus();
      } else {
        onUpdateConfig({
          ...config,
          status: "connected",
          phoneConnected: "+55 11 99400-8811 (Comercial Matriz)",
        });
      }
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(config.webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleTestWebhookEndpoint = async () => {
    try {
      const res = await fetch("/api/webhooks/evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "messages.upsert",
          instance: config.instanceName,
          data: {
            key: {
              remoteJid: "5511998124401@s.whatsapp.net",
              fromMe: false,
              id: "PING_TEST_001",
            },
            message: {
              conversation:
                "Ping de teste de Webhook da Evolution API para o Nexus CRM!",
            },
          },
        }),
      });
      const data = await res.json();
      setWebhookTestResult(JSON.stringify(data, null, 2));
    } catch {
      setWebhookTestResult("Erro ao testar rota local.");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Status Banner */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 drop-shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              config.status === "connected"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
            }`}
          >
            {config.status === "connected" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Instância WhatsApp: {config.instanceName}
              </h2>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  config.status === "connected"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                }`}
              >
                {config.status === "connected"
                  ? "CONECTADO • ONLINE"
                  : config.status === "connecting"
                  ? "AGUARDANDO LEITURA QR CODE..."
                  : "DESCONECTADO"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {config.status === "connected"
                ? `Número pareado: ${
                    config.phoneConnected || "+55 11 99400-8811"
                  } • Sincronização automática de mensagens e leads ativa`
                : "Escaneie o QR Code ao lado com seu aplicativo WhatsApp para parear a Evolution API"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <Activity
              className={`w-3.5 h-3.5 text-indigo-500 ${
                checkingStatus ? "animate-pulse" : ""
              }`}
            />
            Verificar Status
          </button>

          <button
            onClick={handleGenerateQrCode}
            disabled={loadingQr}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingQr ? "animate-spin" : ""}`}
            />
            Gerar QR Code
          </button>

          <button
            onClick={handleToggleConnection}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all ${
              config.status === "connected"
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {config.status === "connected"
              ? "Desconectar Instância"
              : isRealServer
              ? "Confirmar Conexão"
              : "Simular Leitura do QR Code"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs flex items-center gap-2.5 ${
            feedback.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Credentials & Webhook Left | QR Code Connect Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Modo Empresa (apenas instância) OU Credenciais Master */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 drop-shadow-sm space-y-5"
        >
          {companyOnly ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Instância WhatsApp Exclusiva da Empresa
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Conecte o WhatsApp da sua empresa escaneando o QR Code ao lado.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Gerenciada pelo Master
                </span>
              </div>

              {!config.managedByMaster && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Servidor Evolution API ainda não configurado</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      O Master da plataforma ainda não configurou o servidor da Evolution API. Solicite ao Master para liberar a geração de QR Code.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Identificador da Instância
                  </span>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {config.instanceName || "Instância automática"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Esta instância é exclusiva da sua empresa. Todas as conversas recebidas e enviadas por este número ficam isoladas no seu workspace.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-500" />
                  Como conectar o WhatsApp da empresa:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                  <li>Clique no botão <strong>Gerar QR Code</strong> no topo desta página.</li>
                  <li>Abra o WhatsApp no celular da empresa e acesse <strong>Dispositivos conectados</strong>.</li>
                  <li>Toque em <strong>Conectar dispositivo</strong> e aponte a câmera para o QR Code ao lado.</li>
                  <li>Após escanear, clique em <strong>Verificar Status</strong> para confirmar que ficou online.</li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-500" />
                    Parâmetros do Servidor Evolution API
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Configure os endpoints REST utilizados pelo módulo de chat 360º
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  v2.3.x Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    URL Base da Evolution API
                  </label>
                  <input
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, baseUrl: e.target.value })
                    }
                    placeholder="https://api.sua-evolution-api.com.br"
                    className="w-full rounded-xl px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Nome da Instância (instanceName)
                  </label>
                  <input
                    type="text"
                    value={config.instanceName}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, instanceName: e.target.value })
                    }
                    className="w-full rounded-xl px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    Global / Instance API Key
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, apiKey: e.target.value })
                    }
                    className="w-full rounded-xl px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5 text-emerald-500" />
                    Endpoint local de Webhook (Recebimento em Tempo Real)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={config.webhookUrl}
                      className="flex-1 rounded-xl px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5"
                    >
                      {copiedWebhook ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyWebhookToEvolution}
                      disabled={savingWebhook || !isRealServer}
                      title="Enviar configuração de Webhook automaticamente para a Evolution API v2.3"
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      {savingWebhook ? "Aplicando..." : "Aplicar na Evolution"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Endpoints Documentation & Live Test */}
              <div className="p-4 rounded-xl bg-zinc-950 text-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-emerald-400">
                    <Terminal className="w-4 h-4" />
                    Rotas Mapeadas no CRM
                  </span>
                  <button
                    type="button"
                    onClick={handleTestWebhookEndpoint}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-semibold text-white flex items-center gap-1"
                  >
                    <Radio className="w-3 h-3" />
                    Disparar Webhook Teste
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-900">
                    <span className="text-emerald-400">POST</span>
                    <span className="text-zinc-300 truncate max-w-[360px]">
                      {config.baseUrl}/message/sendText/{config.instanceName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-900">
                    <span className="text-sky-400">GET</span>
                    <span className="text-zinc-300 truncate max-w-[360px]">
                      {config.baseUrl}/instance/connect/{config.instanceName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-900">
                    <span className="text-violet-400">WEBHOOK</span>
                    <span className="text-zinc-300 truncate max-w-[360px]">
                      POST /api/webhooks/evolution (messages.upsert)
                    </span>
                  </div>
                </div>

                {webhookTestResult && (
                  <pre className="p-2.5 rounded-lg bg-black/60 text-[10px] text-emerald-300 overflow-x-auto">
                    {webhookTestResult}
                  </pre>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Right Column: QR Code Viewer (GET /instance/connect) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 drop-shadow-sm flex flex-col items-center justify-between text-center"
        >
          <div className="w-full flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="text-left">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-500" />
                QR Code da Evolution API
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Retorno de GET /instance/connect/{config.instanceName}
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Pairing: {qrPayload.pairingCode}
            </span>
          </div>

          {/* Real base64 QR Code (Evolution API v2.3) or Simulated SVG Fallback */}
          <div className="my-6 relative p-5 rounded-2xl bg-white border-2 border-zinc-200 shadow-inner">
            {qrPayload.base64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  qrPayload.base64.startsWith("data:")
                    ? qrPayload.base64
                    : `data:image/png;base64,${qrPayload.base64}`
                }
                alt="QR Code Evolution API v2.3"
                className={`w-52 h-52 object-contain ${
                  loadingQr ? "opacity-30 blur-sm" : "opacity-100"
                } transition-all`}
              />
            ) : (
            <svg
              viewBox="0 0 210 210"
              className={`w-52 h-52 ${
                loadingQr ? "opacity-30 blur-sm" : "opacity-100"
              } transition-all`}
            >
              {/* Finder Patterns */}
              <rect x="10" y="10" width="50" height="50" fill="none" stroke="#18181b" strokeWidth="8" />
              <rect x="24" y="24" width="22" height="22" fill="#18181b" />

              <rect x="150" y="10" width="50" height="50" fill="none" stroke="#18181b" strokeWidth="8" />
              <rect x="164" y="24" width="22" height="22" fill="#18181b" />

              <rect x="10" y="150" width="50" height="50" fill="none" stroke="#18181b" strokeWidth="8" />
              <rect x="24" y="164" width="22" height="22" fill="#18181b" />

              {/* Data Matrix Modules */}
              <g fill="#18181b">
                <rect x="75" y="12" width="10" height="10" />
                <rect x="95" y="12" width="20" height="10" />
                <rect x="125" y="12" width="10" height="20" />
                <rect x="75" y="32" width="15" height="10" />
                <rect x="105" y="32" width="10" height="15" />
                <rect x="75" y="52" width="25" height="10" />
                <rect x="115" y="52" width="20" height="10" />

                <rect x="12" y="75" width="20" height="10" />
                <rect x="42" y="75" width="15" height="15" />
                <rect x="12" y="95" width="10" height="25" />
                <rect x="32" y="105" width="25" height="10" />
                <rect x="12" y="130" width="35" height="10" />

                <rect x="75" y="75" width="15" height="15" />
                <rect x="125" y="75" width="15" height="15" />
                <rect x="75" y="120" width="15" height="15" />
                <rect x="115" y="120" width="25" height="12" />

                <rect x="150" y="75" width="20" height="10" />
                <rect x="180" y="75" width="20" height="20" />
                <rect x="150" y="95" width="15" height="25" />
                <rect x="175" y="110" width="25" height="10" />
                <rect x="150" y="135" width="30" height="10" />

                <rect x="75" y="150" width="20" height="12" />
                <rect x="105" y="150" width="12" height="25" />
                <rect x="130" y="155" width="25" height="10" />
                <rect x="165" y="150" width="35" height="12" />
                <rect x="75" y="175" width="20" height="25" />
                <rect x="125" y="175" width="30" height="12" />
                <rect x="165" y="175" width="20" height="25" />
                <rect x="105" y="188" width="45" height="12" />
              </g>

              {/* Center Badge */}
              <rect x="85" y="85" width="40" height="40" rx="10" fill="#10b981" />
              <circle cx="105" cy="105" r="10" fill="#ffffff" />
            </svg>
            )}

            {config.status === "connected" && (
              <div className="absolute inset-0 rounded-2xl bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white">
                <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2" />
                <p className="text-sm font-bold">Sessão WhatsApp Ativa</p>
                <p className="text-[11px] text-emerald-200 mt-1">
                  Instância conectada e sincronizando mensagens com o Kanban.
                </p>
              </div>
            )}
          </div>

          <div className="w-full space-y-2 text-left bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
            <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              Como conectar sua instância:
            </p>
            <ol className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 list-decimal list-inside">
              <li>Abra o WhatsApp no celular comercial</li>
              <li>
                Toque em <strong>Aparelhos Conectados</strong> &gt; Conectar um
                aparelho
              </li>
              <li>
                Aponte a câmera para o QR Code gerado por{" "}
                <code>GET /instance/connect</code>
              </li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
