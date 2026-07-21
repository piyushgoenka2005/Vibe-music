export interface Ga4Item {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
}

export interface Ga4EcommerceParams {
  currency?: string;
  value?: number;
  transaction_id?: string;
  coupon?: string;
  shipping?: number;
  tax?: number;
  items?: Ga4Item[];
  item_list_id?: string;
  item_list_name?: string;
  search_term?: string;
  payment_type?: string;
  shipping_tier?: string;
}

export type Ga4EventName =
  | "page_view"
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase"
  | "search"
  | "sign_up"
  | "login"
  | "generate_lead";
