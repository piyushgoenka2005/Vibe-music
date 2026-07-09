export type ReturnRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "received"
  | "refunded"
  | "cancelled";

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId?: string;
  email: string;
  reason: string;
  details?: string;
  status: ReturnRequestStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
