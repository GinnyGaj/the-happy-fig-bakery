export type DietaryTag = "vegetarian" | "vegan" | "gluten-free" | "nut-free";

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  dietary_tags: DietaryTag[];
  is_free_item: boolean;
  max_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenu {
  id: string;
  week_start_date: string;
  pickup_date: string | null;
  pickup_start_time: string | null;
  pickup_end_time: string | null;
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
  pickup_date: string;
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
  pickup_date: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_whatsapp: string;
  order_items: OrderItem[];
  order_subtotal: number;
  special_instructions: string | null;
  status: OrderStatus;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export type InventoryCategory =
  | "Dairy & Fresh"
  | "Dry Goods & Bulk"
  | "Spices & Flavors"
  | "Packaging & Paper"
  | "Consumables";

export type InventoryUnit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "count"
  | "tsp"
  | "tbsp"
  | "pack"
  | "roll"
  | "box";

export type StockStatus = "in_stock" | "need_to_buy" | "out_of_stock";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  low_stock_threshold: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryBatch {
  id: string;
  inventory_item_id: string;
  expense_id: string | null;
  quantity_purchased: number;
  quantity_remaining: number;
  unit_cost: number | null;
  purchase_date: string;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  vendor: string | null;
  total_cost: number;
  receipt_photo_path: string | null;
  notes: string | null;
  created_at: string;
}

export interface ExpenseItem {
  id: string;
  expense_id: string;
  inventory_item_id: string;
  inventory_batch_id: string | null;
  quantity: number;
  cost: number;
  created_at: string;
}

export interface InventoryUsageLog {
  id: string;
  inventory_item_id: string;
  quantity_used: number;
  previous_total: number;
  newly_purchased: number;
  new_total: number;
  logged_at: string;
  notes: string | null;
}

// Row shape returned by the `inventory_stock_status` view.
export interface InventoryStockStatus {
  inventory_item_id: string;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  low_stock_threshold: number;
  current_stock: number;
  status: StockStatus;
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
