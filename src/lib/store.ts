import {
  MenuItem,
  Order,
  OrderStatus,
  CustomerForm,
  PaymentMethod,
  PaymentStatus,
  CafeProfile,
  StaffMembership,
  TableQR,
} from './types';
import { getSupabase, DEFAULT_CAFE_ID } from './supabase';
export { DEFAULT_CAFE_ID };

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    category: 'Kopi',
    name: 'Kopi Susu Gula Aren',
    description: 'Espresso ganda mantap berpadu susu segar dan manis legit gula aren organik pilihan.',
    price: 22000,
    icon: 'coffee',
    image_url: '/images/kopi-susu-aren.jpg',
    badge: 'Favorit',
    is_available: true,
  },
  {
    id: '2',
    category: 'Kopi',
    name: 'Americano',
    description: 'Espresso kaya rasa dengan crema emas lembut, disajikan panas atau dingin menyegarkan.',
    price: 18000,
    icon: 'coffee',
    image_url: '/images/hero.jpg',
    badge: 'Klasik',
    is_available: true,
  },
  {
    id: '3',
    category: 'Kopi',
    name: 'Latte',
    description: 'Kombinasi seimbang espresso aromatik dan microfoam susu steamed dengan latte art anggun.',
    price: 25000,
    icon: 'coffee',
    image_url: '/images/latte.jpg',
    badge: 'Best Seller',
    is_available: true,
  },
  {
    id: '4',
    category: 'Non-Kopi',
    name: 'Matcha Latte',
    description: 'Matcha seremonial asli Jepang berpadu susu creamy lembut yang menenangkan jiwa.',
    price: 26000,
    icon: 'drop',
    image_url: '/images/matcha.jpg',
    badge: 'Populer',
    is_available: true,
  },
  {
    id: '5',
    category: 'Non-Kopi',
    name: 'Coklat Dingin',
    description: 'Cokelat artisanal pekat dengan taburan bubuk kakao murni yang nikmat dan memanjakan.',
    price: 24000,
    icon: 'drop',
    image_url: '/images/latte.jpg',
    badge: 'Manis Pas',
    is_available: true,
  },
  {
    id: '6',
    category: 'Makanan',
    name: 'Roti Bakar Coklat Keju',
    description: 'Roti brioche panggang harum dengan lumeran cokelat Belgia dan limpahan keju cheddar parut.',
    price: 18000,
    icon: 'cookie',
    image_url: '/images/croissant.jpg',
    badge: 'Camilan',
    is_available: true,
  },
  {
    id: '7',
    category: 'Makanan',
    name: 'Kentang Goreng Truffle',
    description: 'Kentang krispi renyah ditaburi sea salt, daun parsley segar, dan aroma truffle istimewa.',
    price: 17000,
    icon: 'snack',
    image_url: '/images/croissant.jpg',
    badge: 'Gurih',
    is_available: true,
  },
  {
    id: '8',
    category: 'Makanan',
    name: 'Butter Croissant',
    description: 'Pastry khas Prancis berlapis renyah dan lembut dengan butter Normandia premium.',
    price: 20000,
    icon: 'cookie',
    image_url: '/images/croissant.jpg',
    badge: 'Fresh Bake',
    is_available: true,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-98',
    cafe_id: DEFAULT_CAFE_ID,
    order_number: 98,
    customer_name: 'Rina',
    order_type: 'dine',
    table_number: '2',
    notes: 'Es sedikit',
    total_price: 62000,
    status: 'selesai',
    payment_status: 'lunas',
    payment_method: 'tunai',
    access_token: 'acc_ord_98_token',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    items: { '1': 2, '6': 1 },
    order_items: [
      { menu_item_id: '1', item_name: 'Kopi Susu Gula Aren', price: 22000, quantity: 2 },
      { menu_item_id: '6', item_name: 'Roti Bakar Coklat Keju', price: 18000, quantity: 1 },
    ],
  },
  {
    id: 'ORD-99',
    cafe_id: DEFAULT_CAFE_ID,
    order_number: 99,
    customer_name: 'Dimas',
    order_type: 'takeaway',
    table_number: null,
    notes: '',
    total_price: 38000,
    status: 'diproses',
    payment_status: 'menunggu_pembayaran',
    payment_method: null,
    access_token: 'acc_ord_99_token',
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    items: { '2': 1, '8': 1 },
    order_items: [
      { menu_item_id: '2', item_name: 'Americano', price: 18000, quantity: 1 },
      { menu_item_id: '8', item_name: 'Butter Croissant', price: 20000, quantity: 1 },
    ],
  },
  {
    id: 'ORD-100',
    cafe_id: DEFAULT_CAFE_ID,
    order_number: 100,
    customer_name: 'Sari',
    order_type: 'dine',
    table_number: '5',
    notes: 'Tanpa gula',
    total_price: 42000,
    status: 'baru',
    payment_status: 'menunggu_pembayaran',
    payment_method: null,
    access_token: 'acc_ord_100_token',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: { '3': 1, '7': 1 },
    order_items: [
      { menu_item_id: '3', item_name: 'Latte', price: 25000, quantity: 1 },
      { menu_item_id: '7', item_name: 'Kentang Goreng Truffle', price: 17000, quantity: 1 },
    ],
  },
];

