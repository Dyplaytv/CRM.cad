"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Users,
  Trash2,
  KeyRound,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Bot,
  Sparkles,
  RefreshCw,
  Shield,
  BookOpen,
  Lock,
  Check,
} from "lucide-react";
import {
  AgentAccount,
  CompanyAutomationConfig,
  Deal,
  FirstContactConfig,
  FirstContactMode,
  VirtualAgentConfig,
} from "@/types/crm";

interface AgentsManagerProps {
  agents: AgentAccount[];
  deals: Deal[];
  automation: CompanyAutomationConfig;
  onSaveAutomation: (input: {
    virtualAgent?: Partial<VirtualAgentConfig>;
    firstContact?: Partial<FirstContactConfig>;
  }) => Promise<{ ok: boolean; error?: string }>;
  onCreateAgent: (input: {
    name: string;
    username: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onDeleteAgent: (id: string) => Promise<void>;
}

export function AgentsManager({
  agents,
  deals,
  automation,
  onSaveAutomation,
  onCreateAgent,
  onDeleteAgent,
}: AgentsManagerProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [firstMode, setFirstMode] = useState<FirstContactMode>(
    automation.firstContact.mode
  );
  const [specificAgentId, setSpecificAgentId] = useState<string>(
    automation.firstContact.specificAgentId || ""
  );
  const [fcSaving, setFcSaving] = useState(false);
  const [fcMsg, setFcMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const [aiForm, setAiForm] = useState<VirtualAgentConfig>(
    automation.virtualAgent
  );
  const [showAiKey, setShowAiKey] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiMsg, setAiMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  useEffect(() => {
    setFirstMode(automation.firstContact.mode);
    setSpecificAgentId(automation.firstContact.specificAgentId || "");
    setAiForm(automation.virtualAgent);
  }, [automation]);

  const handleSaveFirstContact = async () => {
    setFcMsg(null);
    setFcSaving(true);
    const res = await onSaveAutomation({
      firstContact: {
        mode: firstMode,
        specificAgentId:
          firstMode === "specific_agent" ? specificAgentId : "",
      },
    });
    setFcSaving(false);
    setFcMsg(
      res.ok
        ? { type: "ok", text: "Regra de primeiro atendimento salva!" }
        : { type: "err", text: res.error || "Erro ao salvar regra." }
    );
  };

  const handleSaveVirtualAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiMsg(null);
    setAiSaving(true);
    const res = await onSaveAutomation({ virtualAgent: aiForm });
    setAiSaving(false);
    setAiMsg(
      res.ok
        ? {
            type: "ok",
            text: "Atendente Virtual (IA) e base de conhecimento salvos!",
          }
        : { type: "err", text: res.error || "Erro ao salvar Atendente Virtual." }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await onCreateAgent({ name, username, password });
      if (!res.ok) {
        setError(res.error || "Não foi possível criar o atendente.");
        return;
      }
      setSuccessMsg(`Atendente "${name.trim()}" criado com sucesso!`);
      setName("");
      setUsername("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Formulário de Cadastro */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Adicionar Novo Atendente
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              O atendente acessa com seu login e senha e visualiza apenas o
              Kanban e Carteira 360º com os atendimentos atribuídos a ele.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Nome completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Login (usuário)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: maria.atendente"
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Senha de acesso
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full rounded-xl pl-3.5 pr-9 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex-1 min-w-[200px]">
              {error && (
                <p className="text-xs text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}
              {successMsg && (
                <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {successMsg}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? "Salvando..." : "Adicionar Atendente"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Atendentes */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Equipe de Atendentes ({agents.length})
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Transfira conversas diretamente pelo Kanban ou na Visão 360º
          </span>
        </div>

        {agents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 py-10 text-center">
            <UserCheck className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Nenhum atendente cadastrado ainda.
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Use o formulário acima para criar o login e senha do primeiro
              atendente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((agent) => {
              const assignedCount = deals.filter(
                (d) => d.seller?.id === agent.id
              ).length;
              return (
                <div
                  key={agent.id}
                  className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${agent.color} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                    >
                      {agent.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {agent.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate">
                        <KeyRound className="w-3 h-3 shrink-0 text-indigo-500" />
                        Login: <span className="font-mono">{agent.username}</span>
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                        {assignedCount} atendimento(s) atribuído(s)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteAgent(agent.id)}
                    title="Remover atendente"
                    className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Primeiro Atendimento: Distribuição Automática de Novos Leads */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Primeiro Atendimento (Distribuição de Leads)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Defina quem recebe automaticamente os novos contatos que chegarem pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFirstMode("manager")}
            className={`text-left p-4 rounded-xl border transition-all ${
              firstMode === "manager"
                ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-500" />
                Gerente (Padrão)
              </span>
              {firstMode === "manager" && (
                <Check className="w-4 h-4 text-indigo-500" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Todos os novos atendimentos chegam primeiro para o Gerente distribuir.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFirstMode("specific_agent")}
            className={`text-left p-4 rounded-xl border transition-all ${
              firstMode === "specific_agent"
                ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-500" />
                Atendente Específico
              </span>
              {firstMode === "specific_agent" && (
                <Check className="w-4 h-4 text-indigo-500" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Direciona todos os novos leads diretamente para um atendente fixo (ou IA).
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFirstMode("round_robin")}
            className={`text-left p-4 rounded-xl border transition-all ${
              firstMode === "round_robin"
                ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Distribuição Inteligente (Rodízio)
              </span>
              {firstMode === "round_robin" && (
                <Check className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Repassa cada novo atendimento automaticamente em sequência entre os atendentes.
            </p>
          </button>
        </div>

        {firstMode === "specific_agent" && (
          <div className="max-w-md">
            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Selecione o atendente de primeiro contato
            </label>
            <select
              value={specificAgentId}
              onChange={(e) => setSpecificAgentId(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Selecione um atendente --</option>
              {automation.aiAllowedByMaster && aiForm.enabled && (
                <option value="ai-virtual">
                  🤖 {aiForm.name || "Assistente Virtual (IA)"}
                </option>
              )}
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (@{a.username})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div>
            {fcMsg && (
              <p
                className={`text-xs flex items-center gap-1.5 ${
                  fcMsg.type === "err" ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {fcMsg.type === "err" ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                {fcMsg.text}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveFirstContact}
            disabled={fcSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            {fcSaving ? "Salvando..." : "Salvar Primeiro Atendimento"}
          </button>
        </div>
      </div>

      {/* Atendente Virtual (IA - OpenAI & Base de Conhecimento) */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Atendente Virtual (IA • OpenAI)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Conecte sua API da OpenAI, edite a base de conhecimento e ative a IA em conversas específicas pelo Kanban ou Visão 360º.
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              !automation.aiAllowedByMaster
                ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                : aiForm.enabled
                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            {!automation.aiAllowedByMaster
              ? "Não liberado pelo Master"
              : aiForm.enabled
              ? "Ativo para Conversas"
              : "Desativado"}
          </span>
        </div>

        {!automation.aiAllowedByMaster ? (
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                Atendente Virtual bloqueado para esta empresa
              </p>
              <p className="text-[11px] mt-0.5">
                O administrador Master da plataforma precisa liberar o módulo de Atendente Virtual (IA) para que sua empresa possa conectar a OpenAI e editar a base de conhecimento.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveVirtualAgent} className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Habilitar Atendente Virtual na lista de atendentes
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Quando ativo, você poderá transferir qualquer conversa para a IA responder automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAiForm((p) => ({ ...p, enabled: !p.enabled }))
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  aiForm.enabled
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {aiForm.enabled ? "Ativado" : "Desativado"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Nome do Atendente Virtual
                </label>
                <input
                  type="text"
                  value={aiForm.name}
                  onChange={(e) =>
                    setAiForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Assistente Virtual (IA)"
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Modelo OpenAI
                </label>
                <select
                  value={aiForm.model}
                  onChange={(e) =>
                    setAiForm((p) => ({ ...p, model: e.target.value }))
                  }
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Rápido e econômico)</option>
                  <option value="gpt-4o">gpt-4o (Alta inteligência)</option>
                  <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  OpenAI API Key (sk-...)
                </label>
                <div className="relative">
                  <input
                    type={showAiKey ? "text" : "password"}
                    value={aiForm.openAiApiKey}
                    onChange={(e) =>
                      setAiForm((p) => ({ ...p, openAiApiKey: e.target.value }))
                    }
                    placeholder="sk-..."
                    className="w-full rounded-xl pl-3.5 pr-9 py-2.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAiKey(!showAiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showAiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                Base de Conhecimento da Empresa (Produtos, Preços, Horários e Regras)
              </label>
              <textarea
                rows={6}
                value={aiForm.knowledgeBase}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, knowledgeBase: e.target.value }))
                }
                placeholder="Descreva aqui tudo o que o Atendente Virtual deve saber para responder aos clientes: serviços, valores, horário de atendimento, formas de pagamento, endereço, tom de voz..."
                className="w-full rounded-xl p-3.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500 leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {aiMsg && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${
                      aiMsg.type === "err" ? "text-rose-500" : "text-emerald-500"
                    }`}
                  >
                    {aiMsg.type === "err" ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    {aiMsg.text}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={aiSaving}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Bot className="w-4 h-4" />
                {aiSaving ? "Salvando..." : "Salvar Atendente Virtual"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
