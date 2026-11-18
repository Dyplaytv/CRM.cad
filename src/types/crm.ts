export type Priority = "Alta" | "Média" | "Baixa";

export type StageId =
  | "leads"
  | "contacted"
  | "qualification"
  | "proposal"
  | "negotiation"
  | "closed";

export interface Seller {
  id: string;
  name: string;
  role: string;
  avatar: string;
  initials: string;
  color: string;
}

export interface DealNote {
  id: string;
  author: string;
  createdAt: string;
  content: string;
}

export interface DealTask {
  id: string;
  title: string;
  dueDate: string;
  dueAt?: string;
  completed: boolean;
  priority: Priority;
  type: "call" | "email" | "whatsapp" | "meeting";
}

export interface ChatMessage {
  id: string;
  sender: "me" | "client";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video" | "audio";
  fileName?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "stage" | "note" | "whatsapp" | "proposal";
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  cnpj: string;
  city: string;
  value: number;
  stage: StageId;
  priority: Priority;
  stagnantDays: number;
  seller: Seller;
  tags: string[];
  customFields: {
    origin: string;
    segment: string;
    employees: string;
    expectedClose: string;
  };
  notes: string;
  tasks: DealTask[];
  messages: ChatMessage[];
  timeline: TimelineEvent[];
  unreadCount?: number;
}

export interface StageColumn {
  id: StageId;
  title: string;
  accent: string;
  dotColor: string;
}

export interface MonthlyRevenue {
  month: string;
  realized: number;
  forecast: number;
  dealsCount: number;
}

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  webhookUrl: string;
  status: "connected" | "disconnected" | "connecting";
  phoneConnected?: string;
  managedByMaster?: boolean;
}

export interface GlobalEvolutionServer {
  baseUrl: string;
  apiKey: string;
  webhookUrl: string;
}

export interface AuthUser {
  username: string;
  name: string;
  role: string;
  initials: string;
  mode: "demo" | "super_master" | "manager" | "agent";
  companyId?: string;
  companyName?: string;
  agentId?: string;
  color?: string;
}

export interface CompanyAccount {
  id: string;
  name: string;
  document?: string;
  instanceName?: string;
  aiAssistantEnabled?: boolean;
  active: boolean;
  createdAt: string;
}

export interface VirtualAgentConfig {
  enabled: boolean;
  name: string;
  openAiApiKey: string;
  model: string;
  knowledgeBase: string;
}

export type FirstContactMode = "manager" | "specific_agent" | "round_robin";

export interface FirstContactConfig {
  mode: FirstContactMode;
  specificAgentId?: string;
  roundRobinIndex?: number;
}

export interface CompanyAutomationConfig {
  aiAllowedByMaster: boolean;
  virtualAgent: VirtualAgentConfig;
  firstContact: FirstContactConfig;
}

export interface ManagerAccount {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  active: boolean;
  createdAt: string;
}

export interface AgentAccount {
  id: string;
  companyId?: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  active: boolean;
  createdAt: string;
}