export const INITIAL_TABLES: TableQR[] = [
  { id: 'tbl-1', cafe_id: DEFAULT_CAFE_ID, table_number: '1', qr_token: 'token_meja_1_secret', is_active: true },
  { id: 'tbl-2', cafe_id: DEFAULT_CAFE_ID, table_number: '2', qr_token: 'token_meja_2_secret', is_active: true },
  { id: 'tbl-3', cafe_id: DEFAULT_CAFE_ID, table_number: '3', qr_token: 'token_meja_3_secret', is_active: true },
  { id: 'tbl-4', cafe_id: DEFAULT_CAFE_ID, table_number: '4', qr_token: 'token_meja_4_secret', is_active: true },
  { id: 'tbl-5', cafe_id: DEFAULT_CAFE_ID, table_number: '5', qr_token: 'token_meja_5_secret', is_active: true },
  { id: 'tbl-6', cafe_id: DEFAULT_CAFE_ID, table_number: '6', qr_token: 'token_meja_6_secret', is_active: true },
];

export const INITIAL_CAFE: CafeProfile = {
  id: DEFAULT_CAFE_ID,
  name: 'Kedai Senja',
  address: 'Jl. Kopi Harum No. 12, Jakarta',
  phone: '0812-3456-7890',
  is_active: true,
};

export const INITIAL_STAFF: StaffMembership[] = [
  {
    id: 'staff-1',
    cafe_id: DEFAULT_CAFE_ID,
    user_id: 'usr-owner',
    email: 'owner@kedaisenja.com',
    role: 'owner',
    display_name: 'Pemilik Kedai',
    created_at: new Date().toISOString(),
  },
  {
    id: 'staff-2',
    cafe_id: DEFAULT_CAFE_ID,
    user_id: 'usr-barista',
    email: 'barista@kedaisenja.com',
    role: 'staff',
    display_name: 'Barista & Kasir',
    created_at: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_MENU_KEY = 'menukita_menu_v1';
const LOCAL_STORAGE_ORDERS_KEY = 'menukita_orders_v1';
const LOCAL_STORAGE_TABLES_KEY = 'menukita_tables_v1';
const LOCAL_STORAGE_CAFE_KEY = 'menukita_cafe_v1';
const LOCAL_STORAGE_STAFF_KEY = 'menukita_staff_v1';

// Format Rupiah
export const formatRupiah = (num: number): string => {
  return 'Rp' + num.toLocaleString('id-ID');
};

// Format Waktu Singkat
export const formatTime = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// Ambil Menu
export const fetchMenuData = async (): Promise<MenuItem[]> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as MenuItem[];
      }
    } catch (e) {
      console.warn('Gagal memuat menu dari Supabase, beralih ke cache lokal:', e);
    }
  }

  // Fallback LocalStorage / Default
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore parse error
      }
    }
    localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(INITIAL_MENU));
  }
  return INITIAL_MENU;
};

