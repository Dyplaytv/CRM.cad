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
}

export interface AuthUser {
  username: string;
  name: string;
  role: string;
  initials: string;
  mode: "demo" | "master" | "agent";
  agentId?: string;
  color?: string;
}

export interface AgentAccount {
  id: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  active: boolean;
  createdAt: string;
}
