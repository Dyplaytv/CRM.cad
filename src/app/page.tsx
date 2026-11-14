"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Kanban,
  Users2,
  PlugZap,
  Loader2,
} from "lucide-react";
import { INITIAL_DEALS, KANBAN_STAGES } from "@/data/mockData";
import {
  AuthUser,
  ChatMessage,
  Deal,
  DealTask,
  EvolutionConfig,
  StageId,
} from "@/types/crm";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { SalesDashboard } from "@/components/dashboard/SalesDashboard";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { NewDealModal } from "@/components/pipeline/NewDealModal";
import { Client360SlideOver } from "@/components/client360/Client360SlideOver";
import { ContactsDirectory } from "@/components/client360/ContactsDirectory";
import { EvolutionSettings } from "@/components/integrations/EvolutionSettings";
import { LoginScreen } from "@/components/auth/LoginScreen";

const DEMO_EVOLUTION_CONFIG: EvolutionConfig = {
  baseUrl: "https://api.sua-evolution-api.com.br",
  apiKey: "429683C4C977415CAAFCCE10F7D57E11",
  instanceName: "nexus-comercial-01",
  webhookUrl: "http://localhost:3000/api/webhooks/evolution",
  status: "connected",
  phoneConnected: "+55 11 99400-8811 (Comercial Matriz)",
};

const MASTER_DEALS_KEY = "nexus_crm_master_deals";
const MASTER_EVOLUTION_KEY = "nexus_crm_master_evolution";

