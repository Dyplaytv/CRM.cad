"use client";

import React from "react";
import {
  Building2,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Deal } from "@/types/crm";
import { KANBAN_STAGES } from "@/data/mockData";
import { getDealUnreadCount } from "@/lib/unreadWhatsApp";

interface ContactsDirectoryProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal, defaultTab?: "notes" | "tasks" | "whatsapp") => void;
}

export function ContactsDirectory({
  deals,
  onSelectDeal,
}: ContactsDirectoryProps) {
  return (
    <div className="space-y-4 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deals.map((deal) => {
          const stageObj = KANBAN_STAGES.find((s) => s.id === deal.stage);
          return (
            <div
              key={deal.id}
              onClick={() => onSelectDeal(deal, "notes")}
              className="cursor-pointer rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 drop-shadow-sm hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/15 to-violet-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {deal.company}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {deal.contactName} • {deal.contactRole}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {stageObj?.title}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    {deal.contactEmail}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    {deal.contactPhone}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block">
                    Valor em Negociação
                  </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {deal.value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {deal.stagnantDays > 3 && deal.stage !== "closed" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      {deal.stagnantDays}d
                    </span>
                  )}
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
                            ? `${unreadCount} mensagem(ns) não lida(s)`
                            : "Abrir Chat 360º"
                        }
                        className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          unreadCount > 0
                            ? "bg-emerald-500/25 text-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-400/70 animate-pulse"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat 360º
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                          </span>
                        )}
                      </button>
                    );
                  })()}
                  <span className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