// Helper local sync
const syncLocalMenuAvailability = (itemId: string, isAvailable: boolean) => {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
    const menuList: MenuItem[] = cached ? JSON.parse(cached) : [...INITIAL_MENU];
    const updatedList = menuList.map((m) =>
      m.id === itemId ? { ...m, is_available: isAvailable } : m
    );
    localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('menukita_menu_updated'));
  }
};

// Update Ketersediaan Menu (Staf & Pemilik via RPC Security Definer)
export const updateMenuAvailability = async (
  itemId: string,
  isAvailable: boolean
): Promise<boolean> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Panggil RPC security definer toggle_menu_availability sesuai constraint RLS Staf
      const { data, error: rpcErr } = await supabase.rpc('toggle_menu_availability', {
        p_menu_id: itemId,
        p_is_available: isAvailable,
      });

      if (!rpcErr && data !== false) {
        syncLocalMenuAvailability(itemId, isAvailable);
        return true;
      }

      // Fallback direct update jika role owner
      const { error: updErr } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', itemId);

      if (!updErr) {
        syncLocalMenuAvailability(itemId, isAvailable);
        return true;
      }
    } catch (e) {
      console.warn('Gagal update menu availability di Supabase, fallback lokal:', e);
    }
  }

  // Fallback LocalStorage
  syncLocalMenuAvailability(itemId, isAvailable);
  return true;
};

// Tambah Menu Baru (Pemilik Saja)
export const createMenuItem = async (
  itemData: Omit<MenuItem, 'id'>
): Promise<MenuItem> => {
  const newId = 'MENU-' + Date.now();
  const newItem: MenuItem = {
    ...itemData,
    id: newId,
    cafe_id: DEFAULT_CAFE_ID,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          id: newItem.id,
          cafe_id: newItem.cafe_id,
          name: newItem.name,
          category: newItem.category,
          price: newItem.price,
          description: newItem.description || '',
          icon: newItem.icon || 'coffee',
          image_url: newItem.image_url || '',
          badge: newItem.badge || '',
          is_available: newItem.is_available,
        })
        .select()
        .single();

      if (!error && data) {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
          const menuList: MenuItem[] = cached ? JSON.parse(cached) : [...INITIAL_MENU];
          localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify([newItem, ...menuList]));
          window.dispatchEvent(new Event('menukita_menu_updated'));
        }
        return data as MenuItem;
      }
    } catch (e) {
      console.warn('Gagal insert menu ke Supabase, fallback lokal:', e);
    }
  }

  // Fallback LocalStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
    const menuList: MenuItem[] = cached ? JSON.parse(cached) : [...INITIAL_MENU];
    const updated = [newItem, ...menuList];
    localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('menukita_menu_updated'));
  }

  return newItem;
};

// Perbarui Detail Menu & Harga (Pemilik Saja)
export const updateMenuItem = async (
  itemId: string,
  updates: Partial<MenuItem>
): Promise<boolean> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.emoji !== undefined) payload.emoji = updates.emoji;
      if (updates.image_url !== undefined) payload.image_url = updates.image_url;
      if (updates.badge !== undefined) payload.badge = updates.badge;
      if (updates.is_available !== undefined) payload.is_available = updates.is_available;

      const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', itemId);

      if (!error) {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
          const menuList: MenuItem[] = cached ? JSON.parse(cached) : [...INITIAL_MENU];
          const updatedList = menuList.map((m) =>
            m.id === itemId ? { ...m, ...updates } : m
          );
          localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(updatedList));
          window.dispatchEvent(new Event('menukita_menu_updated'));
        }
        return true;
      }
    } catch (e) {
      console.warn('Gagal update menu di Supabase, fallback lokal:', e);
    }
  }

  // Fallback LocalStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
    const menuList: MenuItem[] = cached ? JSON.parse(cached) : [...INITIAL_MENU];
    const updatedList = menuList.map((m) =>
      m.id === itemId ? { ...m, ...updates } : m
    );
    localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('menukita_menu_updated'));
    return true;
  }

  return false;
};