export default function CRMWorkspacePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [slideOverTab, setSlideOverTab] = useState<
    "notes" | "tasks" | "whatsapp"
  >("whatsapp");

  const [commandOpen, setCommandOpen] = useState(false);
  const [newDealModalOpen, setNewDealModalOpen] = useState(false);
  const [newDealDefaultStage, setNewDealDefaultStage] =
    useState<StageId>("leads");

  const [evolutionConfig, setEvolutionConfig] = useState<EvolutionConfig>(
    DEMO_EVOLUTION_CONFIG
  );

  const hydrateWorkspaceForUser = useCallback((loggedUser: AuthUser) => {
    setSelectedDealId(null);
    setActiveTab("dashboard");

    if (loggedUser.mode === "demo") {
      setDeals(INITIAL_DEALS);
      setEvolutionConfig({
        ...DEMO_EVOLUTION_CONFIG,
        webhookUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/api/webhooks/evolution`
            : DEMO_EVOLUTION_CONFIG.webhookUrl,
      });
      return;
    }

    // Conta Real (Master Admin07) - carrega dados persistidos localmente
    try {
      const savedDeals = localStorage.getItem(MASTER_DEALS_KEY);
      setDeals(savedDeals ? (JSON.parse(savedDeals) as Deal[]) : []);

      const savedEvo = localStorage.getItem(MASTER_EVOLUTION_KEY);
      if (savedEvo) {
        setEvolutionConfig(JSON.parse(savedEvo) as EvolutionConfig);
      } else {
        setEvolutionConfig({
          baseUrl: "",
          apiKey: "",
          instanceName: "nexus-master-01",
          webhookUrl:
            typeof window !== "undefined"
              ? `${window.location.origin}/api/webhooks/evolution`
              : "https://crm.cadtech.com.br/api/webhooks/evolution",
          status: "disconnected",
        });
      }
    } catch {
      setDeals([]);
    }
  }, []);

  // Verificar sessão ativa ao carregar
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.authenticated && data?.user) {
          setUser(data.user as AuthUser);
          hydrateWorkspaceForUser(data.user as AuthUser);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setAuthChecking(false);
      });
    return () => {
      active = false;
    };
  }, [hydrateWorkspaceForUser]);

  // Persistir alterações da conta Master no localStorage
  useEffect(() => {
    if (user?.mode === "master") {
      try {
        localStorage.setItem(MASTER_DEALS_KEY, JSON.stringify(deals));
      } catch {}
    }
  }, [deals, user]);

  useEffect(() => {
    if (user?.mode === "master") {
      try {
        localStorage.setItem(
          MASTER_EVOLUTION_KEY,
          JSON.stringify(evolutionConfig)
        );
      } catch {}
    }
  }, [evolutionConfig, user]);

  const handleLoginSuccess = (loggedUser: AuthUser) => {
    setUser(loggedUser);
    hydrateWorkspaceForUser(loggedUser);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {}
    setUser(null);
    setSelectedDealId(null);
  };

  // Sincronizar classe 'dark' no elemento <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Atalho global Ctrl+K / Cmd+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const selectedDeal = deals.find((d) => d.id === selectedDealId) || null;

  const handleOpenDeal360 = (
    deal: Deal,
    defaultTab: "notes" | "tasks" | "whatsapp" = "whatsapp"
  ) => {
    setSelectedDealId(deal.id);
    setSlideOverTab(defaultTab);
  };

  // Movimentação de Card no Kanban (zera dias estagnados e adiciona evento na timeline)
  const handleMoveDeal = (dealId: string, targetStage: StageId) => {
    const stageTitle =
      KANBAN_STAGES.find((s) => s.id === targetStage)?.title || targetStage;

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId || d.stage === targetStage) return d;
        return {
          ...d,
          stage: targetStage,
          stagnantDays: 0,
          timeline: [
            {
              id: `ev-${Date.now()}`,
              title: `Movido para ${stageTitle}`,
              description: "Atualizado no Funil Kanban",
              timestamp: "Agora mesmo",
              type: "stage",
            },
            ...d.timeline,
          ],
        };
      })
    );
  };

  const handleToggleTask = (dealId: string, taskId: string) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      })
    );
  };

  const handleAddTask = (dealId: string, newTask: DealTask) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, tasks: [newTask, ...d.tasks] } : d
      )
    );
  };

  const handleSaveNotes = (dealId: string, htmlNotes: string) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, notes: htmlNotes } : d))
    );
  };

  const handleAddTag = (dealId: string, tag: string) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId && !d.tags.includes(tag)
          ? { ...d, tags: [...d.tags, tag] }
          : d
      )
    );
  };

  const handleAddMessage = (dealId: string, msg: ChatMessage) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              messages: [...d.messages, msg],
              timeline: [
                {
                  id: `ev-msg-${Date.now()}`,
                  title:
                    msg.sender === "me"
                      ? "Mensagem enviada via Evolution API"
                      : "Webhook WhatsApp recebido",
                  description: msg.text.slice(0, 70),
                  timestamp: msg.timestamp,
                  type: "whatsapp",
                },
                ...d.timeline,
              ],
            }
          : d
      )
    );
  };

  const handleCreateNewDeal = (newDeal: Deal) => {
    setDeals((prev) => [newDeal, ...prev]);
    setSelectedDealId(newDeal.id);
    setSlideOverTab("whatsapp");
  };

  const stagnantCount = deals.filter(
    (d) => d.stagnantDays > 3 && d.stage !== "closed"
  ).length;

  if (authChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-500">
        <div className="flex items-center gap-2.5 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Carregando Nexus CRM...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onAuthenticated={handleLoginSuccess}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Left Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onNewDeal={() => {
          setNewDealDefaultStage("leads");
          setNewDealModalOpen(true);
        }}
        onOpenCommand={() => setCommandOpen(true)}
        evolutionStatus={evolutionConfig.status}
        dealsCount={deals.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenCommand={() => setCommandOpen(true)}
          onNewDeal={() => {
            setNewDealDefaultStage("leads");
            setNewDealModalOpen(true);
          }}
          stagnantCount={stagnantCount}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 pt-6 pb-20 md:pb-6">
          {activeTab === "dashboard" && (
            <SalesDashboard
              deals={deals}
              onSelectDeal={(deal) => handleOpenDeal360(deal, "whatsapp")}
              onToggleTask={handleToggleTask}
              onOpenPipeline={() => setActiveTab("pipeline")}
            />
          )}

          {activeTab === "pipeline" && (
            <KanbanBoard
              deals={deals}
              onMoveDeal={handleMoveDeal}
              onSelectDeal={(deal, tab) =>
                handleOpenDeal360(deal, tab || "whatsapp")
              }
              onNewDealInStage={(stageId) => {
                setNewDealDefaultStage(stageId);
                setNewDealModalOpen(true);
              }}
            />
          )}

          {activeTab === "contacts" && (
            <ContactsDirectory
              deals={deals}
              onSelectDeal={(deal, tab) =>
                handleOpenDeal360(deal, tab || "notes")
              }
            />
          )}

          {activeTab === "integrations" && (
            <EvolutionSettings
              config={evolutionConfig}
              onUpdateConfig={setEvolutionConfig}
            />
          )}
        </main>

        {/* Simplified Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeTab === "dashboard"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeTab === "pipeline"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500"
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Pipeline</span>
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeTab === "contacts"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500"
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>Clientes 360º</span>
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeTab === "integrations"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500"
            }`}
          >
            <PlugZap className="w-4 h-4" />
            <span>WhatsApp API</span>
          </button>
        </nav>
      </div>

      {/* Slide-Over 360º Client & WhatsApp Chat */}
      <Client360SlideOver
        deal={selectedDeal}
        initialTab={slideOverTab}
        onClose={() => setSelectedDealId(null)}
        evolutionConfig={evolutionConfig}
        onUpdateStage={handleMoveDeal}
        onSaveNotes={handleSaveNotes}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onAddTag={handleAddTag}
        onAddMessage={handleAddMessage}
      />

      {/* Command+K Global Search Modal */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        deals={deals}
        onSelectDeal={(deal) => handleOpenDeal360(deal, "whatsapp")}
        onNavigate={(tab) => setActiveTab(tab)}
        onToggleTheme={toggleTheme}
        onNewDeal={() => {
          setNewDealDefaultStage("leads");
          setNewDealModalOpen(true);
        }}
      />

      {/* New Deal Modal */}
      <NewDealModal
        isOpen={newDealModalOpen}
        defaultStage={newDealDefaultStage}
        onClose={() => setNewDealModalOpen(false)}
        onCreateDeal={handleCreateNewDeal}
      />
    </div>
  );
}
