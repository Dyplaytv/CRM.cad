"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Building2,
  UserPlus,
  Users,
  ShieldCheck,
  Briefcase,
  Trash2,
  Power,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  TrendingUp,
  Pencil,
  Check,
  X,
  Server,
  Globe,
  Webhook,
  Bot,
} from "lucide-react";
import {
  CompanyAccount,
  GlobalEvolutionServer,
  ManagerAccount,
} from "@/types/crm";

export interface MasterOverviewStats {
  totalCompanies: number;
  activeCompanies: number;
  totalManagers: number;
  totalAgents: number;
  totalDeals: number;
  totalPipelineValue: number;
  perCompany: Array<{
    companyId: string;
    managersCount: number;
    agentsCount: number;
    dealsCount: number;
    pipelineValue: number;
  }>;
}

interface MasterDashboardProps {
  companies: CompanyAccount[];
  managers: ManagerAccount[];
  stats: MasterOverviewStats;
  onCreateCompany: (input: {
    name: string;
    document?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onUpdateCompany: (
    id: string,
    input: { name: string; document?: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  onToggleCompany: (companyId: string) => Promise<void>;
  onToggleCompanyAi: (companyId: string) => Promise<void>;
  onDeleteCompany: (companyId: string) => Promise<void>;
  onCreateManager: (input: {
    companyId: string;
    name: string;
    username: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onUpdateManager: (
    id: string,
    input: {
      companyId: string;
      name: string;
      username: string;
      password?: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteManager: (managerId: string) => Promise<void>;
  evolutionServer: GlobalEvolutionServer;
  onSaveEvolutionServer: (
    srv: GlobalEvolutionServer
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function MasterDashboard({
  companies,
  managers,
  stats,
  onCreateCompany,
  onUpdateCompany,
  onToggleCompany,
  onToggleCompanyAi,
  onDeleteCompany,
  onCreateManager,
  onUpdateManager,
  onDeleteManager,
  evolutionServer,
  onSaveEvolutionServer,
}: MasterDashboardProps) {
  const [companyName, setCompanyName] = useState("");
  const [companyDoc, setCompanyDoc] = useState("");
  const [compLoading, setCompLoading] = useState(false);
  const [compMsg, setCompMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState(
    companies[0]?.id || "company-default"
  );
  const [mgrName, setMgrName] = useState("");
  const [mgrUsername, setMgrUsername] = useState("");
  const [mgrPassword, setMgrPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [mgrLoading, setMgrLoading] = useState(false);
  const [mgrMsg, setMgrMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: "",
    document: "",
  });
  const [editCompanyError, setEditCompanyError] = useState<string | null>(null);

  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  const [editManagerForm, setEditManagerForm] = useState({
    companyId: "",
    name: "",
    username: "",
    password: "",
  });
  const [editManagerError, setEditManagerError] = useState<string | null>(null);

  const [srvForm, setSrvForm] = useState<GlobalEvolutionServer>(evolutionServer);
  const [showApiKey, setShowApiKey] = useState(false);
  const [srvSaving, setSrvSaving] = useState(false);
  const [srvMsg, setSrvMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    setSrvForm({
      baseUrl: evolutionServer.baseUrl || "",
      apiKey: evolutionServer.apiKey || "",
      webhookUrl:
        evolutionServer.webhookUrl ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/api/webhooks/evolution`
          : ""),
    });
  }, [evolutionServer]);

  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    setSrvMsg(null);
    setSrvSaving(true);
    const res = await onSaveEvolutionServer(srvForm);
    setSrvSaving(false);
    if (!res.ok) {
      setSrvMsg({
        type: "err",
        text: res.error || "Não foi possível salvar o servidor.",
      });
    } else {
      setSrvMsg({
        type: "ok",
        text: "Configurações globais da Evolution API salvas com sucesso.",
      });
    }
  };

  const mgrNameInputRef = useRef<HTMLInputElement>(null);

  const startEditCompany = (company: CompanyAccount) => {
    setEditingCompanyId(company.id);
    setEditCompanyForm({
      name: company.name,
      document: company.document || "",
    });
    setEditCompanyError(null);
  };

  const handleSaveEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;
    setEditCompanyError(null);
    const res = await onUpdateCompany(editingCompanyId, editCompanyForm);
    if (!res.ok) {
      setEditCompanyError(res.error || "Erro ao atualizar empresa.");
      return;
    }
    setEditingCompanyId(null);
  };

  const startEditManager = (mgr: ManagerAccount) => {
    setEditingManagerId(mgr.id);
    setEditManagerForm({
      companyId: mgr.companyId,
      name: mgr.name,
      username: mgr.username,
      password: "",
    });
    setEditManagerError(null);
  };

  const handleSaveEditManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManagerId) return;
    setEditManagerError(null);
    const res = await onUpdateManager(editingManagerId, {
      ...editManagerForm,
      password: editManagerForm.password || undefined,
    });
    if (!res.ok) {
      setEditManagerError(res.error || "Erro ao atualizar gerente.");
      return;
    }
    setEditingManagerId(null);
  };

  const handleQuickAddManagerForCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setMgrMsg(null);
    mgrNameInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(() => mgrNameInputRef.current?.focus(), 250);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompMsg(null);
    setCompLoading(true);
    try {
      const res = await onCreateCompany({
        name: companyName,
        document: companyDoc,
      });
      if (!res.ok) {
        setCompMsg({
          type: "err",
          text: res.error || "Erro ao criar empresa.",
        });
        return;
      }
      setCompMsg({
        type: "ok",
        text: `Empresa "${companyName.trim()}" criada com sucesso!`,
      });
      setCompanyName("");
      setCompanyDoc("");
    } finally {
      setCompLoading(false);
    }
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setMgrMsg(null);
    setMgrLoading(true);
    try {
      const targetCompanyId = selectedCompanyId || companies[0]?.id || "";
      const res = await onCreateManager({
        companyId: targetCompanyId,
        name: mgrName,
        username: mgrUsername,
        password: mgrPassword,
      });
      if (!res.ok) {
        setMgrMsg({
          type: "err",
          text: res.error || "Erro ao criar gerente.",
        });
        return;
      }
      setMgrMsg({
        type: "ok",
        text: `Gerente "${mgrName.trim()}" criado com sucesso!`,
      });
      setMgrName("");
      setMgrUsername("");
      setMgrPassword("");
    } finally {
      setMgrLoading(false);
    }
  };

  const kpis = [
    {
      label: "Empresas na Plataforma",
      value: `${stats.totalCompanies}`,
      sub: `${stats.activeCompanies} ativa(s)`,
      icon: Building2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Gerentes Cadastrados",
      value: `${stats.totalManagers}`,
      sub: "Administradores de empresa",
      icon: ShieldCheck,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Atendentes Totais",
      value: `${stats.totalAgents}`,
      sub: "Usuários de atendimento",
      icon: Users,
      color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      label: "Leads / Pipeline Global",
      value: `${stats.totalDeals}`,
      sub: stats.totalPipelineValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
      icon: TrendingUp,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {kpi.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center ${kpi.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {kpi.value}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                {kpi.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Servidor Evolution API Global (Master) */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Servidor Evolution API v2.3 (Global)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Credenciais compartilhadas pela plataforma. As empresas geram apenas o QR Code de sua instância exclusiva.
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              srvForm.baseUrl && srvForm.apiKey
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            {srvForm.baseUrl && srvForm.apiKey
              ? "Servidor Configurado"
              : "Pendente de Configuração"}
          </span>
        </div>

        <form onSubmit={handleSaveEvolution} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              URL Base da Evolution API *
            </label>
            <input
              type="text"
              required
              value={srvForm.baseUrl}
              onChange={(e) =>
                setSrvForm((p) => ({ ...p, baseUrl: e.target.value }))
              }
              placeholder="http://seu-servidor:8095"
              className="w-full rounded-xl px-3.5 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              Global API Key *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                required
                value={srvForm.apiKey}
                onChange={(e) =>
                  setSrvForm((p) => ({ ...p, apiKey: e.target.value }))
                }
                placeholder="Sua Global API Key"
                className="w-full rounded-xl pl-3.5 pr-9 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Webhook className="w-3.5 h-3.5 text-emerald-500" />
              URL do Webhook do CRM
            </label>
            <input
              type="text"
              value={srvForm.webhookUrl}
              onChange={(e) =>
                setSrvForm((p) => ({ ...p, webhookUrl: e.target.value }))
              }
              placeholder="https://seu-crm.com.br/api/webhooks/evolution"
              className="w-full rounded-xl px-3.5 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-1">
            {srvMsg ? (
              <p
                className={`text-xs flex items-center gap-1.5 ${
                  srvMsg.type === "err" ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {srvMsg.type === "err" ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                {srvMsg.text}
              </p>
            ) : (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Cada nova empresa recebe uma instância exclusiva automaticamente.
              </span>
            )}

            <button
              type="submit"
              disabled={srvSaving}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              {srvSaving ? "Salvando..." : "Salvar Servidor Evolution"}
            </button>
          </div>
        </form>
      </div>

      {/* Forms: Nova Empresa + Novo Gerente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cadastrar Empresa */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Cadastrar Nova Empresa
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Cada empresa possui seu próprio funil, Evolution API e equipe.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddCompany} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: TechSolar Energia"
                className="w-full rounded-xl px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                CNPJ ou Segmento (opcional)
              </label>
              <input
                type="text"
                value={companyDoc}
                onChange={(e) => setCompanyDoc(e.target.value)}
                placeholder="Ex: 12.345.678/0001-90 • Energia"
                className="w-full rounded-xl px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {compMsg && (
              <p
                className={`text-xs flex items-center gap-1.5 ${
                  compMsg.type === "err" ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {compMsg.type === "err" ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                {compMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={compLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              {compLoading ? "Criando..." : "Adicionar Empresa"}
            </button>
          </form>
        </div>

        {/* Criar Usuário Gerente */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Criar Usuário Gerente para Empresa
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                O Gerente administra a empresa, conecta a Evolution API e cria
                atendentes.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddManager} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Empresa Vinculada
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                required
                className="w-full rounded-xl px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {!c.active ? "(Pausada)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Nome do Gerente
                </label>
                <input
                  ref={mgrNameInputRef}
                  type="text"
                  required
                  value={mgrName}
                  onChange={(e) => setMgrName(e.target.value)}
                  placeholder="Ex: Carlos Gerente"
                  className="w-full rounded-xl px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Login (usuário)
                </label>
                <input
                  type="text"
                  required
                  value={mgrUsername}
                  onChange={(e) => setMgrUsername(e.target.value)}
                  placeholder="Ex: carlos.gerente"
                  className="w-full rounded-xl px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={4}
                  value={mgrPassword}
                  onChange={(e) => setMgrPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full rounded-xl pl-3.5 pr-9 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {mgrMsg && (
              <p
                className={`text-xs flex items-center gap-1.5 ${
                  mgrMsg.type === "err" ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {mgrMsg.type === "err" ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                {mgrMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={mgrLoading || companies.length === 0}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {mgrLoading ? "Criando..." : "Criar Usuário Gerente"}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Empresas */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Empresas Cadastradas ({companies.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {companies.map((company) => {
            const cStats = stats.perCompany.find(
              (s) => s.companyId === company.id
            );
            const isEditing = editingCompanyId === company.id;

            if (isEditing) {
              return (
                <form
                  key={company.id}
                  onSubmit={handleSaveEditCompany}
                  className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-500/5 space-y-2.5"
                >
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      required
                      value={editCompanyForm.name}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                      CNPJ ou Segmento
                    </label>
                    <input
                      type="text"
                      value={editCompanyForm.document}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          document: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {editCompanyError && (
                    <p className="text-[11px] text-rose-500">
                      {editCompanyError}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingCompanyId(null)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Salvar
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={company.id}
                className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {company.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        company.active
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-zinc-500/15 text-zinc-500"
                      }`}
                    >
                      {company.active ? "Ativa" : "Pausada"}
                    </span>
                  </div>
                  {company.document && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {company.document}
                    </p>
                  )}
                  {company.instanceName && (
                    <p className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 mt-0.5 truncate">
                      Instância: {company.instanceName}
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                    {cStats?.managersCount || 0} gerente(s) •{" "}
                    {cStats?.agentsCount || 0} atendente(s) •{" "}
                    {cStats?.dealsCount || 0} lead(s)
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onToggleCompanyAi(company.id)}
                    title={
                      company.aiAssistantEnabled
                        ? "Bloquear Atendente Virtual (IA) para esta empresa"
                        : "Liberar Atendente Virtual (IA) para esta empresa"
                    }
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      company.aiAssistantEnabled
                        ? "bg-violet-500/15 hover:bg-violet-500/25 text-violet-600 dark:text-violet-400"
                        : "bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-500"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {company.aiAssistantEnabled ? "IA Liberada" : "IA Bloqueada"}
                    </span>
                  </button>
                  <button
                    onClick={() => handleQuickAddManagerForCompany(company.id)}
                    title="Criar gerente para esta empresa"
                    className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center gap-1 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Gerente</span>
                  </button>
                  <button
                    onClick={() => startEditCompany(company)}
                    title="Editar nome da empresa"
                    className="p-2 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleCompany(company.id)}
                    title={
                      company.active ? "Pausar empresa" : "Reativar empresa"
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      company.active
                        ? "text-emerald-500 hover:bg-emerald-500/10"
                        : "text-zinc-400 hover:bg-zinc-500/10"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  {company.id !== "company-default" && (
                    <button
                      onClick={() => onDeleteCompany(company.id)}
                      title="Excluir empresa"
                      className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Gerentes */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Gerentes Cadastrados ({managers.length})
          </h3>
        </div>

        {managers.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
            Nenhum gerente cadastrado ainda. Use o formulário acima para criar o
            primeiro gerente.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {managers.map((mgr) => {
              const isEditingMgr = editingManagerId === mgr.id;
              if (isEditingMgr) {
                return (
                  <form
                    key={mgr.id}
                    onSubmit={handleSaveEditManager}
                    className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-500/5 space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                          Nome
                        </label>
                        <input
                          type="text"
                          required
                          value={editManagerForm.name}
                          onChange={(e) =>
                            setEditManagerForm((p) => ({
                              ...p,
                              name: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                          Login
                        </label>
                        <input
                          type="text"
                          required
                          value={editManagerForm.username}
                          onChange={(e) =>
                            setEditManagerForm((p) => ({
                              ...p,
                              username: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                          Empresa
                        </label>
                        <select
                          value={editManagerForm.companyId}
                          onChange={(e) =>
                            setEditManagerForm((p) => ({
                              ...p,
                              companyId: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                        >
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                          Nova Senha (opcional)
                        </label>
                        <input
                          type="password"
                          value={editManagerForm.password}
                          onChange={(e) =>
                            setEditManagerForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Manter atual"
                          className="w-full rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    {editManagerError && (
                      <p className="text-[11px] text-rose-500">
                        {editManagerError}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingManagerId(null)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar
                      </button>
                    </div>
                  </form>
                );
              }

              return (
              <div
                key={mgr.id}
                className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mgr.color} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                  >
                    {mgr.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {mgr.name}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                      {mgr.companyName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate">
                      <KeyRound className="w-3 h-3 shrink-0" />
                      Login: <span className="font-mono">{mgr.username}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEditManager(mgr)}
                    title="Editar gerente"
                    className="p-2 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteManager(mgr.id)}
                    title="Remover gerente"
                    className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
