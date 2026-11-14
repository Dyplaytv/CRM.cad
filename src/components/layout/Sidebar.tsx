"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Kanban,
  Users2,
  PlugZap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  Command,
  ShieldCheck,
} from "lucide-react";

export type NavTab = "dashboard" | "pipeline" | "contacts" | "integrations";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  onNewDeal: () => void;
  onOpenCommand: () => void;
  evolutionStatus: "connected" | "disconnected" | "connecting";
  dealsCount: number;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  onNewDeal,
  onOpenCommand,
  evolutionStatus,
  dealsCount,
}: SidebarProps) {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "pipeline",
      label: "Pipeline Kanban",
      icon: Kanban,
      badge: dealsCount,
    },
    {
      id: "contacts",
      label: "Carteira 360º",
      icon: Users2,
    },
    {
      id: "integrations",
      label: "Evolution API",
      icon: PlugZap,
      badge: evolutionStatus === "connected" ? "ON" : "OFF",
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="relative z-30 hidden md:flex flex-col h-screen shrink-0 select-none border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-sm text-zinc-900 dark:text-zinc-100">
                  Nexus CRM
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  PRO
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                Revenue Intelligence
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Primary Action */}
      <div className="p-3 space-y-2">
        <button
          onClick={onNewDeal}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-medium text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.99] ${
            collapsed ? "px-0" : ""
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Novo Negócio</span>}
        </button>

        {!collapsed && (
          <button
            onClick={onOpenCommand}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-900/70 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-zinc-400" />
              Busca rápida...
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {!collapsed && (
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Módulos de Vendas
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    item.id === "integrations"
                      ? evolutionStatus === "connected"
                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      : isActive
                      ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                      : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Evolution API Live Status Card */}
      <div className="p-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
        {collapsed ? (
          <button
            onClick={() => setActiveTab("integrations")}
            className="w-full flex items-center justify-center py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900"
            title="Status Evolution API"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                evolutionStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            />
          </button>
        ) : (
          <div
            onClick={() => setActiveTab("integrations")}
            className="cursor-pointer p-3 rounded-xl bg-gradient-to-br from-zinc-100/90 to-zinc-50/90 dark:from-zinc-900/90 dark:to-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-500/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Evolution API v2
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    evolutionStatus === "connected"
                      ? "bg-emerald-500 animate-ping"
                      : "bg-amber-500"
                  }`}
                />
                {evolutionStatus === "connected" ? "Conectado" : "Pendente"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Webhooks em tempo real ativos para o funil de vendas.
            </p>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
