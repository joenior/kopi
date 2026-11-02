export type UserRole = 'customer' | 'staff' | 'owner';

export type OrderStatus = 'baru' | 'diproses' | 'siap' | 'selesai' | 'dibatalkan';
export type OrderType = 'dine' | 'takeaway';
export type PaymentMethod = 'tunai' | 'qris' | 'transfer';
export type PaymentStatus = 'menunggu_pembayaran' | 'lunas';

export interface CafeProfile {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
}

export interface StaffMembership {
  id: string;
  cafe_id: string;
  user_id: string;
  email?: string;
  role: 'staff' | 'owner';
  display_name?: string;
  created_at: string;
}

export interface TableQR {
  id: string;
  cafe_id: string;
  table_number: string;
  qr_token: string;
  is_active: boolean;
}

export interface OrderStatusLog {
  id: string;
  order_id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  changed_by?: string;
  reason?: string;
  created_at: string;
}

export interface Category {
  id: string;
  cafe_id?: string;
  name: string;
  display_order?: number;
}

export interface MenuItem {
  id: string;
  cafe_id?: string;
  category_id?: string;
  category: string;
  name: string;
  description: string;
  price: number;
  emoji?: string;
  icon?: string;
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
  cafe_id?: string;
  order_number?: number;
  customer_name: string;
  order_type: OrderType;
  table_number: string | null;
  notes: string;
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod | null;
  cancellation_reason?: string | null;
  access_token?: string;
  device_id?: string;
  created_at: string;
  updated_at?: string;
  items?: Record<string, number>;
  order_items?: OrderItem[];
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
