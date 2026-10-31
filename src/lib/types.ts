export type OrderStatus = 'baru' | 'diproses' | 'siap' | 'selesai';
export type OrderType = 'dine' | 'takeaway';

export interface Category {
  id: string;
  name: string;
  display_order?: number;
}

export interface MenuItem {
  id: string;
  category_id?: string;
  category: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  image_url?: string;
  badge?: string;
  is_available: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number?: number;
  customer_name: string;
  order_type: OrderType;
  table_number: string | null;
  notes: string;
  total_price: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  items?: Record<string, number>; // Legacy map item_id -> quantity untuk kompatibilitas proto
  order_items?: OrderItem[];      // Normalized relations dari Supabase
}

export interface CustomerForm {
  name: string;
  table: string;
  type: OrderType;
  note: string;
}

export interface SalesStat {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  dineInCount: number;
  takeawayCount: number;
  topSelling: {
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }[];
}