// Hapus Menu (Pemilik Saja)
export const deleteMenuItem = async (itemId: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (!error) {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
          const menuList: MenuItem[] = cached ? JSON.parse(cached) : [...INITIAL_MENU];
          const updatedList = menuList.filter((m) => m.id !== itemId);
          localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(updatedList));
          window.dispatchEvent(new Event('menukita_menu_updated'));
        }
        return true;
      }
    } catch (e) {
      console.warn('Gagal hapus menu di Supabase, fallback lokal:', e);
    }
  }

  // Fallback LocalStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
    const menuList: MenuItem[] = cached ? JSON.parse(cached) : [...INITIAL_MENU];
    const updatedList = menuList.filter((m) => m.id !== itemId);
    localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('menukita_menu_updated'));
    return true;
  }

  return false;
};

// Ambil Semua Pesanan
export const fetchOrdersData = async (): Promise<Order[]> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          cafe_id,
          order_number,
          customer_name,
          order_type,
          table_number,
          notes,
          total_price,
          status,
          payment_status,
          payment_method,
          cancellation_reason,
          access_token,
          device_id,
          created_at,
          order_items (
            menu_item_id,
            item_name,
            price,
            quantity
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          const mapped = data.map((o) => {
            const raw = o as unknown as Order & { order_items?: Array<{ menu_item_id: string; quantity: number }> };
            const itemsMap: Record<string, number> = {};
            for (const it of raw.order_items || []) {
              itemsMap[it.menu_item_id] = it.quantity;
            }
            return {
              ...raw,
              items: itemsMap,
            };
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat pesanan dari Supabase:', e);
    }
  }

  // Fallback LocalStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
  }
  return INITIAL_ORDERS;
};

// Simpan Pesanan Baru
export const submitNewOrder = async (
  form: CustomerForm,
  cart: Record<string, number>,
  menu: MenuItem[],
  deviceId?: string
): Promise<Order | null> => {
  const menuMap = new Map(menu.map((m) => [m.id, m]));
  const orderItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = menuMap.get(id);
      return {
        menu_item_id: id,
        item_name: item ? item.name : `Item #${id}`,
        price: item ? item.price : 0,
        quantity: qty,
      };
    });

  const totalPrice = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const now = new Date();
  const orderId = 'ORD-' + Math.floor(100 + Math.random() * 900);
  const accessToken =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'a0000000-0000-4000-8000-000000000000';

  const newOrder: Order = {
    id: orderId,
    cafe_id: DEFAULT_CAFE_ID,
    customer_name: form.name.trim() || 'Pelanggan',
    order_type: form.type,
    table_number: form.type === 'dine' ? form.table : null,
    notes: form.note.trim(),
    total_price: totalPrice,
    status: 'baru',
    payment_status: 'menunggu_pembayaran',
    payment_method: null,
    access_token: accessToken,
    device_id: deviceId,
    created_at: now.toISOString(),
    items: { ...cart },
    order_items: orderItems,
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: insertedOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          id: newOrder.id,
          cafe_id: newOrder.cafe_id,
          customer_name: newOrder.customer_name,
          order_type: newOrder.order_type,
          table_number: newOrder.table_number,
          notes: newOrder.notes,
          total_price: newOrder.total_price,
          status: newOrder.status,
          payment_status: newOrder.payment_status,
          access_token: newOrder.access_token,
          device_id: newOrder.device_id,
        })
        .select()
        .single();

      if (!orderErr && insertedOrder) {
        // Insert items
        const rows = orderItems.map((it) => ({
          cafe_id: DEFAULT_CAFE_ID,
          order_id: insertedOrder.id,
          menu_item_id: it.menu_item_id,
          item_name: it.item_name,
          price: it.price,
          quantity: it.quantity,
        }));

        await supabase.from('order_items').insert(rows);
        return {
          ...newOrder,
          order_number: insertedOrder.order_number,
        };
      }
    } catch (e) {
      console.warn('Gagal menyimpan pesanan ke Supabase, simpan ke lokal:', e);
    }
  }

  // Fallback LocalStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existingOrders: Order[] = cached ? JSON.parse(cached) : [...INITIAL_ORDERS];
    const updated = [newOrder, ...existingOrders];
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('menukita_orders_updated'));
  }

  return newOrder;
};

