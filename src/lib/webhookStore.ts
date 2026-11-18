import { ChatMessage, Seller } from "@/types/crm";

export interface StoredWebhookMessage {
  id: string;
  instance: string;
  remoteJid: string;
  phone: string;
  pushName: string;
  text: string;
  fromMe: boolean;
  receivedAt: number;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video" | "audio";
  fileName?: string;
  assignedSeller?: Seller;
  aiReply?: ChatMessage;
}

const globalForWebhook = globalThis as unknown as {
  __nexusWebhookMessages?: StoredWebhookMessage[];
};

function getStore(): StoredWebhookMessage[] {
  if (!globalForWebhook.__nexusWebhookMessages) {
    globalForWebhook.__nexusWebhookMessages = [];
  }
  return globalForWebhook.__nexusWebhookMessages;
}

export function pushWebhookMessage(msg: StoredWebhookMessage) {
  const store = getStore();
  if (store.some((m) => m.id === msg.id)) return;
  store.push(msg);
  if (store.length > 100) {
    store.splice(0, store.length - 100);
  }
}

export function getWebhookMessagesSince(since: number): StoredWebhookMessage[] {
  return getStore().filter((m) => m.receivedAt > since);
}
