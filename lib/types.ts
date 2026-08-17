export type DietaryTag = "vegetarian" | "vegan" | "gluten-free" | "nut-free";

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  dietary_tags: DietaryTag[];
  is_free_item: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenu {
  id: string;
  week_start_date: string;
  menu_item_ids: string[];
  is_published: boolean;
  form_open: boolean;
  announcement_message: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockLimit {
  id: string;
  weekly_menu_id: string;
  menu_item_id: string;
  stock_limit: number;
  current_stock: number;
  updated_at: string;
}

export interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = "pending" | "ready" | "collected";

export interface Order {
  id: string;
  weekly_menu_id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_whatsapp: string;
  order_items: OrderItem[];
  order_subtotal: number;
  special_instructions: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface WhatsappSettings {
  id: string;
  collection_instructions: string | null;
  reminder_template: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  whatsapp_sender_number: string | null;
  updated_at: string;
}