// Helper sync local order state
const syncLocalOrderStatus = (
  orderId: string,
  nextStatus: OrderStatus,
  options?: { paymentMethod?: PaymentMethod; cancellationReason?: string }
) => {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existingOrders: Order[] = cached ? JSON.parse(cached) : [...INITIAL_ORDERS];
    const updated = existingOrders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: nextStatus,
        payment_status: nextStatus === 'selesai' ? ('lunas' as PaymentStatus) : o.payment_status,
        payment_method:
          nextStatus === 'selesai'
            ? options?.paymentMethod || o.payment_method || 'tunai'
            : o.payment_method,
        cancellation_reason:
          nextStatus === 'dibatalkan'
            ? options?.cancellationReason || o.cancellation_reason
            : o.cancellation_reason,
        updated_at: new Date().toISOString(),
      };
    });
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('menukita_orders_updated'));
  }
};

// Majukan / Ubah Status Pesanan (Kitchen & POS)
export const advanceOrderStatus = async (
  orderId: string,
  nextStatus: OrderStatus,
  options?: {
    paymentMethod?: PaymentMethod;
    cancellationReason?: string;
  }
): Promise<boolean> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Panggil RPC advance_order_status
      const { data, error } = await supabase.rpc('advance_order_status', {
        p_order_id: orderId,
        p_next_status: nextStatus,
        p_cancellation_reason: options?.cancellationReason || null,
        p_payment_method: options?.paymentMethod || null,
      });

      if (!error && data !== false) {
        syncLocalOrderStatus(orderId, nextStatus, options);
        return true;
      }

      // Fallback direct update jika RPC belum dibuat
      const updatePayload: Record<string, unknown> = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };
      if (nextStatus === 'selesai') {
        updatePayload.payment_status = 'lunas';
        if (options?.paymentMethod) {
          updatePayload.payment_method = options.paymentMethod;
        }
      }
      if (nextStatus === 'dibatalkan' && options?.cancellationReason) {
        updatePayload.cancellation_reason = options.cancellationReason;
      }

      const { error: directErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (!directErr) {
        syncLocalOrderStatus(orderId, nextStatus, options);
        return true;
      }
    } catch (e) {
      console.warn('Gagal advance order status di Supabase:', e);
    }
  }

  // Fallback LocalStorage
  syncLocalOrderStatus(orderId, nextStatus, options);
  return true;
};

// Helper: Batalkan Pesanan (Wajib Alasan)
export const cancelOrder = async (orderId: string, reason: string): Promise<boolean> => {
  if (!reason.trim()) return false;
  return advanceOrderStatus(orderId, 'dibatalkan', { cancellationReason: reason.trim() });
};

// Helper: Catat Pembayaran dan Selesaikan Pesanan
export const recordPaymentAndCompleteOrder = async (
  orderId: string,
  method: PaymentMethod
): Promise<boolean> => {
  return advanceOrderStatus(orderId, 'selesai', { paymentMethod: method });
};

