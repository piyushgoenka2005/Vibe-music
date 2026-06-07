export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  email: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt?: string;
}
