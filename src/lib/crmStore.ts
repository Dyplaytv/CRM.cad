import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  AgentAccount,
  CompanyAccount,
  CompanyAutomationConfig,
  Deal,
  EvolutionConfig,
  FirstContactConfig,
  GlobalEvolutionServer,
  ManagerAccount,
  Seller,
  VirtualAgentConfig,
} from "@/types/crm";

interface StoredAgent extends AgentAccount {
  companyId: string;
  passwordHash: string;
}

interface StoredManager extends ManagerAccount {
  passwordHash: string;
}

interface WorkspaceData {
  deals: Deal[];
  evolutionConfig: EvolutionConfig | null;
  virtualAgent?: VirtualAgentConfig;
  firstContact?: FirstContactConfig;
}

type WorkspacesMap = Record<string, WorkspaceData>;

const DEFAULT_COMPANY_ID = "company-default";
const DATA_DIR = path.join(process.cwd(), ".data");
const COMPANIES_FILE = path.join(DATA_DIR, "companies.json");
const MANAGERS_FILE = path.join(DATA_DIR, "managers.json");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");
const WORKSPACES_FILE = path.join(DATA_DIR, "workspaces.json");
const LEGACY_WORKSPACE_FILE = path.join(DATA_DIR, "workspace.json");
const MASTER_EVOLUTION_FILE = path.join(DATA_DIR, "master-evolution.json");

const AVATAR_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
];

const globalForCrm = globalThis as unknown as {
  __nexusCompanies?: CompanyAccount[];
  __nexusManagers?: StoredManager[];
  __nexusAgents?: StoredAgent[];
  __nexusWorkspaces?: WorkspacesMap;
  __nexusMasterEvolution?: GlobalEvolutionServer;
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return (
    hash.length === derived.length &&
    crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(derived))
  );
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// --- Companies ---

function loadCompanies(): CompanyAccount[] {
  if (globalForCrm.__nexusCompanies) return globalForCrm.__nexusCompanies;
  try {
    if (fs.existsSync(COMPANIES_FILE)) {
      const raw = fs.readFileSync(COMPANIES_FILE, "utf-8");
      const parsed = JSON.parse(raw) as CompanyAccount[];
      if (Array.isArray(parsed)) {
        globalForCrm.__nexusCompanies = parsed;
        return parsed;
      }
    }
  } catch {}

  const defaultCompany: CompanyAccount = {
    id: DEFAULT_COMPANY_ID,
    name: "Empresa Principal",
    document: "",
    instanceName: "nexus-master-01",
    active: true,
    createdAt: new Date().toISOString(),
  };
  globalForCrm.__nexusCompanies = [defaultCompany];
  saveCompanies(globalForCrm.__nexusCompanies);
  return globalForCrm.__nexusCompanies;
}

function saveCompanies(companies: CompanyAccount[]) {
  globalForCrm.__nexusCompanies = companies;
  try {
    ensureDataDir();
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2), "utf-8");
  } catch {}
}

export function listCompanies(): CompanyAccount[] {
  return loadCompanies();
}

export function getCompanyById(id: string): CompanyAccount | undefined {
  return loadCompanies().find((c) => c.id === id);
}

function buildInstanceSlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `nexus-${slug || "emp"}-${suffix}`;
}

export function getCompanyInstanceName(companyId = DEFAULT_COMPANY_ID): string {
  if (companyId === DEFAULT_COMPANY_ID) {
    const ws = loadWorkspaces()[DEFAULT_COMPANY_ID]?.evolutionConfig;
    return ws?.instanceName?.trim() || "nexus-master-01";
  }
  const comp = getCompanyById(companyId);
  if (comp?.instanceName) return comp.instanceName;
  const ws = loadWorkspaces()[companyId]?.evolutionConfig;
  if (ws?.instanceName?.trim()) return ws.instanceName.trim();
  return `nexus-${companyId.replace(/[^a-zA-Z0-9]/g, "").slice(-8)}`;
}