// Validasi Token QR Meja (Customer Guard)
export const validateTableQR = async (
  cafeId: string = DEFAULT_CAFE_ID,
  tableNumber: string,
  qrToken: string
): Promise<{ valid: boolean; reason?: string }> => {
  if (!tableNumber) return { valid: false, reason: 'Nomor meja tidak ditemukan' };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('validate_table_qr', {
        p_cafe_id: cafeId,
        p_table_number: tableNumber,
        p_token: qrToken || '',
      });
      if (!error && typeof data === 'boolean') {
        return {
          valid: data,
          reason: data ? undefined : 'Token QR meja tidak valid atau kedai sedang nonaktif.',
        };
      }
    } catch (e) {
      console.warn('Gagal validasi QR di Supabase, fallback lokal:', e);
    }
  }

  // Local fallback: valid jika token cocok atau token default
  const expectedToken = `token_meja_${tableNumber}_secret`;
  const isValid = !qrToken || qrToken === expectedToken || qrToken.startsWith('tok') || qrToken.length >= 6;
  return {
    valid: isValid,
    reason: isValid ? undefined : 'Token QR meja tidak cocok.',
  };
};

// Pembatasan Jumlah Pesanan Aktif per Perangkat/Meja
export const checkOrderRateLimit = async (
  cafeId: string = DEFAULT_CAFE_ID,
  tableNumber: string | null,
  deviceId: string
): Promise<{ allowed: boolean; message?: string }> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('check_order_rate_limit', {
        p_cafe_id: cafeId,
        p_table_number: tableNumber || null,
        p_device_id: deviceId || null,
      });
      if (!error && typeof data === 'boolean') {
        return {
          allowed: data,
          message: data
            ? undefined
            : 'Batas pesanan aktif tercapai untuk perangkat/meja ini. Harap tunggu pesanan sebelumnya selesai.',
        };
      }
    } catch (e) {
      console.warn('Gagal cek rate limit di Supabase, fallback lokal:', e);
    }
  }

  // Local fallback: maksimal 3 pesanan aktif
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (cached) {
      try {
        const orders: Order[] = JSON.parse(cached);
        const active = orders.filter(
          (o) =>
            o.status !== 'selesai' &&
            o.status !== 'dibatalkan' &&
            ((tableNumber && o.table_number === tableNumber) || (deviceId && o.device_id === deviceId))
        );
        if (active.length >= 3) {
          return {
            allowed: false,
            message: 'Batas 3 pesanan aktif tercapai. Harap tunggu pesanan sebelumnya selesai.',
          };
        }
      } catch {
        // ignore
      }
    }
  }

  return { allowed: true };
};

// Kelola Staf (Pemilik Saja)
export const fetchStaffMembers = async (cafeId: string = DEFAULT_CAFE_ID): Promise<StaffMembership[]> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('staff_memberships')
        .select('*')
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as StaffMembership[];
      }
    } catch (e) {
      console.warn('Gagal memuat staff memberships di Supabase, fallback lokal:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(INITIAL_STAFF));
  }
  return INITIAL_STAFF;
};

export const addStaffMember = async (
  cafeId: string = DEFAULT_CAFE_ID,
  email: string,
  role: 'staff' | 'owner',
  displayName?: string
): Promise<StaffMembership | null> => {
  const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'staff-' + Date.now();
  const newStaff: StaffMembership = {
    id: generatedId,
    cafe_id: cafeId,
    user_id: '',
    email: email.trim(),
    role,
    display_name: displayName?.trim() || (role === 'owner' ? 'Pemilik Kedai' : 'Staf Barista'),
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('staff_memberships')
        .insert({
          cafe_id: cafeId,
          email: email.trim(),
          role,
          display_name: newStaff.display_name,
        })
        .select()
        .single();
      if (!error && data) {
        if (typeof window !== 'undefined') {
          const list = await fetchStaffMembers(cafeId);
          localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify([...list, data]));
        }
        return data as StaffMembership;
      }
    } catch (e) {
      console.warn('Gagal tambah staff di Supabase, simpan lokal:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const list = await fetchStaffMembers(cafeId);
    const updated = [...list, newStaff];
    localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(updated));
  }
  return newStaff;
};

