"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Flame,
  Plus,
  MessageSquare,
  GripVertical,
  Filter,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import { AgentAccount, Deal, Priority, StageId } from "@/types/crm";
import { KANBAN_STAGES } from "@/data/mockData";
import { getDealUnreadCount } from "@/lib/unreadWhatsApp";

interface KanbanBoardProps {
  deals: Deal[];
  onMoveDeal: (dealId: string, targetStage: StageId) => void;
  onSelectDeal: (deal: Deal, defaultTab?: "notes" | "tasks" | "whatsapp") => void;
  onNewDealInStage: (stage: StageId) => void;
  agents?: AgentAccount[];
  onAssignAgent?: (dealId: string, sellerId: string) => void;
}

export function KanbanBoard({
  deals,
  onMoveDeal,
  onSelectDeal,
  onNewDealInStage,
  agents = [],
  onAssignAgent,
}: KanbanBoardProps) {
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | "Todas">("Todas");
  const [onlyStagnant, setOnlyStagnant] = useState(false);

  const filteredDeals = deals.filter((deal) => {
    if (priorityFilter !== "Todas" && deal.priority !== priorityFilter) {
      return false;
    }
    if (onlyStagnant && deal.stagnantDays <= 3) {
      return false;
    }
    return true;
  });

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "Alta":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25";
      case "Média":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";
      case "Baixa":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData("text/plain", dealId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: StageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: StageId) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain") || draggedDealId;
    if (dealId) {
      onMoveDeal(dealId, targetStage);
    }
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Kanban Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Prioridade:</span>
            {(["Todas", "Alta", "Média", "Baixa"] as const).map((prio) => (
              <button
                key={prio}
                onClick={() => setPriorityFilter(prio)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                  priorityFilter === prio
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {prio}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOnlyStagnant(!onlyStagnant)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              onlyStagnant
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-amber-500/30"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Estagnados (&gt; 3 dias)</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Arraste e solte os cards para atualizar o forecast em tempo real
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            Total Pipeline:{" "}
            {filteredDeals
              .reduce((a, b) => a + b.value, 0)
              .toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 pr-2 snap-x">
        {KANBAN_STAGES.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((acc, d) => acc + d.value, 0);
          const isDropTarget = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-[305px] shrink-0 snap-start flex flex-col rounded-2xl border transition-all ${
                isDropTarget
                  ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20"
                  : "border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/50"
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {stage.title}
                  </h3>
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {stageTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  <button
                    onClick={() => onNewDealInStage(stage.id)}
                    title={`Adicionar negócio em ${stage.title}`}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards Stack */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto">
                {stageDeals.map((deal) => {
                  const isStagnant =
                    deal.stagnantDays > 3 && deal.stage !== "closed";

                  return (
                    <motion.div
                      layout
                      key={deal.id}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(
                          e as unknown as React.DragEvent,
                          deal.id
                        )
                      }
                      onDragEnd={() => {
                        setDraggedDealId(null);
                        setDragOverStage(null);
                      }}
                      onClick={() => onSelectDeal(deal)}
                      className={`group relative cursor-grab active:cursor-grabbing rounded-xl border p-3.5 bg-white dark:bg-zinc-900 drop-shadow-sm transition-all hover:-translate-y-0.5 ${
                        draggedDealId === deal.id
                          ? "opacity-40 scale-95"
                          : isStagnant
                          ? "border-amber-500/40 dark:border-amber-500/35 hover:border-amber-500"
                          : "border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/50"
                      }`}
                    >
                      {/* Top Priority Tag + Stagnant Indicator */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityBadge(
                            deal.priority
                          )}`}
                        >
                          Prioridade {deal.priority}
                        </span>

                        <div className="flex items-center gap-1">
                          {isStagnant && (
                            <span
                              title={`Negócio estagnado há ${deal.stagnantDays} dias sem movimentação`}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                            >
                              <Flame className="w-3 h-3 text-amber-500" />
                              {deal.stagnantDays}d parado
                            </span>
                          )}
                          <GripVertical className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Client Name & Deal Title */}
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {deal.company}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {deal.title}
                      </p>

                      {/* Deal Value */}
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                          {deal.value.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {deal.contactName}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {deal.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Footer: Seller Avatar & Quick WhatsApp Trigger */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${deal.seller.color} text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shrink-0`}
                            title={`Responsável: ${deal.seller.name}`}
                          >
                            {deal.seller.initials}
                          </div>
                          {onAssignAgent && agents.length > 0 ? (
                            <select
                              value={
                                agents.some((a) => a.id === deal.seller.id)
                                  ? deal.seller.id
                                  : "master-admin"
                              }
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                onAssignAgent(deal.id, e.target.value);
                              }}
                              title="Mudar atendente responsável"
                              className="text-[11px] bg-transparent text-zinc-600 dark:text-zinc-300 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 rounded-md px-1 py-0.5 max-w-[120px] truncate focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option
                                value="master-admin"
                                className="bg-white dark:bg-zinc-900"
                              >
                                Gerente
                              </option>
                              {agents.map((agent) => (
                                <option
                                  key={agent.id}
                                  value={agent.id}
                                  className="bg-white dark:bg-zinc-900"
                                >
                                  {agent.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[115px]">
                              {deal.seller.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Quick Move button for Mobile / Touch */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = KANBAN_STAGES.findIndex(
                                (s) => s.id === deal.stage
                              );
                              const nextStage =
                                KANBAN_STAGES[
                                  (currentIndex + 1) % KANBAN_STAGES.length
                                ].id;
                              onMoveDeal(deal.id, nextStage);
                            }}
                            title="Avançar para próxima coluna"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Open WhatsApp Chat */}
                          {(() => {
                            const unreadCount = getDealUnreadCount(deal);
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectDeal(deal, "whatsapp");
                                }}
                                title={
                                  unreadCount > 0
                                    ? `${unreadCount} mensagem(ns) não lida(s) no WhatsApp`
                                    : "Abrir Chat WhatsApp deste cliente"
                                }
                                className={`relative flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                                  unreadCount > 0
                                    ? "bg-emerald-500/25 text-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-400/70 animate-pulse"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{deal.messages.length}</span>
                                {unreadCount > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                  </span>
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {stageDeals.length === 0 && (
                  <div className="h-32 rounded-xl border border-dashed border-zinc-300/70 dark:border-zinc-800 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Arraste um negócio para cá
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
