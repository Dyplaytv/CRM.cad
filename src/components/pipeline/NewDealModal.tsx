"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Deal, Priority, StageId } from "@/types/crm";
import { KANBAN_STAGES, SELLERS } from "@/data/mockData";

interface NewDealModalProps {
  isOpen: boolean;
  defaultStage: StageId;
  onClose: () => void;
  onCreateDeal: (deal: Deal) => void;
}

export function NewDealModal({
  isOpen,
  defaultStage,
  onClose,
  onCreateDeal,
}: NewDealModalProps) {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("+55 11 9");
  const [value, setValue] = useState("48000");
  const [priority, setPriority] = useState<Priority>("Alta");
  const [stage, setStage] = useState<StageId>(defaultStage);
  const [sellerId, setSellerId] = useState(SELLERS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !title.trim()) return;

    const chosenSeller =
      SELLERS.find((s) => s.id === sellerId) || SELLERS[0];

    const newDeal: Deal = {
      id: `deal-${Math.floor(100 + Math.random() * 900)}`,
      company: company.trim(),
      title: title.trim(),
      contactName: contactName.trim() || "Diretor Comercial",
      contactRole: "Decisor Executivo",
      contactEmail: `contato@${company
        .toLowerCase()
        .replace(/\s+/g, "")}.com.br`,
      contactPhone: contactPhone.trim(),
      cnpj: "48.120.993/0001-20",
      city: "São Paulo, SP",
      value: Number(value) || 25000,
      stage,
      priority,
      stagnantDays: 0,
      seller: chosenSeller,
      tags: ["Novo Negócio", "Q4"],
      customFields: {
        origin: "Cadastro Manual CRM",
        segment: "Tecnologia B2B",
        employees: "50 - 200",
        expectedClose: "30 Nov 2026",
      },
      notes: `<p>Negócio criado para <strong>${company}</strong>. Próximo passo: agendar demonstração executiva.</p>`,
      tasks: [
        {
          id: `t-${Date.now()}`,
          title: `Enviar apresentação institucional via WhatsApp para ${
            contactName || company
          }`,
          dueDate: "Hoje, 16:00",
          completed: false,
          priority: "Alta",
          type: "whatsapp",
        },
      ],
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: "me",
          text: `Olá ${
            contactName || "tudo bem"
          }! Aqui é ${chosenSeller.name} da Nexus CRM. Acabei de abrir seu atendimento por aqui.`,
          timestamp: "Agora",
          status: "read",
        },
      ],
      timeline: [
        {
          id: `ev-${Date.now()}`,
          title: "Negócio registrado no Pipeline",
          description: `Criado por ${chosenSeller.name}`,
          timestamp: "Agora mesmo",
          type: "stage",
        },
      ],
    };

    onCreateDeal(newDeal);
    setCompany("");
    setTitle("");
    setContactName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200/70 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Novo Negócio no Pipeline
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Adicione uma nova oportunidade comercial com integração
                    WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Empresa / Cliente *
                  </label>
                  <input
                    required
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Atlas Logística S.A."
                    className="w-full rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Título da Oportunidade *
                  </label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Licenciamento 50 Usuários"
                    className="w-full rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome do Contato Decisor
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    WhatsApp (Evolution API)
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Valor Previsto (R$)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Etapa Inicial
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as StageId)}
                    className="w-full rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    {KANBAN_STAGES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Vendedor Responsável
                </label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  {SELLERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-sm"
                >
                  Criar Negócio
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
