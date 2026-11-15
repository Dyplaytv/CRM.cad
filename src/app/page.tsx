"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Kanban,
  Users2,
  PlugZap,
  Loader2,
} from "lucide-react";
import { INITIAL_DEALS, KANBAN_STAGES, SELLERS } from "@/data/mockData";
import {
  AgentAccount,
  AuthUser,
  ChatMessage,
  Deal,
  DealTask,
  EvolutionConfig,
  Seller,
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
import { AgentsManager } from "@/components/agents/AgentsManager";
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
  const [agents, setAgents] = useState<AgentAccount[]>([]);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);

  const hydrateWorkspaceForUser = useCallback(async (loggedUser: AuthUser) => {
    setSelectedDealId(null);
    setWorkspaceLoaded(false);
    setActiveTab("dashboard");

    if (loggedUser.mode === "demo") {
      setAgents([]);
      setDeals(INITIAL_DEALS);
      setEvolutionConfig({
        ...DEMO_EVOLUTION_CONFIG,
        webhookUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/api/webhooks/evolution`
            : DEMO_EVOLUTION_CONFIG.webhookUrl,
      });
      setWorkspaceLoaded(true);
      return;
    }

    const defaultMasterEvo: EvolutionConfig = {
      baseUrl: "",
      apiKey: "",
      instanceName: "nexus-master-01",
      webhookUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}/api/webhooks/evolution`
          : "https://crm.cadtech.com.br/api/webhooks/evolution",
      status: "disconnected",
    };

    try {
      const [wsRes, agentsRes] = await Promise.all([
        fetch("/api/workspace"),
        loggedUser.mode === "master"
          ? fetch("/api/agents")
          : Promise.resolve(null),
      ]);

      if (agentsRes && agentsRes.ok) {
        const agentsData = (await agentsRes.json()) as {
          agents?: AgentAccount[];
        };
        if (Array.isArray(agentsData.agents)) {
          setAgents(agentsData.agents);
        }
      } else {
        setAgents([]);
      }

      if (wsRes.ok) {
        const wsData = (await wsRes.json()) as {
          deals?: Deal[];
          evolutionConfig?: EvolutionConfig | null;
        };

        let serverDeals = Array.isArray(wsData.deals) ? wsData.deals : [];
        let serverEvo = wsData.evolutionConfig || null;

        // Migra dados locais do Master para o servidor se o servidor ainda estiver vazio
        if (loggedUser.mode === "master") {
          const savedDealsRaw = localStorage.getItem(MASTER_DEALS_KEY);
          const localDeals = savedDealsRaw
            ? (JSON.parse(savedDealsRaw) as Deal[])
            : [];
          const savedEvoRaw = localStorage.getItem(MASTER_EVOLUTION_KEY);
          const localEvo = savedEvoRaw
            ? (JSON.parse(savedEvoRaw) as EvolutionConfig)
            : null;

          if (serverDeals.length === 0 && localDeals.length > 0) {
            serverDeals = localDeals;
            serverEvo = serverEvo || localEvo || defaultMasterEvo;
            await fetch("/api/workspace", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deals: serverDeals,
                evolutionConfig: serverEvo,
              }),
            });
          } else if (!serverEvo && localEvo) {
            serverEvo = localEvo;
            await fetch("/api/workspace", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ evolutionConfig: serverEvo }),
            });
          }
        }

        setDeals(serverDeals);
        setEvolutionConfig(serverEvo || defaultMasterEvo);
      } else {
        setDeals([]);
        setEvolutionConfig(defaultMasterEvo);
      }
    } catch {
      setDeals([]);
      setEvolutionConfig(defaultMasterEvo);
    } finally {
      setWorkspaceLoaded(true);
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

  // Persistir alterações da conta Master no localStorage e no servidor
  useEffect(() => {
    if (user?.mode === "master" && workspaceLoaded) {
      try {
        localStorage.setItem(MASTER_DEALS_KEY, JSON.stringify(deals));
      } catch {}
      fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deals }),
      }).catch(() => {});
    }
  }, [deals, user, workspaceLoaded]);

  useEffect(() => {
    if (user?.mode === "master" && workspaceLoaded) {
      try {
        localStorage.setItem(
          MASTER_EVOLUTION_KEY,
          JSON.stringify(evolutionConfig)
        );
      } catch {}
      fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evolutionConfig }),
      }).catch(() => {});
    }
  }, [evolutionConfig, user, workspaceLoaded]);

  // Sincronização em tempo real para o Atendente (recebe conversas transferidas e novas mensagens)
  useEffect(() => {
    if (user?.mode !== "agent") return;
    const syncAgentWorkspace = async () => {
      try {
        const res = await fetch("/api/workspace");
        if (!res.ok) return;
        const data = (await res.json()) as {
          deals?: Deal[];
          evolutionConfig?: EvolutionConfig | null;
        };
        if (Array.isArray(data.deals)) {
          setDeals(data.deals);
        }
        if (data.evolutionConfig) {
          setEvolutionConfig(data.evolutionConfig);
        }
      } catch {}
    };
    const interval = setInterval(syncAgentWorkspace, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // Escuta mensagens reais recebidas via Webhook da Evolution API v2.3 no modo Master
  useEffect(() => {
    if (user?.mode !== "master") return;
    let lastChecked = 0;

    const pollWebhooks = async () => {
      try {
        const res = await fetch(`/api/webhooks/evolution?since=${lastChecked}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          events?: Array<{
            id: string;
            phone: string;
            pushName?: string;
            text: string;
            receivedAt: number;
          }>;
          serverTime?: number;
        };
        if (data.serverTime) {
          lastChecked = data.serverTime;
        }
        const events = data.events || [];
        if (events.length === 0) return;

        setDeals((prev) => {
          const matchedEventIds = new Set<string>();

          const updatedDeals = prev.map((deal) => {
            const dealDigits = deal.contactPhone.replace(/\D/g, "");
            if (dealDigits.length < 8) return deal;
            const suffix = dealDigits.slice(-8);

            const matching = events.filter((ev) => ev.phone.endsWith(suffix));
            if (matching.length === 0) return deal;

            matching.forEach((ev) => matchedEventIds.add(ev.id));

            const fresh = matching.filter(
              (ev) => !deal.messages.some((m) => m.id === ev.id)
            );
            if (fresh.length === 0) return deal;

            const newMsgs: ChatMessage[] = fresh.map((ev) => ({
              id: ev.id,
              sender: "client",
              text: ev.text,
              timestamp: new Date(ev.receivedAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }));

            return {
              ...deal,
              unreadCount: (deal.unreadCount ?? 0) + newMsgs.length,
              messages: [...deal.messages, ...newMsgs],
              timeline: [
                ...newMsgs.map((m) => ({
                  id: `ev-${m.id}`,
                  title: "Mensagem recebida via Evolution API v2.3",
                  description: m.text.slice(0, 70),
                  timestamp: m.timestamp,
                  type: "whatsapp" as const,
                })),
                ...deal.timeline,
              ],
            };
          });

          // Cria automaticamente um novo Lead no Kanban se o número ainda não existir no funil
          const unmatched = events.filter((ev) => !matchedEventIds.has(ev.id));
          if (unmatched.length === 0) return updatedDeals;

          const newLeadsMap = new Map<string, Deal>();
          for (const ev of unmatched) {
            const suffix = ev.phone.slice(-8);
            const existingNew = newLeadsMap.get(suffix);
            const msgObj: ChatMessage = {
              id: ev.id,
              sender: "client",
              text: ev.text,
              timestamp: new Date(ev.receivedAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };

            if (existingNew) {
              if (!existingNew.messages.some((m) => m.id === ev.id)) {
                existingNew.messages.push(msgObj);
                existingNew.unreadCount = (existingNew.unreadCount ?? 0) + 1;
              }
            } else {
              const displayName = ev.pushName || `+${ev.phone}`;
              newLeadsMap.set(suffix, {
                id: `wa-${suffix}-${Date.now()}`,
                title: "Atendimento WhatsApp (Inbound)",
                company: displayName,
                contactName: displayName,
                contactRole: "Lead WhatsApp",
                contactEmail: "pendente@whatsapp.lead",
                contactPhone: ev.phone.startsWith("+") ? ev.phone : `+${ev.phone}`,
                cnpj: "A preencher",
                city: "Brasil",
                value: 0,
                stage: "leads",
                priority: "Alta",
                stagnantDays: 0,
                seller: SELLERS[0],
                tags: ["WhatsApp", "Inbound"],
                customFields: {
                  origin: "WhatsApp Evolution API v2.3",
                  segment: "A classificar",
                  employees: "-",
                  expectedClose: "A definir",
                },
                notes: `<p>Lead criado automaticamente ao receber mensagem via Evolution API v2.3.</p>`,
                tasks: [],
                messages: [msgObj],
                unreadCount: 1,
                timeline: [
                  {
                    id: `ev-${ev.id}`,
                    title: "Lead criado via WhatsApp (Evolution API v2.3)",
                    description: ev.text.slice(0, 70),
                    timestamp: msgObj.timestamp,
                    type: "whatsapp",
                  },
                ],
              });
            }
          }

          return [...Array.from(newLeadsMap.values()), ...updatedDeals];
        });
      } catch {}
    };

    pollWebhooks();
    const timer = setInterval(pollWebhooks, 3500);
    return () => clearInterval(timer);
  }, [user?.mode]);

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

  const syncAgentDealToServer = (updatedDeal: Deal) => {
    if (user?.mode !== "agent") return;
    fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal: updatedDeal }),
    }).catch(() => {});
  };

  const updateDealById = (
    dealId: string,
    updater: (deal: Deal) => Deal
  ) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        const next = updater(d);
        if (next !== d) syncAgentDealToServer(next);
        return next;
      })
    );
  };

  const handleCreateAgent = async (input: {
    name: string;
    username: string;
    password: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        agent?: AgentAccount;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.agent) {
        return { ok: false, error: data.error || "Erro ao criar atendente." };
      }
      setAgents((prev) => [...prev, data.agent!]);
      return { ok: true };
    } catch {
      return { ok: false, error: "Falha de conexão com o servidor." };
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      const res = await fetch(`/api/agents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {}
  };

  const handleAssignAgent = (dealId: string, sellerId: string) => {
    let nextSeller: Seller;
    if (sellerId === "master-admin") {
      nextSeller = {
        id: "master-admin",
        name: "Master Admin",
        role: "Master Admin",
        avatar: "",
        initials: "MA",
        color: "from-emerald-600 to-teal-500",
      };
    } else {
      const agent = agents.find((a) => a.id === sellerId);
      if (!agent) return;
      nextSeller = {
        id: agent.id,
        name: agent.name,
        role: "Atendente",
        avatar: "",
        initials: agent.initials,
        color: agent.color,
      };
    }

    updateDealById(dealId, (d) => ({
      ...d,
      seller: nextSeller,
      timeline: [
        {
          id: `ev-assign-${Date.now()}`,
          title: `Atendimento transferido para ${nextSeller.name}`,
          description: "Alteração de responsável pelo Admin",
          timestamp: "Agora mesmo",
          type: "stage",
        },
        ...d.timeline,
      ],
    }));
  };

  const handleOpenDeal360 = (
    deal: Deal,
    defaultTab: "notes" | "tasks" | "whatsapp" = "whatsapp"
  ) => {
    setSelectedDealId(deal.id);
    setSlideOverTab(defaultTab);
    if (defaultTab === "whatsapp" && deal.unreadCount !== 0) {
      updateDealById(deal.id, (d) => ({ ...d, unreadCount: 0 }));
    }
  };

  // Movimentação de Card no Kanban (zera dias estagnados e adiciona evento na timeline)
  const handleMoveDeal = (dealId: string, targetStage: StageId) => {
    const stageTitle =
      KANBAN_STAGES.find((s) => s.id === targetStage)?.title || targetStage;

    updateDealById(dealId, (d) => {
      if (d.stage === targetStage) return d;
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
    });
  };

  const handleToggleTask = (dealId: string, taskId: string) => {
    updateDealById(dealId, (d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const handleAddTask = (dealId: string, newTask: DealTask) => {
    updateDealById(dealId, (d) => ({
      ...d,
      tasks: [newTask, ...d.tasks],
    }));
  };

  const handleSaveNotes = (dealId: string, htmlNotes: string) => {
    updateDealById(dealId, (d) => ({ ...d, notes: htmlNotes }));
  };

  const handleAddTag = (dealId: string, tag: string) => {
    updateDealById(dealId, (d) =>
      d.tags.includes(tag) ? d : { ...d, tags: [...d.tags, tag] }
    );
  };

  const handleAddMessage = (dealId: string, msg: ChatMessage) => {
    updateDealById(dealId, (d) => ({
      ...d,
      unreadCount:
        msg.sender === "me" ? 0 : (d.unreadCount ?? 0) + 1,
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
    }));
  };

  const handleCreateNewDeal = (newDeal: Deal) => {
    const dealWithOwner: Deal =
      user?.mode === "agent" && user.agentId
        ? {
            ...newDeal,
            seller: {
              id: user.agentId,
              name: user.name,
              role: "Atendente",
              avatar: "",
              initials: user.initials,
              color: user.color || "from-sky-500 to-indigo-500",
            },
          }
        : newDeal;
    setDeals((prev) => [dealWithOwner, ...prev]);
    syncAgentDealToServer(dealWithOwner);
    setSelectedDealId(dealWithOwner.id);
    setSlideOverTab("whatsapp");
  };

  const handleUpdateDeal = (dealId: string, patch: Partial<Deal>) => {
    updateDealById(dealId, (d) => ({ ...d, ...patch }));
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
        userMode={user.mode}
        agentsCount={agents.length}
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
              isDemo={user.mode === "demo"}
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
              agents={user.mode === "master" ? agents : []}
              onAssignAgent={
                user.mode === "master" ? handleAssignAgent : undefined
              }
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

          {activeTab === "agents" && user.mode === "master" && (
            <AgentsManager
              agents={agents}
              deals={deals}
              onCreateAgent={handleCreateAgent}
              onDeleteAgent={handleDeleteAgent}
            />
          )}

          {activeTab === "integrations" && user.mode !== "agent" && (
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
          {user.mode !== "agent" && (
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
          )}
        </nav>
      </div>

      {/* Slide-Over 360º Client & WhatsApp Chat */}
      <Client360SlideOver
        deal={selectedDeal}
        initialTab={slideOverTab}
        onClose={() => setSelectedDealId(null)}
        evolutionConfig={evolutionConfig}
        onUpdateStage={handleMoveDeal}
        onUpdateDeal={handleUpdateDeal}
        agents={user.mode === "master" ? agents : []}
        onAssignAgent={user.mode === "master" ? handleAssignAgent : undefined}
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
