import { Deal } from "@/types/crm";

export function getDealUnreadCount(deal: Deal): number {
  if (typeof deal.unreadCount === "number") {
    return Math.max(0, deal.unreadCount);
  }
  if (
    deal.messages.length > 0 &&
    deal.messages[deal.messages.length - 1].sender === "client"
  ) {
    return 1;
  }
  return 0;
}
