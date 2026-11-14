"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Kanban,
  LayoutDashboard,
  PlugZap,
  Sparkles,
  Sun,
  Plus,
} from "lucide-react";
import { Deal } from "@/types/crm";
import { NavTab } from "./Sidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  onNavigate: (tab: NavTab) => void;
  onToggleTheme: () => void;
  onNewDeal: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  deals,
  onSelectDeal,
  onNavigate,
  onToggleTheme,
  onNewDeal,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredDeals = deals.filter(
    (d) =>
      d.company.toLowerCase().includes(query.toLowerCase()) ||
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.contactName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-xl rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200/70 dark:border-zinc-800">
              <Search className="w-4 h-4 text-indigo-500 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar negócios, contatos, CNPJ ou executar comandos..."
                className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                ESC
              </kbd>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 space-y-4">
              {/* Deals Section */}
              <div>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Negócios e Clientes ({filteredDeals.length})
                </p>
                <div className="mt-1 space-y-1">
                  {filteredDeals.slice(0, 5).map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => {
                        onSelectDeal(deal);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {deal.company} — {deal.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {deal.contactName} •{" "}
                          {deal.value.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                  {filteredDeals.length === 0 && (
                    <p className="px-3 py-4 text-xs text-zinc-500 text-center">
                      Nenhum negócio encontrado para &ldquo;{query}&rdquo;.
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Ações Rápidas
                </p>
                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      onNewDeal();
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Plus className="w-4 h-4 text-indigo-500" />
                    Criar Novo Negócio
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("pipeline");
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Kanban className="w-4 h-4 text-violet-500" />
                    Abrir Funil Kanban
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("integrations");
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <PlugZap className="w-4 h-4 text-emerald-500" />
                    Configurar Evolution API
                  </button>
                  <button
                    onClick={() => {
                      onToggleTheme();
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    Alternar Tema Claro/Escuro
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("dashboard");
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <LayoutDashboard className="w-4 h-4 text-sky-500" />
                    Ir para Dashboard de Vendas
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Clique em qualquer negócio para abrir a Visão 360º + WhatsApp
              </span>
              <span>Nexus Command</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
