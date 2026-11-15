"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Menu,
  LogOut,
} from "lucide-react";
import { NavTab } from "./Sidebar";
import { AuthUser } from "@/types/crm";

interface TopbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onOpenCommand: () => void;
  onNewDeal: () => void;
  stagnantCount: number;
  user: AuthUser;
  onLogout: () => void;
}

export function Topbar({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onOpenCommand,
  onNewDeal,
  stagnantCount,
  user,
  onLogout,
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard:
      user.mode === "agent"
        ? {
            title: "Meu Dashboard de Atendimento",
            subtitle:
              "Resumo dos seus leads, métricas e próximas tarefas agendadas",
          }
        : {
            title: "Dashboard Executivo",
            subtitle: "Métricas em tempo real, forecast e prioridades do dia",
          },
    pipeline: {
      title: "Pipeline de Vendas",
      subtitle: "Arraste negócios entre etapas ou clique para abrir a Visão 360º",
    },
    contacts: {
      title: "Visão 360º de Contas",
      subtitle: "Base unificada de clientes, decisores e histórico omnichannel",
    },
    agents: {
      title: "Gestão de Atendentes",
      subtitle: "Cadastre logins e senhas e gerencie a equipe de atendimento",
    },
    integrations: {
      title: "Integrações & Evolution API",
      subtitle: "Gerencie instâncias WhatsApp, QR Code e Webhooks em tempo real",
    },
  };

  return (
    <header className="sticky top-0 z-20 h-16 px-4 lg:px-8 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl">
      {/* Left Title & Mobile Navigation */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => {
              if (user.mode === "agent") {
                setActiveTab(
                  activeTab === "dashboard"
                    ? "pipeline"
                    : activeTab === "pipeline"
                    ? "contacts"
                    : "dashboard"
                );
                return;
              }
              setActiveTab(
                activeTab === "dashboard"
                  ? "pipeline"
                  : activeTab === "pipeline"
                  ? "integrations"
                  : "dashboard"
              );
            }}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {tabTitles[activeTab].title}
          </h1>
          <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400">
            {tabTitles[activeTab].subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Global Search Command+K */}
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100/90 dark:bg-zinc-900/90 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 transition-all w-40 sm:w-64"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">Buscar cliente, CNPJ...</span>
          <kbd className="ml-auto hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            ⌘K
          </kbd>
        </button>

        {/* Quick Create Deal on Mobile */}
        <button
          onClick={onNewDeal}
          className="md:hidden p-2 rounded-xl bg-indigo-600 text-white"
          title="Novo Negócio"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          title={
            theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"
          }
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Central de Alertas
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                  Tempo Real
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {stagnantCount} negócios estagnados (&gt; 3 dias)
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Vortex FinTech e Solaris precisam de follow-up imediato.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors">
                  <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      Webhook Evolution API recebido
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Henrique (Vortex FinTech): &ldquo;Já validaram sim, ficou
                      ótimo...&rdquo;
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      Meta mensal atingiu 92%
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      R$ 394.000 em receita acumulada em Novembro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-semibold shadow-sm ${
              user.mode === "master"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500"
                : user.mode === "agent"
                ? "bg-gradient-to-tr from-sky-600 to-indigo-500"
                : "bg-gradient-to-tr from-indigo-600 to-violet-500"
            }`}
          >
            {user.initials}
          </div>
          <div className="hidden lg:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                {user.name}
              </p>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  user.mode === "master"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                    : user.mode === "agent"
                    ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                }`}
              >
                {user.mode === "master"
                  ? "MASTER"
                  : user.mode === "agent"
                  ? "ATENDENTE"
                  : "DEMO"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {user.role}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Sair / Trocar de conta"
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-rose-500 hover:border-rose-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