export function createCompany(input: {
  name: string;
  document?: string;
  aiAssistantEnabled?: boolean;
}): { ok: true; company: CompanyAccount } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Informe o nome da empresa." };
  }
  const companies = loadCompanies();
  if (companies.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "Já existe uma empresa com este nome." };
  }
  const company: CompanyAccount = {
    id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    document: (input.document || "").trim(),
    instanceName: buildInstanceSlug(name),
    aiAssistantEnabled: Boolean(input.aiAssistantEnabled),
    active: true,
    createdAt: new Date().toISOString(),
  };
  saveCompanies([...companies, company]);
  return { ok: true, company };
}

export function toggleCompanyActive(id: string): CompanyAccount | null {
  const companies = loadCompanies();
  let updatedItem: CompanyAccount | null = null;
  const next = companies.map((c) => {
    if (c.id !== id) return c;
    updatedItem = { ...c, active: !c.active };
    return updatedItem;
  });
  if (updatedItem) saveCompanies(next);
  return updatedItem;
}

export function toggleCompanyAiAssistant(id: string): CompanyAccount | null {
  const companies = loadCompanies();
  let updatedItem: CompanyAccount | null = null;
  const next = companies.map((c) => {
    if (c.id !== id) return c;
    updatedItem = { ...c, aiAssistantEnabled: !c.aiAssistantEnabled };
    return updatedItem;
  });
  if (updatedItem) saveCompanies(next);
  return updatedItem;
}

