import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  AgentAccount,
  CompanyAccount,
  Deal,
  EvolutionConfig,
  ManagerAccount,
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
}

type WorkspacesMap = Record<string, WorkspaceData>;

const DEFAULT_COMPANY_ID = "company-default";
const DATA_DIR = path.join(process.cwd(), ".data");
const COMPANIES_FILE = path.join(DATA_DIR, "companies.json");
const MANAGERS_FILE = path.join(DATA_DIR, "managers.json");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");
const WORKSPACES_FILE = path.join(DATA_DIR, "workspaces.json");
const LEGACY_WORKSPACE_FILE = path.join(DATA_DIR, "workspace.json");

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

export function createCompany(input: {
  name: string;
  document?: string;
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

export function findEvolutionConfigByInstance(
  instanceName: string
): EvolutionConfig | null {
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
