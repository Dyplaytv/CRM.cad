"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Target,
  X,
  Check,
} from "lucide-react";
import { Deal } from "@/types/crm";
import { MONTHLY_REVENUE } from "@/data/mockData";
import { isTaskOverdue, sortTasksByExpiration } from "@/lib/taskDates";
import { getDealUnreadCount } from "@/lib/unreadWhatsApp";

interface SalesDashboardProps {
  deals: Deal[];
  isDemo?: boolean;
  revenueTargets?: number[];
  canEditTargets?: boolean;
  onSaveRevenueTargets?: (
    targets: number[]
  ) => Promise<{ ok: boolean; error?: string }>;
  onSelectDeal: (deal: Deal) => void;
  onToggleTask: (dealId: string, taskId: string) => void;
  onOpenPipeline: () => void;
}

export function SalesDashboard({
  deals,
  isDemo = false,
  revenueTargets,
  canEditTargets = false,
  onSaveRevenueTargets,
  onSelectDeal,
  onToggleTask,
  onOpenPipeline,
}: SalesDashboardProps) {
  const currentMonthIdx = new Date().getMonth();
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(
    currentMonthIdx
  );
  const [showUnreadList, setShowUnreadList] = useState(false);
  const [targetsModalOpen, setTargetsModalOpen] = useState(false);
  const [draftTargets, setDraftTargets] = useState<number[]>(() =>
    Array.from({ length: 12 }, (_, idx) => revenueTargets?.[idx] || 0)
  );
  const [bulkTarget, setBulkTarget] = useState("");
  const [savingTargets, setSavingTargets] = useState(false);

  useEffect(() => {
    setDraftTargets(
      Array.from({ length: 12 }, (_, idx) => revenueTargets?.[idx] || 0)
    );
  }, [revenueTargets]);

  // Cálculo dinâmico real das métricas do topo a partir dos negócios ativos
  const newLeadsCount = deals.filter(
    (d) => d.stage === "leads" || d.stage === "contacted"
  ).length;
  const unreadDeals = deals.filter((d) => getDealUnreadCount(d) > 0);

  const openProposals = deals.filter(
    (d) => d.stage === "proposal" || d.stage === "negotiation"
  );
  const openProposalsValue = openProposals.reduce((a, b) => a + b.value, 0);

  const closedDeals = deals.filter((d) => d.stage === "closed");
  const closedRevenue = closedDeals.reduce((a, b) => a + b.value, 0);

  const conversionRate =
    deals.length > 0 ? Math.round((closedDeals.length / deals.length) * 100) : 0;

  const pipelineForecast = deals.reduce((acc, d) => acc + d.value, 0);
  const currentMonthTarget = revenueTargets?.[currentMonthIdx] || 0;
  const forecastRevenue =
    currentMonthTarget > 0 ? currentMonthTarget : pipelineForecast;

  const kpiCards: Array<{
    key: string;
    title: string;
    value: string;
    growth: string;
    subtitle: string;
    icon: React.ElementType;
    accent: string;
    iconColor: string;
    clickable?: boolean;
    hasAlert?: boolean;
    onClick?: () => void;
  }> = [
    {
      key: "new-leads",
      title: "Novos Leads",
      value: `${newLeadsCount}`,
      growth: `${deals.length} total`,
      subtitle: `${deals.length} negócio(s) ativo(s) no funil`,
      icon: Users,
      accent: "from-sky-500/15 to-indigo-500/5",
      iconColor: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      key: "unread-whatsapp",
      title: "Whats Esperando Resposta",
      value: `${unreadDeals.length}`,
      growth: unreadDeals.length > 0 ? "Ver conversas" : "Em dia",
      subtitle:
        unreadDeals.length > 0
          ? `Clique para ver ${unreadDeals.length} conversa(s) não aberta(s)`
          : "Nenhuma mensagem aguardando abertura",
      icon: MessageSquare,
      accent:
        unreadDeals.length > 0
          ? "from-emerald-500/20 to-teal-500/5"
          : "from-zinc-500/10 to-zinc-500/5",
      iconColor:
        unreadDeals.length > 0
          ? "text-emerald-500 bg-emerald-500/15 border-emerald-500/30"
          : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
      clickable: true,
      hasAlert: unreadDeals.length > 0,
    },
    {
      key: "open-proposals",
      title: "Propostas Abertas",
      value: `${openProposals.length}`,
      growth: openProposals.length > 0 ? "Ativas" : "0 ativas",
      subtitle: `${openProposalsValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      })} em mesa`,
      icon: FileText,
      accent: "from-violet-500/15 to-fuchsia-500/5",
      iconColor: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    },
    {
      key: "conversion-rate",
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      growth: `${closedDeals.length} ganho(s)`,
      subtitle: `${closedDeals.length} fechado(s) de ${deals.length} negócio(s)`,
      icon: TrendingUp,
      accent: "from-emerald-500/15 to-teal-500/5",
      iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      key: "forecast-revenue",
      title: "Receita Prevista",
      value: forecastRevenue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
      growth:
        currentMonthTarget > 0
          ? "Meta do mês"
          : canEditTargets
          ? "Definir meta"
          : "Pipeline",
      subtitle:
        currentMonthTarget > 0
          ? `${closedRevenue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0,
            })} fechado • ${pipelineForecast.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0,
            })} em pipeline`
          : `${closedRevenue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0,
            })} já fechado(s)`,
      icon: DollarSign,
      accent: "from-amber-500/15 to-orange-500/5",
      iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      clickable: canEditTargets,
      onClick: canEditTargets ? () => setTargetsModalOpen(true) : undefined,
    },
  ];

  // No modo DEMO usa os dados históricos fictícios; na conta real usa metas cadastradas + fechamentos reais
  const monthlyData = isDemo
    ? MONTHLY_REVENUE
    : MONTHLY_REVENUE.map((m, idx) => {
        const targetVal = revenueTargets?.[idx] || 0;
        const fallbackForecast =
          idx === currentMonthIdx ? pipelineForecast : 0;
        return {
          month: m.month,
          realized: idx === currentMonthIdx ? closedRevenue : 0,
          forecast: targetVal > 0 ? targetVal : fallbackForecast,
          dealsCount: idx === currentMonthIdx ? closedDeals.length : 0,
        };
      });

  // Todas as tarefas ordenadas da mais próxima de expirar (ou atrasada) para a mais distante
  const allFollowUps = sortTasksByExpiration(
    deals.flatMap((deal) =>
      deal.tasks.map((task) => ({
        ...task,
        deal,
      }))
    )
  );

  const stagnantDeals = deals.filter(
    (d) => d.stagnantDays > 3 && d.stage !== "closed"
  );

  const maxRevenue = Math.max(
    1,
    ...monthlyData.map((m) => Math.max(m.realized, m.forecast))
  );

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="w-3.5 h-3.5 text-amber-500" />;
      case "whatsapp":
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case "email":
        return <Mail className="w-3.5 h-3.5 text-sky-500" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              onClick={
                card.onClick
                  ? card.onClick
                  : card.clickable
                  ? () => setShowUnreadList((prev) => !prev)
                  : undefined
              }
              className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900/90 p-5 drop-shadow-sm transition-all group ${
                card.clickable ? "cursor-pointer" : ""
              } ${
                card.hasAlert
                  ? "border-emerald-500/50 hover:border-emerald-500 ring-1 ring-emerald-500/20"
                  : "border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-500/40"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60 pointer-events-none`}
              />
              <div className="relative flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {card.title}
                </span>
                <div
                  className={`relative w-9 h-9 rounded-xl border flex items-center justify-center ${
                    card.iconColor
                  } ${card.hasAlert ? "animate-pulse" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  {card.hasAlert && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex items-baseline justify-between gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {card.value}
                </h2>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {card.growth}
                </span>
              </div>

              <p className="relative mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                {card.subtitle}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Lista expansível de WhatsApp esperando resposta */}
      {showUnreadList && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-zinc-900/95 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Conversas de WhatsApp Aguardando Abertura ({unreadDeals.length})
              </h3>
            </div>
            <button
              onClick={() => setShowUnreadList(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Fechar
            </button>
          </div>

          {unreadDeals.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3">
              Todas as mensagens recebidas já foram visualizadas.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unreadDeals.map((deal) => {
                const unread = getDealUnreadCount(deal);
                const lastMsg =
                  deal.messages[deal.messages.length - 1]?.text ||
                  "Nova mensagem recebida";
                return (
                  <button
                    key={deal.id}
                    onClick={() => {
                      setShowUnreadList(false);
                      onSelectDeal(deal);
                    }}
                    className="text-left p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {deal.contactName || deal.company}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {deal.contactPhone}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate mt-1">
                        {lastMsg}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold animate-pulse">
                      {unread} nova(s)
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Main Grid: Bar Chart + Follow-up Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Modern Bar Chart: Vendas por Mês */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 drop-shadow-sm flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Receita de Vendas por Mês
                </h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  2026
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Comparativo entre Receita Realizada vs. Meta Prevista (ARR)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-indigo-600 to-violet-500" />
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                  Realizado
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
                <span className="text-zinc-500 dark:text-zinc-400">
                  Meta Prevista
                </span>
              </div>
              {canEditTargets && (
                <button
                  type="button"
                  onClick={() => setTargetsModalOpen(true)}
                  className="ml-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Target className="w-3.5 h-3.5" />
                  Definir Metas
                </button>
              )}
            </div>
          </div>

          {/* Highlight Banner for Active Hovered Month */}
          {hoveredMonth !== null && (
            <div className="mb-5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/70 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {monthlyData[hoveredMonth].month}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Realizado:{" "}
                    {monthlyData[hoveredMonth].realized.toLocaleString(
                      "pt-BR",
                      { style: "currency", currency: "BRL" }
                    )}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Previsto:{" "}
                    {monthlyData[hoveredMonth].forecast.toLocaleString(
                      "pt-BR",
                      { style: "currency", currency: "BRL" }
                    )}{" "}
                    • {monthlyData[hoveredMonth].dealsCount} contrato(s)
                    fechado(s)
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {monthlyData[hoveredMonth].forecast > 0
                  ? Math.round(
                      (monthlyData[hoveredMonth].realized /
                        monthlyData[hoveredMonth].forecast) *
                        100
                    )
                  : 0}
                % da meta atingida
              </span>
            </div>
          )}

          {/* Bars Container */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-3 pt-6 px-1 border-b border-zinc-200/70 dark:border-zinc-800">
            {monthlyData.map((item, index) => {
              const realizedPercent = Math.round(
                (item.realized / maxRevenue) * 100
              );
              const forecastPercent = Math.round(
                (item.forecast / maxRevenue) * 100
              );
              const isSelected = hoveredMonth === index;

              return (
                <div
                  key={item.month}
                  onMouseEnter={() => setHoveredMonth(index)}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer group"
                >
                  <div className="relative w-full flex items-end justify-center gap-1 h-48">
                    {/* Forecast Bar */}
                    <div
                      style={{ height: `${forecastPercent}%` }}
                      className="w-2 sm:w-3 rounded-t-md bg-zinc-200 dark:bg-zinc-800 transition-all duration-300"
                    />
                    {/* Realized Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${realizedPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.03 }}
                      className={`w-3 sm:w-5 rounded-t-md transition-all ${
                        isSelected
                          ? "bg-gradient-to-t from-indigo-600 via-indigo-500 to-violet-400 shadow-lg shadow-indigo-500/25"
                          : "bg-gradient-to-t from-indigo-600/85 to-violet-500/85 opacity-85 group-hover:opacity-100"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-medium pb-2 ${
                      isSelected
                        ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Passe o mouse sobre os meses para inspecionar o fechamento
            </span>
            <button
              onClick={onOpenPipeline}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              Ver funil completo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Next Tasks (Follow-ups do Dia) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="lg:col-span-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 drop-shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Próximas Tarefas
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Follow-ups prioritários do dia
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {allFollowUps.filter((t) => !t.completed).length} pendentes
              </span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {allFollowUps.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    item.completed
                      ? "bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200/50 dark:border-zinc-800/50 opacity-60"
                      : "bg-zinc-50/90 dark:bg-zinc-950/80 border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => onToggleTask(item.deal.id, item.id)}
                      className="mt-0.5 text-zinc-400 hover:text-indigo-500 transition-colors shrink-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium leading-snug ${
                          item.completed
                            ? "line-through text-zinc-400"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onSelectDeal(item.deal)}
                          className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                        >
                          {item.deal.company}
                        </button>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] shrink-0 ${
                            isTaskOverdue(item)
                              ? "text-rose-500 font-semibold"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {getTaskIcon(item.type)}
                          {item.dueDate}
                          {isTaskOverdue(item) ? " (Atrasada)" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stagnant Deals Alert Box */}
          {stagnantDeals.length > 0 && (
            <div className="mt-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Atenção: Negócios Estagnados
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  &gt; 3 dias
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mb-2">
                {stagnantDeals.length} oportunidades de alto valor estão sem
                movimentação no funil.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stagnantDeals.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onSelectDeal(d)}
                    className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-amber-500/30 text-zinc-800 dark:text-zinc-200 hover:border-amber-500 transition-colors"
                  >
                    {d.company} ({d.stagnantDays}d)
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal: Cadastrar Receita Prevista / Metas Mensais */}
      {targetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Metas & Receita Prevista (2026)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Defina a meta de faturamento prevista para cada mês da empresa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTargetsModalOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Aplicar mesma meta para todos os meses */}
            <div className="flex flex-wrap items-end gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Aplicar meta mensal padrão (R$) para todos os meses
                </label>
                <input
                  type="number"
                  min={0}
                  step="100"
                  value={bulkTarget}
                  onChange={(e) => setBulkTarget(e.target.value)}
                  placeholder="Ex: 50000"
                  className="w-full rounded-xl px-3.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = Number(bulkTarget);
                  if (Number.isFinite(val) && val >= 0) {
                    setDraftTargets(Array.from({ length: 12 }, () => val));
                  }
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
              >
                Aplicar em Todos
              </button>
            </div>

            {/* Grid dos 12 meses */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[45vh] overflow-y-auto pr-1">
              {MONTHLY_REVENUE.map((m, idx) => {
                const isCurrent = idx === currentMonthIdx;
                return (
                  <div
                    key={m.month}
                    className={`p-3 rounded-xl border ${
                      isCurrent
                        ? "border-indigo-500/50 bg-indigo-500/5"
                        : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50"
                    }`}
                  >
                    <label className="flex items-center justify-between text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      <span>{m.month}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500 text-white">
                          Atual
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="100"
                      value={draftTargets[idx] || 0}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setDraftTargets((prev) =>
                          prev.map((item, i) => (i === idx ? val : item))
                        );
                      }}
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Meta anual prevista:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {draftTargets
                    .reduce((acc, v) => acc + (v || 0), 0)
                    .toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingTargets}
                  onClick={async () => {
                    if (!onSaveRevenueTargets) return;
                    setSavingTargets(true);
                    const res = await onSaveRevenueTargets(draftTargets);
                    setSavingTargets(false);
                    if (res.ok) {
                      setTargetsModalOpen(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {savingTargets ? "Salvando..." : "Salvar Metas"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
