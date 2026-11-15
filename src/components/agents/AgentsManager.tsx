"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { AgentAccount, Deal } from "@/types/crm";

interface AgentsManagerProps {
  agents: AgentAccount[];
  deals: Deal[];
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
    </div>
  );
}
