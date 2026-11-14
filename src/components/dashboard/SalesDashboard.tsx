"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Deal } from "@/types/crm";
import { MONTHLY_REVENUE } from "@/data/mockData";

interface SalesDashboardProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  onToggleTask: (dealId: string, taskId: string) => void;
  onOpenPipeline: () => void;
}

export function SalesDashboard({
  deals,
  onSelectDeal,
  onToggleTask,
  onOpenPipeline,
}: SalesDashboardProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(10); // Novembro default

  // Cálculo dinâmico das métricas do topo
  const newLeadsCount = deals.filter(
    (d) => d.stage === "leads" || d.stage === "contacted"
  ).length;

  const openProposals = deals.filter(
    (d) => d.stage === "proposal" || d.stage === "negotiation"
  );

  const closedDeals = deals.filter((d) => d.stage === "closed");
  const conversionRate =
    deals.length > 0 ? Math.round((closedDeals.length / deals.length) * 100) : 28;

  const forecastRevenue = deals.reduce((acc, d) => acc + d.value, 0);

  const kpiCards = [
    {
      title: "Novos Leads",
      value: `${newLeadsCount + 38}`,
      growth: "+18.4%",
      subtitle: "vs. mês anterior (34 qualificados)",
      icon: Users,
      accent: "from-sky-500/15 to-indigo-500/5",
      iconColor: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Propostas Abertas",
      value: `${openProposals.length + 14}`,
      growth: "+12.1%",
      subtitle: `${openProposals
        .reduce((a, b) => a + b.value, 0)
        .toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        })} em mesa`,
      icon: FileText,
      accent: "from-violet-500/15 to-fuchsia-500/5",
      iconColor: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate + 8.4}%`,
      growth: "+4.2%",
      subtitle: "Ciclo médio de vendas: 19 dias",
      icon: TrendingUp,
      accent: "from-emerald-500/15 to-teal-500/5",
      iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Receita Prevista",
      value: forecastRevenue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
      growth: "+24.8%",
      subtitle: "Meta Q4 atingida em 92%",
      icon: DollarSign,
      accent: "from-amber-500/15 to-orange-500/5",
      iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  // Todas as tarefas (Follow-ups do dia) vinculadas aos negócios
  const allFollowUps = deals.flatMap((deal) =>
    deal.tasks.map((task) => ({
      ...task,
      deal,
    }))
  );

  const stagnantDeals = deals.filter(
    (d) => d.stagnantDays > 3 && d.stage !== "closed"
  );

  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((m) => m.realized));

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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-5 drop-shadow-sm hover:border-indigo-500/40 transition-all group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60 pointer-events-none`}
              />
              <div className="relative flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {card.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
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

            <div className="flex items-center gap-4 text-xs">
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
            </div>
          </div>

          {/* Highlight Banner for Active Hovered Month */}
          {hoveredMonth !== null && (
            <div className="mb-5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/70 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {MONTHLY_REVENUE[hoveredMonth].month}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Realizado:{" "}
                    {MONTHLY_REVENUE[hoveredMonth].realized.toLocaleString(
                      "pt-BR",
                      { style: "currency", currency: "BRL" }
                    )}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Meta:{" "}
                    {MONTHLY_REVENUE[hoveredMonth].forecast.toLocaleString(
                      "pt-BR",
                      { style: "currency", currency: "BRL" }
                    )}{" "}
                    • {MONTHLY_REVENUE[hoveredMonth].dealsCount} contratos
                    fechados
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {Math.round(
                  (MONTHLY_REVENUE[hoveredMonth].realized /
                    MONTHLY_REVENUE[hoveredMonth].forecast) *
                    100
                )}
                % da meta atingida
              </span>
            </div>
          )}

          {/* Bars Container */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-3 pt-6 px-1 border-b border-zinc-200/70 dark:border-zinc-800">
            {MONTHLY_REVENUE.map((item, index) => {
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
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0">
                          {getTaskIcon(item.type)}
                          {item.dueDate}
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
    </div>
  );
}