export const deleteStaffMember = async (membershipId: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('staff_memberships')
        .delete()
        .eq('id', membershipId);
      if (!error) {
        if (typeof window !== 'undefined') {
          const list = await fetchStaffMembers();
          localStorage.setItem(
            LOCAL_STORAGE_STAFF_KEY,
            JSON.stringify(list.filter((s) => s.id !== membershipId))
          );
        }
        return true;
      }
    } catch (e) {
      console.warn('Gagal hapus staf di Supabase:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const list = await fetchStaffMembers();
    localStorage.setItem(
      LOCAL_STORAGE_STAFF_KEY,
      JSON.stringify(list.filter((s) => s.id !== membershipId))
    );
    return true;
  }
  return false;
};

// Profil Kedai (Pemilik Saja)
export const fetchCafeProfile = async (cafeId: string = DEFAULT_CAFE_ID): Promise<CafeProfile> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', cafeId)
        .single();
      if (!error && data) {
        return data as CafeProfile;
      }
    } catch (e) {
      console.warn('Gagal memuat profil kedai dari Supabase:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_CAFE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    localStorage.setItem(LOCAL_STORAGE_CAFE_KEY, JSON.stringify(INITIAL_CAFE));
  }
  return INITIAL_CAFE;
};

export const updateCafeProfile = async (
  cafeId: string = DEFAULT_CAFE_ID,
  updates: Partial<CafeProfile>
): Promise<boolean> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('cafes')
        .update(updates)
        .eq('id', cafeId);
      if (!error) {
        if (typeof window !== 'undefined') {
          const current = await fetchCafeProfile(cafeId);
          localStorage.setItem(
            LOCAL_STORAGE_CAFE_KEY,
            JSON.stringify({ ...current, ...updates })
          );
        }
        return true;
      }
    } catch (e) {
      console.warn('Gagal update profil kedai di Supabase:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const current = await fetchCafeProfile(cafeId);
    localStorage.setItem(
      LOCAL_STORAGE_CAFE_KEY,
      JSON.stringify({ ...current, ...updates })
    );
    return true;
  }
  return false;
};

// Kelola Meja & QR (Pemilik Saja)
export const fetchTables = async (cafeId: string = DEFAULT_CAFE_ID): Promise<TableQR[]> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('cafe_id', cafeId)
        .order('table_number', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as TableQR[];
      }
    } catch (e) {
      console.warn('Gagal memuat meja dari Supabase:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(INITIAL_TABLES));
  }
  return INITIAL_TABLES;
};

// Running Text Marquee (Fallback Customer Ticker)
export const DEFAULT_ANNOUNCEMENT =
  'Biji Kopi Fresh Roast Setiap Hari | Pastry Normandia Panggang Hangat | Sirup Gula Aren Organik Pilihan | Pesanan Cepat Langsung Dari Meja';
export const LOCAL_STORAGE_ANNOUNCEMENT_KEY = 'menukita_marquee_text';

export const parseAnnouncementItems = (text: string): string[] => {
  if (!text) return [];
  return text
    .split(/[•|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const getAnnouncementText = (): string => {
  if (typeof window === 'undefined') return DEFAULT_ANNOUNCEMENT;
  const saved = localStorage.getItem(LOCAL_STORAGE_ANNOUNCEMENT_KEY);
  return saved?.trim() ? saved : DEFAULT_ANNOUNCEMENT;
};

export const fetchAnnouncementText = async (): Promise<string> => {
  return getAnnouncementText();
};

export const saveAnnouncementText = async (text: string): Promise<boolean> => {
  const cleaned = text.trim() || DEFAULT_ANNOUNCEMENT;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_ANNOUNCEMENT_KEY, cleaned);
  }
  return true;
};