export function updateCompany(
  id: string,
  input: { name: string; document?: string }
): { ok: true; company: CompanyAccount } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Informe o nome da empresa." };
  }
  const companies = loadCompanies();
  if (
    companies.some(
      (c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return { ok: false, error: "Já existe outra empresa com este nome." };
  }
  let updated: CompanyAccount | null = null;
  const next = companies.map((c) => {
    if (c.id !== id) return c;
    updated = {
      ...c,
      name,
      document:
        input.document !== undefined ? input.document.trim() : c.document,
    };
    return updated;
  });
  if (!updated) {
    return { ok: false, error: "Empresa não encontrada." };
  }
  saveCompanies(next);
  // Atualiza companyName nos gerentes vinculados
  const managers = loadManagers();
  let managersChanged = false;
  const nextManagers = managers.map((m) => {
    if (m.companyId !== id) return m;
    managersChanged = true;
    return { ...m, companyName: name };
  });
  if (managersChanged) saveManagers(nextManagers);
  return { ok: true, company: updated };
}

export function deleteCompany(id: string): boolean {
  const companies = loadCompanies();
  const next = companies.filter((c) => c.id !== id);
  if (next.length === companies.length) return false;
  saveCompanies(next);
  saveManagers(loadManagers().filter((m) => m.companyId !== id));
  saveAgents(loadAgents().filter((a) => a.companyId !== id));
  const ws = loadWorkspaces();
  delete ws[id];
  saveWorkspaces(ws);
  return true;
}

// --- Managers (Gerentes) ---

function loadManagers(): StoredManager[] {
  if (globalForCrm.__nexusManagers) return globalForCrm.__nexusManagers;
  try {
    if (fs.existsSync(MANAGERS_FILE)) {
      const raw = fs.readFileSync(MANAGERS_FILE, "utf-8");
      const parsed = JSON.parse(raw) as StoredManager[];
      if (Array.isArray(parsed)) {
        globalForCrm.__nexusManagers = parsed;
        return parsed;
      }
    }
  } catch {}
  globalForCrm.__nexusManagers = [];
  return globalForCrm.__nexusManagers;
}

function saveManagers(managers: StoredManager[]) {
  globalForCrm.__nexusManagers = managers;
  try {
    ensureDataDir();
    fs.writeFileSync(MANAGERS_FILE, JSON.stringify(managers, null, 2), "utf-8");
  } catch {}
}

function toPublicManager(m: StoredManager): ManagerAccount {
  const company = getCompanyById(m.companyId);
  return {
    id: m.id,
    companyId: m.companyId,
    companyName: company?.name || m.companyName,
    name: m.name,
    username: m.username,
    initials: m.initials,
    color: m.color,
    active: m.active,
    createdAt: m.createdAt,
  };
}

export function listManagers(): ManagerAccount[] {
  return loadManagers().map(toPublicManager);
}

function isUsernameTaken(username: string): boolean {
  const normalized = username.trim().toLowerCase();
  if (
    normalized === "admin07" ||
    normalized === "master admin07" ||
    normalized === "lucas.demo"
  ) {
    return true;
  }
  if (loadManagers().some((m) => m.username.toLowerCase() === normalized)) {
    return true;
  }
  if (loadAgents().some((a) => a.username.toLowerCase() === normalized)) {
    return true;
  }
  return false;
}

export function createManager(input: {
  companyId: string;
  name: string;
  username: string;
  password: string;
}): { ok: true; manager: ManagerAccount } | { ok: false; error: string } {
  const company = getCompanyById(input.companyId);
  if (!company) {
    return { ok: false, error: "Empresa selecionada não encontrada." };
  }
  const name = input.name.trim();
  const username = input.username.trim();
  const password = input.password;

  if (!name || !username || !password) {
    return { ok: false, error: "Preencha nome, login e senha do gerente." };
  }
  if (password.length < 4) {
    return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
  }
  if (isUsernameTaken(username)) {
    return { ok: false, error: "Este login já está em uso." };
  }

  const managers = loadManagers();
  const manager: StoredManager = {
    id: `mgr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    companyId: company.id,
    companyName: company.name,
    name,
    username,
    initials: computeInitials(name),
    color: AVATAR_COLORS[managers.length % AVATAR_COLORS.length],
    active: true,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };
  saveManagers([...managers, manager]);
  return { ok: true, manager: toPublicManager(manager) };
}

export function deleteManager(id: string): boolean {
  const managers = loadManagers();
  const next = managers.filter((m) => m.id !== id);
  if (next.length === managers.length) return false;
  saveManagers(next);
  return true;
}

export function updateManager(
  id: string,
  input: {
    companyId: string;
    name: string;
    username: string;
    password?: string;
  }
): { ok: true; manager: ManagerAccount } | { ok: false; error: string } {
  const company = getCompanyById(input.companyId);
  if (!company) {
    return { ok: false, error: "Empresa selecionada não encontrada." };
  }
  const name = input.name.trim();
  const username = input.username.trim();
  if (!name || !username) {
    return { ok: false, error: "Nome e login são obrigatórios." };
  }
  if (input.password && input.password.length < 4) {
    return { ok: false, error: "A nova senha deve ter pelo menos 4 caracteres." };
  }

  const normalized = username.toLowerCase();
  if (
    normalized === "admin07" ||
    normalized === "master admin07" ||
    normalized === "lucas.demo"
  ) {
    return { ok: false, error: "Este login é reservado pelo sistema." };
  }

  const managers = loadManagers();
  if (
    managers.some(
      (m) => m.id !== id && m.username.toLowerCase() === normalized
    ) ||
    loadAgents().some((a) => a.username.toLowerCase() === normalized)
  ) {
    return { ok: false, error: "Este login já está em uso." };
  }

  let updated: StoredManager | null = null;
  const next = managers.map((m) => {
    if (m.id !== id) return m;
    updated = {
      ...m,
      companyId: company.id,
      companyName: company.name,
      name,
      username,
      initials: computeInitials(name),
      passwordHash: input.password
        ? hashPassword(input.password)
        : m.passwordHash,
    };
    return updated;
  });

  if (!updated) {
    return { ok: false, error: "Gerente não encontrado." };
  }
  saveManagers(next);
  return { ok: true, manager: toPublicManager(updated) };
}

export function verifyManagerCredentials(
  username: string,
  password: string
): ManagerAccount | null {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) return null;
  const found = loadManagers().find(
    (m) => m.active && m.username.toLowerCase() === normalized
  );
  if (!found) return null;
  const company = getCompanyById(found.companyId);
  if (company && !company.active) return null;
  if (!verifyPassword(password, found.passwordHash)) return null;
  return toPublicManager(found);
}

// --- Agents (Atendentes) ---

function loadAgents(): StoredAgent[] {
  if (globalForCrm.__nexusAgents) return globalForCrm.__nexusAgents;
  try {
    if (fs.existsSync(AGENTS_FILE)) {
      const raw = fs.readFileSync(AGENTS_FILE, "utf-8");
      const parsed = JSON.parse(raw) as StoredAgent[];
      if (Array.isArray(parsed)) {
        globalForCrm.__nexusAgents = parsed.map((a) => ({
          ...a,
          companyId: a.companyId || DEFAULT_COMPANY_ID,
        }));
        return globalForCrm.__nexusAgents;
      }
    }
  } catch {}
  globalForCrm.__nexusAgents = [];
  return globalForCrm.__nexusAgents;
}

function saveAgents(agents: StoredAgent[]) {
  globalForCrm.__nexusAgents = agents;
  try {
    ensureDataDir();
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), "utf-8");
  } catch {}
}

function toPublicAgent(agent: StoredAgent): AgentAccount {
  return {
    id: agent.id,
    companyId: agent.companyId || DEFAULT_COMPANY_ID,
    name: agent.name,
    username: agent.username,
    initials: agent.initials,
    color: agent.color,
    active: agent.active,
    createdAt: agent.createdAt,
  };
}

export function listAgents(companyId?: string): AgentAccount[] {
  const all = loadAgents();
  const filtered = companyId
    ? all.filter((a) => (a.companyId || DEFAULT_COMPANY_ID) === companyId)
    : all;
  return filtered.map(toPublicAgent);
}

export function createAgent(input: {
  companyId?: string;
  name: string;
  username: string;
  password: string;
}): { ok: true; agent: AgentAccount } | { ok: false; error: string } {
  const companyId = input.companyId || DEFAULT_COMPANY_ID;
  const name = input.name.trim();
  const username = input.username.trim();
  const password = input.password;

  if (!name || !username || !password) {
    return { ok: false, error: "Preencha nome, login e senha do atendente." };
  }
  if (password.length < 4) {
    return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
  }
  if (isUsernameTaken(username)) {
    return { ok: false, error: "Este login já está em uso." };
  }

  const agents = loadAgents();
  const newAgent: StoredAgent = {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    companyId,
    name,
    username,
    initials: computeInitials(name),
    color: AVATAR_COLORS[agents.length % AVATAR_COLORS.length],
    active: true,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };

  saveAgents([...agents, newAgent]);
  return { ok: true, agent: toPublicAgent(newAgent) };
}

export function deleteAgent(id: string, companyId?: string): boolean {
  const agents = loadAgents();
  const next = agents.filter(
    (a) => !(a.id === id && (!companyId || a.companyId === companyId))
  );
  if (next.length === agents.length) return false;
  saveAgents(next);
  return true;
}

export function verifyAgentCredentials(
  username: string,
  password: string
): AgentAccount | null {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) return null;
  const agents = loadAgents();
  const found = agents.find(
    (a) => a.active && a.username.toLowerCase() === normalized
  );
  if (!found) return null;
  const company = getCompanyById(found.companyId || DEFAULT_COMPANY_ID);
  if (company && !company.active) return null;
  if (!verifyPassword(password, found.passwordHash)) return null;
  return toPublicAgent(found);
}

// --- Workspaces (per Company) ---

function loadWorkspaces(): WorkspacesMap {
  if (globalForCrm.__nexusWorkspaces) return globalForCrm.__nexusWorkspaces;
  try {
    if (fs.existsSync(WORKSPACES_FILE)) {
      const raw = fs.readFileSync(WORKSPACES_FILE, "utf-8");
      const parsed = JSON.parse(raw) as WorkspacesMap;
      if (parsed && typeof parsed === "object") {
        globalForCrm.__nexusWorkspaces = parsed;
        return parsed;
      }
    }
    // Migrar workspace.json legado para company-default
    if (fs.existsSync(LEGACY_WORKSPACE_FILE)) {
      const raw = fs.readFileSync(LEGACY_WORKSPACE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<WorkspaceData>;
      const migrated: WorkspacesMap = {
        [DEFAULT_COMPANY_ID]: {
          deals: Array.isArray(parsed.deals) ? parsed.deals : [],
          evolutionConfig: parsed.evolutionConfig ?? null,
        },
      };
      globalForCrm.__nexusWorkspaces = migrated;
      saveWorkspaces(migrated);
      return migrated;
    }
  } catch {}
  globalForCrm.__nexusWorkspaces = {};
  return globalForCrm.__nexusWorkspaces;
}

function saveWorkspaces(data: WorkspacesMap) {
  globalForCrm.__nexusWorkspaces = data;
  try {
    ensureDataDir();
    fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export function getWorkspaceDeals(companyId = DEFAULT_COMPANY_ID): Deal[] {
  return loadWorkspaces()[companyId]?.deals || [];
}

export function setWorkspaceDeals(companyId: string, deals: Deal[]) {
  const all = loadWorkspaces();
  const current = all[companyId] || { deals: [], evolutionConfig: null };
  saveWorkspaces({ ...all, [companyId]: { ...current, deals } });
}

export function upsertWorkspaceDeal(companyId: string, deal: Deal) {
  const all = loadWorkspaces();
  const current = all[companyId] || { deals: [], evolutionConfig: null };
  const exists = current.deals.some((d) => d.id === deal.id);
  const nextDeals = exists
    ? current.deals.map((d) => (d.id === deal.id ? deal : d))
    : [deal, ...current.deals];
  saveWorkspaces({ ...all, [companyId]: { ...current, deals: nextDeals } });
}

export function getWorkspaceEvolutionConfig(
  companyId = DEFAULT_COMPANY_ID
): EvolutionConfig | null {
  return loadWorkspaces()[companyId]?.evolutionConfig || null;
}

export function setWorkspaceEvolutionConfig(
  companyId: string,
  evolutionConfig: EvolutionConfig
) {
  const all = loadWorkspaces();
  const current = all[companyId] || { deals: [], evolutionConfig: null };
  saveWorkspaces({ ...all, [companyId]: { ...current, evolutionConfig } });
}

export const VIRTUAL_AGENT_SELLER_ID = "ai-virtual";

export const DEFAULT_VIRTUAL_AGENT_CONFIG: VirtualAgentConfig = {
  enabled: false,
  name: "Assistente Virtual (IA)",
  openAiApiKey: "",
  model: "gpt-4o-mini",
  knowledgeBase: "",
};

export const DEFAULT_FIRST_CONTACT_CONFIG: FirstContactConfig = {
  mode: "manager",
  specificAgentId: "",
  roundRobinIndex: 0,
};

export function findCompanyIdByInstance(instanceName: string): string {
  const target = instanceName.trim().toLowerCase();
  if (!target) return DEFAULT_COMPANY_ID;
  const companies = loadCompanies();
  for (const c of companies) {
    if (getCompanyInstanceName(c.id).toLowerCase() === target) {
      return c.id;
    }
  }
  return DEFAULT_COMPANY_ID;
}

export function getCompanyAutomationConfig(
  companyId = DEFAULT_COMPANY_ID
): CompanyAutomationConfig {
  const company = getCompanyById(companyId);
  const ws = loadWorkspaces()[companyId];
  return {
    aiAllowedByMaster: Boolean(company?.aiAssistantEnabled),
    virtualAgent: {
      ...DEFAULT_VIRTUAL_AGENT_CONFIG,
      ...(ws?.virtualAgent || {}),
    },
    firstContact: {
      ...DEFAULT_FIRST_CONTACT_CONFIG,
      ...(ws?.firstContact || {}),
    },
  };
}

export function setCompanyAutomationConfig(
  companyId: string,
  input: {
    virtualAgent?: Partial<VirtualAgentConfig>;
    firstContact?: Partial<FirstContactConfig>;
  }
): CompanyAutomationConfig {
  const all = loadWorkspaces();
  const current = all[companyId] || { deals: [], evolutionConfig: null };
  const existingAuto = getCompanyAutomationConfig(companyId);

  const nextVirtualAgent: VirtualAgentConfig = input.virtualAgent
    ? {
        ...existingAuto.virtualAgent,
        ...input.virtualAgent,
        name:
          (input.virtualAgent.name ?? existingAuto.virtualAgent.name).trim() ||
          DEFAULT_VIRTUAL_AGENT_CONFIG.name,
        openAiApiKey: (
          input.virtualAgent.openAiApiKey ??
          existingAuto.virtualAgent.openAiApiKey
        ).trim(),
        model:
          (input.virtualAgent.model ?? existingAuto.virtualAgent.model).trim() ||
          DEFAULT_VIRTUAL_AGENT_CONFIG.model,
      }
    : existingAuto.virtualAgent;

  const nextFirstContact: FirstContactConfig = input.firstContact
    ? {
        ...existingAuto.firstContact,
        ...input.firstContact,
      }
    : existingAuto.firstContact;

  saveWorkspaces({
    ...all,
    [companyId]: {
      ...current,
      virtualAgent: nextVirtualAgent,
      firstContact: nextFirstContact,
    },
  });

  return getCompanyAutomationConfig(companyId);
}

export function buildVirtualAgentSeller(name?: string): Seller {
  return {
    id: VIRTUAL_AGENT_SELLER_ID,
    name: (name || DEFAULT_VIRTUAL_AGENT_CONFIG.name).trim(),
    role: "Atendente Virtual (IA)",
    avatar: "",
    initials: "IA",
    color: "from-violet-500 to-fuchsia-500",
  };
}

export function resolveFirstContactSeller(companyId = DEFAULT_COMPANY_ID): Seller {
  const auto = getCompanyAutomationConfig(companyId);
  const companyManagers = listManagers().filter(
    (m) => m.companyId === companyId && m.active
  );
  const defaultManager: Seller = companyManagers[0]
    ? {
        id: companyManagers[0].id,
        name: companyManagers[0].name,
        role: "Gerente",
        avatar: "",
        initials: companyManagers[0].initials,
        color: companyManagers[0].color,
      }
    : {
        id: "manager-default",
        name: "Gerente",
        role: "Gerente",
        avatar: "",
        initials: "GE",
        color: "from-indigo-500 to-violet-500",
      };

  const activeAgents = listAgents(companyId).filter((a) => a.active);
  const mode = auto.firstContact.mode;

  if (mode === "specific_agent") {
    const targetId = auto.firstContact.specificAgentId;
    if (
      targetId === VIRTUAL_AGENT_SELLER_ID &&
      auto.aiAllowedByMaster &&
      auto.virtualAgent.enabled
    ) {
      return buildVirtualAgentSeller(auto.virtualAgent.name);
    }
    const found = activeAgents.find((a) => a.id === targetId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        role: "Atendente",
        avatar: "",
        initials: found.initials,
        color: found.color,
      };
    }
    return defaultManager;
  }

  if (mode === "round_robin") {
    if (activeAgents.length === 0) {
      return defaultManager;
    }
    const currentIndex = auto.firstContact.roundRobinIndex || 0;
    const chosen = activeAgents[currentIndex % activeAgents.length];
    const nextIndex = (currentIndex + 1) % activeAgents.length;
    setCompanyAutomationConfig(companyId, {
      firstContact: {
        ...auto.firstContact,
        roundRobinIndex: nextIndex,
      },
    });
    return {
      id: chosen.id,
      name: chosen.name,
      role: "Atendente",
      avatar: "",
      initials: chosen.initials,
      color: chosen.color,
    };
  }

  return defaultManager;
}

export function getGlobalEvolutionServer(): GlobalEvolutionServer {
  if (globalForCrm.__nexusMasterEvolution) {
    return globalForCrm.__nexusMasterEvolution;
  }
  try {
    if (fs.existsSync(MASTER_EVOLUTION_FILE)) {
      const raw = fs.readFileSync(MASTER_EVOLUTION_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<GlobalEvolutionServer>;
      globalForCrm.__nexusMasterEvolution = {
        baseUrl: (parsed.baseUrl || "").trim(),
        apiKey: (parsed.apiKey || "").trim(),
        webhookUrl: (parsed.webhookUrl || "").trim(),
      };
      return globalForCrm.__nexusMasterEvolution;
    }
  } catch {}

  // Migra automaticamente a configuração da empresa padrão se existir
  const legacyEvo = loadWorkspaces()[DEFAULT_COMPANY_ID]?.evolutionConfig;
  const migrated: GlobalEvolutionServer = {
    baseUrl: legacyEvo?.baseUrl?.trim() || "",
    apiKey: legacyEvo?.apiKey?.trim() || "",
    webhookUrl: legacyEvo?.webhookUrl?.trim() || "",
  };
  globalForCrm.__nexusMasterEvolution = migrated;
  if (migrated.baseUrl || migrated.apiKey) {
    setGlobalEvolutionServer(migrated);
  }
  return migrated;
}

export function setGlobalEvolutionServer(server: GlobalEvolutionServer) {
  const normalized: GlobalEvolutionServer = {
    baseUrl: (server.baseUrl || "").trim().replace(/\/+$/, ""),
    apiKey: (server.apiKey || "").trim(),
    webhookUrl: (server.webhookUrl || "").trim(),
  };
  globalForCrm.__nexusMasterEvolution = normalized;
  try {
    ensureDataDir();
    fs.writeFileSync(
      MASTER_EVOLUTION_FILE,
      JSON.stringify(normalized, null, 2),
      "utf-8"
    );
  } catch {}
}

export function findEvolutionConfigByInstance(
  instanceName: string
): EvolutionConfig | null {
  const globalServer = getGlobalEvolutionServer();
  if (globalServer.baseUrl && globalServer.apiKey) {
    return {
      baseUrl: globalServer.baseUrl,
      apiKey: globalServer.apiKey,
      instanceName: instanceName.trim(),
      webhookUrl: globalServer.webhookUrl,
      status: "connected",
    };
  }
  const all = loadWorkspaces();
  const target = instanceName.trim().toLowerCase();
  for (const ws of Object.values(all)) {
    if (
      ws.evolutionConfig?.instanceName?.trim().toLowerCase() === target &&
      ws.evolutionConfig.baseUrl &&
      ws.evolutionConfig.apiKey
    ) {
      return ws.evolutionConfig;
    }
  }
  return all[DEFAULT_COMPANY_ID]?.evolutionConfig || null;
}

export function getMasterOverviewStats() {
  const companies = loadCompanies();
  const managers = listManagers();
  const agents = listAgents();
  const workspaces = loadWorkspaces();

  const perCompany = companies.map((c) => {
    const wsDeals = workspaces[c.id]?.deals || [];
    return {
      companyId: c.id,
      managersCount: managers.filter((m) => m.companyId === c.id).length,
      agentsCount: agents.filter((a) => a.companyId === c.id).length,
      dealsCount: wsDeals.length,
      pipelineValue: wsDeals.reduce((sum, d) => sum + (d.value || 0), 0),
    };
  });

  return {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((c) => c.active).length,
    totalManagers: managers.length,
    totalAgents: agents.length,
    totalDeals: perCompany.reduce((s, c) => s + c.dealsCount, 0),
    totalPipelineValue: perCompany.reduce((s, c) => s + c.pipelineValue, 0),
    perCompany,
  };
}
