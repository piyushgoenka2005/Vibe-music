export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_customer"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportTicketCategory =
  | "order"
  | "shipping"
  | "returns"
  | "product"
  | "payment"
  | "other";

export interface SupportTicket {
  id: string;
  userId?: string;
  email: string;
  name: string;
  subject: string;
  message: string;
  category: SupportTicketCategory;
  orderId?: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  adminNote?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
