import fs from "fs";
import path from "path";
import crypto from "crypto";
import { AgentAccount, Deal, EvolutionConfig } from "@/types/crm";

interface StoredAgent extends AgentAccount {
  passwordHash: string;
}

interface WorkspaceData {
  deals: Deal[];
  evolutionConfig: EvolutionConfig | null;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");
const WORKSPACE_FILE = path.join(DATA_DIR, "workspace.json");

const AGENT_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
];

const globalForCrm = globalThis as unknown as {
  __nexusAgents?: StoredAgent[];
  __nexusWorkspace?: WorkspaceData;
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
  if (parts.length === 0) return "AT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function loadAgents(): StoredAgent[] {
  if (globalForCrm.__nexusAgents) return globalForCrm.__nexusAgents;
  try {
    if (fs.existsSync(AGENTS_FILE)) {
      const raw = fs.readFileSync(AGENTS_FILE, "utf-8");
      const parsed = JSON.parse(raw) as StoredAgent[];
      if (Array.isArray(parsed)) {
        globalForCrm.__nexusAgents = parsed;
        return parsed;
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
    name: agent.name,
    username: agent.username,
    initials: agent.initials,
    color: agent.color,
    active: agent.active,
    createdAt: agent.createdAt,
  };
}

export function listAgents(): AgentAccount[] {
  return loadAgents().map(toPublicAgent);
}

export function createAgent(input: {
  name: string;
  username: string;
  password: string;
}): { ok: true; agent: AgentAccount } | { ok: false; error: string } {
  const name = input.name.trim();
  const username = input.username.trim();
  const password = input.password;

  if (!name || !username || !password) {
    return { ok: false, error: "Preencha nome, login e senha do atendente." };
  }
  if (password.length < 4) {
    return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
  }

  const normalized = username.toLowerCase();
  if (
    normalized === "admin07" ||
    normalized === "master admin07" ||
    normalized === "lucas.demo"
  ) {
    return { ok: false, error: "Este login é reservado pelo sistema." };
  }

  const agents = loadAgents();
  if (agents.some((a) => a.username.toLowerCase() === normalized)) {
    return { ok: false, error: "Já existe um atendente com este login." };
  }

  const newAgent: StoredAgent = {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    username,
    initials: computeInitials(name),
    color: AGENT_COLORS[agents.length % AGENT_COLORS.length],
    active: true,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };

  const updated = [...agents, newAgent];
  saveAgents(updated);
  return { ok: true, agent: toPublicAgent(newAgent) };
}

export function deleteAgent(id: string): boolean {
  const agents = loadAgents();
  const next = agents.filter((a) => a.id !== id);
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
  if (!verifyPassword(password, found.passwordHash)) return null;
  return toPublicAgent(found);
}

function loadWorkspace(): WorkspaceData {
  if (globalForCrm.__nexusWorkspace) return globalForCrm.__nexusWorkspace;
  try {
    if (fs.existsSync(WORKSPACE_FILE)) {
      const raw = fs.readFileSync(WORKSPACE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<WorkspaceData>;
      globalForCrm.__nexusWorkspace = {
        deals: Array.isArray(parsed.deals) ? parsed.deals : [],
        evolutionConfig: parsed.evolutionConfig ?? null,
      };
      return globalForCrm.__nexusWorkspace;
    }
  } catch {}
  globalForCrm.__nexusWorkspace = { deals: [], evolutionConfig: null };
  return globalForCrm.__nexusWorkspace;
}

function saveWorkspace(data: WorkspaceData) {
  globalForCrm.__nexusWorkspace = data;
  try {
    ensureDataDir();
    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export function getWorkspaceDeals(): Deal[] {
  return loadWorkspace().deals;
}

export function setWorkspaceDeals(deals: Deal[]) {
  const current = loadWorkspace();
  saveWorkspace({ ...current, deals });
}

export function upsertWorkspaceDeal(deal: Deal) {
  const current = loadWorkspace();
  const exists = current.deals.some((d) => d.id === deal.id);
  const nextDeals = exists
    ? current.deals.map((d) => (d.id === deal.id ? deal : d))
    : [deal, ...current.deals];
  saveWorkspace({ ...current, deals: nextDeals });
}

export function getWorkspaceEvolutionConfig(): EvolutionConfig | null {
  return loadWorkspace().evolutionConfig;
}

export function setWorkspaceEvolutionConfig(evolutionConfig: EvolutionConfig) {
  const current = loadWorkspace();
  saveWorkspace({ ...current, evolutionConfig });
}
