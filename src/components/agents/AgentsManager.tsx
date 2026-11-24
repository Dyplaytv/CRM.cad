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
  Pencil,
  Power,
  X,
} from "lucide-react";
import {
  AgentAccount,
  CompanyAutomationConfig,
  Deal,
  FirstContactConfig,
  FirstContactMode,
  VirtualAgentConfig,
  VirtualAgentProfile,
} from "@/types/crm";

interface AgentsManagerProps {
  agents: AgentAccount[];
  deals: Deal[];
  automation: CompanyAutomationConfig;
  onSaveAutomation: (input: {
    virtualAgent?: Partial<VirtualAgentConfig>;
    virtualAgents?: VirtualAgentProfile[];
    firstContact?: Partial<FirstContactConfig>;
  }) => Promise<{ ok: boolean; error?: string }>;
  onCreateAgent: (input: {
    name: string;
    username: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onDeleteAgent: (id: string) => Promise<void>;
}

const EMPTY_AI_FORM = {
  name: "",
  specialty: "",
  model: "gpt-4o-mini",
  personality: "",
  knowledgeBase: "",
};

export function AgentsManager({
  agents,
  deals,
  automation,
  onSaveAutomation,
  onCreateAgent,
  onDeleteAgent,
}: AgentsManagerProps) {
  const [createTab, setCreateTab] = useState<"human" | "ai">("human");

  // Form Humano
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Novo Atendente IA
  const [newAi, setNewAi] = useState(EMPTY_AI_FORM);
  const [aiCreateSaving, setAiCreateSaving] = useState(false);
  const [aiCreateMsg, setAiCreateMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Edição de Atendente IA existente
  const [editingAiId, setEditingAiId] = useState<string | null>(null);
  const [editAiForm, setEditAiForm] = useState(EMPTY_AI_FORM);
  const [editAiSaving, setEditAiSaving] = useState(false);

  // Conexão OpenAI da Empresa
  const [openAiKey, setOpenAiKey] = useState(
    automation.virtualAgent.openAiApiKey || ""
  );
  const [showAiKey, setShowAiKey] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [keyMsg, setKeyMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Primeiro Atendimento
  const [firstMode, setFirstMode] = useState<FirstContactMode>(
    automation.firstContact.mode
  );
  const [specificAgentId, setSpecificAgentId] = useState<string>(
    automation.firstContact.specificAgentId || ""
  );
  const [fcSaving, setFcSaving] = useState(false);
  const [fcMsg, setFcMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const virtualAgents = automation.virtualAgents || [];

  useEffect(() => {
    setFirstMode(automation.firstContact.mode);
    setSpecificAgentId(automation.firstContact.specificAgentId || "");
    setOpenAiKey(automation.virtualAgent.openAiApiKey || "");
  }, [automation]);

  const handleSubmitHuman = async (e: React.FormEvent) => {
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

  const handleCreateAiAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiCreateMsg(null);
    if (!newAi.name.trim()) {
      setAiCreateMsg({ type: "err", text: "Informe o nome do atendente IA." });
      return;
    }
    setAiCreateSaving(true);
    const created: VirtualAgentProfile = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newAi.name.trim(),
      specialty: newAi.specialty.trim(),
      personality: newAi.personality.trim(),
      knowledgeBase: newAi.knowledgeBase.trim(),
      model: newAi.model || "gpt-4o-mini",
      active: true,
      initials: "IA",
      color: "from-violet-500 to-fuchsia-500",
      createdAt: new Date().toISOString(),
    };
    const res = await onSaveAutomation({
      virtualAgents: [...virtualAgents, created],
    });
    setAiCreateSaving(false);
    if (!res.ok) {
      setAiCreateMsg({
        type: "err",
        text: res.error || "Erro ao criar atendente IA.",
      });
      return;
    }
    setAiCreateMsg({
      type: "ok",
      text: `Atendente IA "${created.name}" adicionado à equipe!`,
    });
    setNewAi(EMPTY_AI_FORM);
  };

  const handleToggleAiActive = async (id: string) => {
    const next = virtualAgents.map((a) =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    await onSaveAutomation({ virtualAgents: next });
  };

  const handleDeleteAiAgent = async (id: string) => {
    const next = virtualAgents.filter((a) => a.id !== id);
    await onSaveAutomation({ virtualAgents: next });
  };

  const startEditAi = (ai: VirtualAgentProfile) => {
    setEditingAiId(ai.id);
    setEditAiForm({
      name: ai.name,
      specialty: ai.specialty || "",
      model: ai.model || "gpt-4o-mini",
      personality: ai.personality || "",
      knowledgeBase: ai.knowledgeBase || "",
    });
  };

  const handleSaveEditAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAiId) return;
    setEditAiSaving(true);
    const next = virtualAgents.map((a) =>
      a.id === editingAiId
        ? {
            ...a,
            name: editAiForm.name.trim() || a.name,
            specialty: editAiForm.specialty.trim(),
            model: editAiForm.model || "gpt-4o-mini",
            personality: editAiForm.personality.trim(),
            knowledgeBase: editAiForm.knowledgeBase.trim(),
          }
        : a
    );
    const res = await onSaveAutomation({ virtualAgents: next });
    setEditAiSaving(false);
    if (res.ok) {
      setEditingAiId(null);
    }
  };

  const handleSaveOpenAiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyMsg(null);
    setKeySaving(true);
    const res = await onSaveAutomation({
      virtualAgent: { openAiApiKey: openAiKey.trim() },
    });
    setKeySaving(false);
    setKeyMsg(
      res.ok
        ? { type: "ok", text: "Chave OpenAI salva com sucesso!" }
        : { type: "err", text: res.error || "Erro ao salvar chave." }
    );
  };

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

  const totalTeamCount = agents.length + virtualAgents.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Formulário de Cadastro: Humano ou IA */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                createTab === "ai"
                  ? "bg-violet-500/10 border-violet-500/20 text-violet-500"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
              }`}
            >
              {createTab === "ai" ? (
                <Bot className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {createTab === "ai"
                  ? "Criar Atendente Virtual (IA)"
                  : "Adicionar Novo Atendente Humano"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {createTab === "ai"
                  ? "Crie múltiplos atendentes de IA com personalidades, habilidades e bases de conhecimento diferentes."
                  : "O atendente acessa com seu login e senha e visualiza apenas os atendimentos atribuídos a ele."}
              </p>
            </div>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCreateTab("human")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                createTab === "human"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Humano
            </button>
            <button
              type="button"
              onClick={() => setCreateTab("ai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                createTab === "ai"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Atendente IA
            </button>
          </div>
        </div>

        {createTab === "human" ? (
          <form
            onSubmit={handleSubmitHuman}
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
        ) : !automation.aiAllowedByMaster ? (
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                Atendentes Virtuais (IA) bloqueados para esta empresa
              </p>
              <p className="text-[11px] mt-0.5">
                Solicite ao administrador Master da plataforma para liberar o módulo de IA para esta empresa.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAiAgent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Nome do Atendente IA *
                </label>
                <input
                  type="text"
                  required
                  value={newAi.name}
                  onChange={(e) =>
                    setNewAi((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Josefina (Recepção)"
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Especialidade / Habilidade
                </label>
                <input
                  type="text"
                  value={newAi.specialty}
                  onChange={(e) =>
                    setNewAi((p) => ({ ...p, specialty: e.target.value }))
                  }
                  placeholder="Ex: Vendas, Suporte N1, Triagem"
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Modelo OpenAI
                </label>
                <select
                  value={newAi.model}
                  onChange={(e) =>
                    setNewAi((p) => ({ ...p, model: e.target.value }))
                  }
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Rápido e econômico)</option>
                  <option value="gpt-4o">gpt-4o (Alta inteligência)</option>
                  <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Personalidade e Tom de Voz
              </label>
              <input
                type="text"
                value={newAi.personality}
                onChange={(e) =>
                  setNewAi((p) => ({ ...p, personality: e.target.value }))
                }
                placeholder="Ex: Amigável, proativa, usa listas claras e emojis moderados, focada em agendar reunião."
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                Base de Conhecimento & Habilidades deste Atendente IA
              </label>
              <textarea
                rows={4}
                value={newAi.knowledgeBase}
                onChange={(e) =>
                  setNewAi((p) => ({ ...p, knowledgeBase: e.target.value }))
                }
                placeholder="Produtos, preços, regras de negócio, scripts de qualificação ou instruções técnicas específicas deste atendente..."
                className="w-full rounded-xl p-3.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500 leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {aiCreateMsg && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${
                      aiCreateMsg.type === "err"
                        ? "text-rose-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {aiCreateMsg.type === "err" ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    {aiCreateMsg.text}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={aiCreateSaving}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Bot className="w-4 h-4" />
                {aiCreateSaving ? "Criando..." : "Criar Atendente IA"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Equipe Unificada: Atendentes Humanos + Atendentes de IA */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Equipe de Atendentes ({totalTeamCount})
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold">
              {agents.length} humano(s)
            </span>
            {automation.aiAllowedByMaster && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 font-semibold">
                {virtualAgents.length} IA(s)
              </span>
            )}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Transfira conversas pelo Kanban ou Visão 360º
          </span>
        </div>

        {totalTeamCount === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 py-10 text-center">
            <UserCheck className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Nenhum atendente cadastrado ainda.
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Use o formulário acima para criar um atendente humano ou um atendente de IA.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Atendentes de IA juntos na equipe */}
            {automation.aiAllowedByMaster &&
              virtualAgents.map((ai) => {
                const assignedCount = deals.filter(
                  (d) => d.seller?.id === ai.id
                ).length;

                if (editingAiId === ai.id) {
                  return (
                    <form
                      key={ai.id}
                      onSubmit={handleSaveEditAi}
                      className="md:col-span-2 p-4 rounded-xl border border-violet-500/40 bg-violet-500/5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                          <Bot className="w-4 h-4" />
                          Editando Atendente IA
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingAiId(null)}
                          className="p-1 text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          value={editAiForm.name}
                          onChange={(e) =>
                            setEditAiForm((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="Nome do Atendente IA"
                          className="rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                        />
                        <input
                          type="text"
                          value={editAiForm.specialty}
                          onChange={(e) =>
                            setEditAiForm((p) => ({
                              ...p,
                              specialty: e.target.value,
                            }))
                          }
                          placeholder="Especialidade / Habilidade"
                          className="rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                        />
                        <select
                          value={editAiForm.model}
                          onChange={(e) =>
                            setEditAiForm((p) => ({
                              ...p,
                              model: e.target.value,
                            }))
                          }
                          className="rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                        >
                          <option value="gpt-4o-mini">gpt-4o-mini</option>
                          <option value="gpt-4o">gpt-4o</option>
                          <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        value={editAiForm.personality}
                        onChange={(e) =>
                          setEditAiForm((p) => ({
                            ...p,
                            personality: e.target.value,
                          }))
                        }
                        placeholder="Personalidade e tom de voz..."
                        className="w-full rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                      />

                      <textarea
                        rows={4}
                        value={editAiForm.knowledgeBase}
                        onChange={(e) =>
                          setEditAiForm((p) => ({
                            ...p,
                            knowledgeBase: e.target.value,
                          }))
                        }
                        placeholder="Base de conhecimento..."
                        className="w-full rounded-lg p-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingAiId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={editAiSaving}
                          className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {editAiSaving ? "Salvando..." : "Salvar IA"}
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={ai.id}
                    className="p-4 rounded-xl border border-violet-500/25 bg-violet-500/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${ai.color} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                      >
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {ai.name}
                          </p>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-400">
                            IA
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              ai.active
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-zinc-500/15 text-zinc-500"
                            }`}
                          >
                            {ai.active ? "Ativo" : "Pausado"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {ai.specialty || "Atendimento Geral"} • {ai.model}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                          {assignedCount} atendimento(s) atribuído(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditAi(ai)}
                        title="Editar personalidade e base de conhecimento"
                        className="p-2 rounded-lg text-zinc-400 hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAiActive(ai.id)}
                        title={ai.active ? "Pausar IA" : "Ativar IA"}
                        className={`p-2 rounded-lg transition-colors ${
                          ai.active
                            ? "text-emerald-500 hover:bg-emerald-500/10"
                            : "text-zinc-400 hover:bg-zinc-500/10"
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAiAgent(ai.id)}
                        title="Excluir atendente IA"
                        className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Atendentes Humanos */}
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

      {/* Conexão OpenAI da Empresa (compartilhada entre os Atendentes IA) */}
      {automation.aiAllowedByMaster && (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Conexão OpenAI da Empresa
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Chave de API compartilhada por todos os seus Atendentes Virtuais (IA).
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                openAiKey.trim()
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}
            >
              {openAiKey.trim() ? "API Conectada" : "Chave Pendente"}
            </span>
          </div>

          <form
            onSubmit={handleSaveOpenAiKey}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="relative flex-1 min-w-[240px]">
              <input
                type={showAiKey ? "text" : "password"}
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                placeholder="Cole sua OpenAI API Key (sk-...)"
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
            <button
              type="submit"
              disabled={keySaving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              {keySaving ? "Salvando..." : "Salvar Chave OpenAI"}
            </button>
          </form>
          {keyMsg && (
            <p
              className={`text-xs flex items-center gap-1.5 mt-2.5 ${
                keyMsg.type === "err" ? "text-rose-500" : "text-emerald-500"
              }`}
            >
              {keyMsg.type === "err" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              {keyMsg.text}
            </p>
          )}
        </div>
      )}

      {/* Primeiro Atendimento: Distribuição Automática de Novos Leads */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm space-y-5">
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
              Direciona todos os novos leads diretamente para um atendente fixo (humano ou IA).
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
              {automation.aiAllowedByMaster &&
                virtualAgents
                  .filter((a) => a.active)
                  .map((ai) => (
                    <option key={ai.id} value={ai.id}>
                      🤖 {ai.name} {ai.specialty ? `(${ai.specialty})` : "(IA)"}
                    </option>
                  ))}
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
    </div>
  );
}
