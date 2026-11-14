"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Tag,
  Plus,
  CheckCircle2,
  Circle,
  MessageSquare,
  FileText,
  CheckSquare,
  Bold,
  Italic,
  List,
  Heading2,
  Sparkles,
  Clock,
  Save,
} from "lucide-react";
import {
  ChatMessage,
  Deal,
  DealTask,
  EvolutionConfig,
  StageId,
} from "@/types/crm";
import { KANBAN_STAGES } from "@/data/mockData";
import { WhatsAppChat } from "./WhatsAppChat";

interface Client360SlideOverProps {
  deal: Deal | null;
  initialTab?: "notes" | "tasks" | "whatsapp";
  onClose: () => void;
  evolutionConfig: EvolutionConfig;
  onUpdateStage: (dealId: string, stage: StageId) => void;
  onSaveNotes: (dealId: string, htmlNotes: string) => void;
  onToggleTask: (dealId: string, taskId: string) => void;
  onAddTask: (dealId: string, task: DealTask) => void;
  onAddTag: (dealId: string, tag: string) => void;
  onAddMessage: (dealId: string, msg: ChatMessage) => void;
}

export function Client360SlideOver({
  deal,
  initialTab = "whatsapp",
  onClose,
  evolutionConfig,
  onUpdateStage,
  onSaveNotes,
  onToggleTask,
  onAddTask,
  onAddTag,
  onAddMessage,
}: Client360SlideOverProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "tasks" | "whatsapp">(
    initialTab
  );
  const [notesHtml, setNotesHtml] = useState("");
  const [notesSavedToast, setNotesSavedToast] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    if (deal) {
      setNotesHtml(deal.notes);
    }
  }, [deal]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, deal?.id]);

  if (!deal) return null;

  const insertFormat = (tag: "b" | "i" | "h3" | "li") => {
    const snippets: Record<typeof tag, string> = {
      b: " <strong>Texto em negrito</strong> ",
      i: " <em>Texto em itálico</em> ",
      h3: "<h3>Novo Tópico Comercial</h3>",
      li: "<ul><li>Novo item de alinhamento</li></ul>",
    };
    setNotesHtml((prev) => prev + snippets[tag]);
  };

  const handleSaveNoteClick = () => {
    onSaveNotes(deal.id, notesHtml);
    setNotesSavedToast(true);
    setTimeout(() => setNotesSavedToast(false), 2000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(deal.id, {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      dueDate: "Hoje, 17:30",
      completed: false,
      priority: "Alta",
      type: "whatsapp",
    });
    setNewTaskTitle("");
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    onAddTag(deal.id, newTagInput.trim());
    setNewTagInput("");
  };

  return (
    <AnimatePresence>
      {deal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Glassmorphism Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="relative z-10 w-full max-w-5xl h-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-200/80 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Top Bar of 360 View */}
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                  {deal.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Visão 360º do Cliente
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                      ID: {deal.id}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {deal.company} — {deal.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Stage Selector */}
                <select
                  value={deal.stage}
                  onChange={(e) =>
                    onUpdateStage(deal.id, e.target.value as StageId)
                  }
                  className="rounded-xl px-3 py-2 text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  {KANBAN_STAGES.map((st) => (
                    <option key={st.id} value={st.id}>
                      Etapa: {st.title}
                    </option>
                  ))}
                </select>

                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-zinc-400 uppercase">
                    Valor do Contrato
                  </p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {deal.value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2-Column Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
              {/* LEFT COLUMN: Dados do Cliente, Histórico, Tags e Campos Personalizados */}
              <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-zinc-200/80 dark:border-zinc-800 lg:overflow-y-auto space-y-6 bg-zinc-50/40 dark:bg-zinc-950/40">
                {/* Contact Info Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    Dados do Decisor & Conta
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/70">
                      <span className="text-zinc-500">Contato Principal</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {deal.contactName} ({deal.contactRole})
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/70">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> E-mail
                      </span>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {deal.contactEmail}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/70">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> WhatsApp
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {deal.contactPhone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/70">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3" /> CNPJ
                      </span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {deal.cnpj}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Localidade
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {deal.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Campos Personalizados (CRM)
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400">Origem do Lead</p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {deal.customFields.origin}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400">Segmento</p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {deal.customFields.segment}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400">Porte (Func.)</p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {deal.customFields.employees}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400">
                        Previsão Fechamento
                      </p>
                      <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {deal.customFields.expectedClose}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-violet-500" />
                    Tags do Negócio
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {deal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <form onSubmit={handleCreateTag} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Adicionar tag..."
                      className="flex-1 rounded-xl px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Deal Timeline History */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    Histórico do Negócio
                  </h3>
                  <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
                    {deal.timeline.length > 0 ? (
                      deal.timeline.map((ev) => (
                        <div key={ev.id} className="relative pl-6">
                          <span className="absolute left-0.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-zinc-900" />
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {ev.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {ev.description}
                          </p>
                          <span className="text-[10px] text-zinc-400">
                            {ev.timestamp}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-400 pl-6">
                        Negócio recém-registrado no pipeline.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT/CENTER COLUMN: Timeline & Ações (Anotações, Tarefas, WhatsApp) */}
              <div className="lg:col-span-7 p-6 flex flex-col h-full overflow-hidden">
                {/* Action Tabs */}
                <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 mb-4 shrink-0">
                  <button
                    onClick={() => setActiveTab("whatsapp")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "whatsapp"
                        ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp (Evolution API)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {deal.messages.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "notes"
                        ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Anotações Rich Text</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tasks")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "tasks"
                        ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Tarefas ({deal.tasks.length})</span>
                  </button>
                </div>

                {/* Tab Body */}
                <div className="flex-1 min-h-[440px] overflow-hidden flex flex-col">
                  {activeTab === "whatsapp" && (
                    <WhatsAppChat
                      deal={deal}
                      evolutionConfig={evolutionConfig}
                      onAddMessage={onAddMessage}
                    />
                  )}

                  {activeTab === "notes" && (
                    <div className="flex-1 flex flex-col rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                      {/* Rich Text Formatting Toolbar */}
                      <div className="px-4 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => insertFormat("h3")}
                            className="p-1.5 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            title="Título"
                          >
                            <Heading2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat("b")}
                            className="p-1.5 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            title="Negrito"
                          >
                            <Bold className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat("i")}
                            className="p-1.5 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            title="Itálico"
                          >
                            <Italic className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat("li")}
                            className="p-1.5 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            title="Lista"
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveNoteClick}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>
                            {notesSavedToast
                              ? "Salvo com sucesso!"
                              : "Salvar Anotação"}
                          </span>
                        </button>
                      </div>

                      {/* Editable Area + Formatted Preview */}
                      <div className="flex-1 p-4 grid grid-rows-2 gap-4 overflow-y-auto">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1.5">
                            Editor de Notas da Conta
                          </label>
                          <textarea
                            value={notesHtml}
                            onChange={(e) => setNotesHtml(e.target.value)}
                            className="w-full h-36 rounded-xl p-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            placeholder="Escreva atas de reunião, dores do cliente e condições comerciais..."
                          />
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 overflow-y-auto">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-indigo-500 mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            Visualização Formatada
                          </div>
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none text-xs text-zinc-700 dark:text-zinc-300 space-y-1"
                            dangerouslySetInnerHTML={{ __html: notesHtml }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "tasks" && (
                    <div className="flex-1 flex flex-col rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 overflow-y-auto">
                      <form
                        onSubmit={handleCreateTask}
                        className="flex gap-2 mb-4"
                      >
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Adicionar nova tarefa ou follow-up no checklist..."
                          className="flex-1 rounded-xl px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </button>
                      </form>

                      <div className="space-y-2">
                        {deal.tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => onToggleTask(deal.id, task.id)}
                            className={`cursor-pointer p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                              task.completed
                                ? "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200/50 dark:border-zinc-800/50 opacity-60"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-zinc-400 shrink-0" />
                              )}
                              <div>
                                <p
                                  className={`text-xs font-medium ${
                                    task.completed
                                      ? "line-through text-zinc-400"
                                      : "text-zinc-900 dark:text-zinc-100"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <span className="text-[10px] text-zinc-400">
                                  Prazo: {task.dueDate}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              {task.priority}
                            </span>
                          </div>
                        ))}
                        {deal.tasks.length === 0 && (
                          <p className="text-xs text-zinc-400 text-center py-10">
                            Nenhuma tarefa pendente para este negócio.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
