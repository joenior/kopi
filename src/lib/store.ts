import { MenuItem, Order, OrderStatus, CustomerForm } from './types';
import { getSupabase } from './supabase';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    category: 'Kopi',
    name: 'Kopi Susu Gula Aren',
    description: 'Espresso ganda mantap berpadu susu segar dan manis legit gula aren organik pilihan.',
    price: 22000,
    emoji: '☕',
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
    emoji: '☕',
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
    emoji: '🥛',
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
    emoji: '🍵',
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
    emoji: '🍫',
    badge: 'Manis Pas',
    is_available: true,
  },
  {
    id: '6',
    category: 'Makanan',
    name: 'Roti Bakar Coklat Keju',
    description: 'Roti brioche panggang harum dengan lumeran cokelat Belgia dan limpahan keju cheddar parut.',
    price: 18000,
    emoji: '🍞',
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
    emoji: '🍟',
    badge: 'Gurih',
    is_available: true,
  },
  {
    id: '8',
    category: 'Makanan',
    name: 'Butter Croissant',
    description: 'Pastry khas Prancis berlapis renyah dan lembut dengan butter Normandia premium.',
    price: 20000,
    emoji: '🥐',
    image_url: '/images/croissant.jpg',
    badge: 'Fresh Bake',
    is_available: true,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-98',
    order_number: 98,
    customer_name: 'Rina',
    order_type: 'dine',
    table_number: '2',
    notes: 'Es sedikit',
    total_price: 62000,
    status: 'selesai',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    items: { '1': 2, '6': 1 },
    order_items: [
      { menu_item_id: '1', item_name: 'Kopi Susu Gula Aren', price: 22000, quantity: 2 },
      { menu_item_id: '6', item_name: 'Roti Bakar Coklat Keju', price: 18000, quantity: 1 },
    ],
  },
  {
    id: 'ORD-99',
    order_number: 99,
    customer_name: 'Dimas',
    order_type: 'takeaway',
    table_number: null,
    notes: '',
    total_price: 38000,
    status: 'diproses',
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    items: { '2': 1, '8': 1 },
    order_items: [
      { menu_item_id: '2', item_name: 'Americano', price: 18000, quantity: 1 },
      { menu_item_id: '8', item_name: 'Butter Croissant', price: 20000, quantity: 1 },
    ],
  },
  {
    id: 'ORD-100',
    order_number: 100,
    customer_name: 'Sari',
    order_type: 'dine',
    table_number: '5',
    notes: 'Tanpa gula',
    total_price: 42000,
    status: 'baru',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: { '3': 1, '7': 1 },
    order_items: [
      { menu_item_id: '3', item_name: 'Latte', price: 25000, quantity: 1 },
      { menu_item_id: '7', item_name: 'Kentang Goreng Truffle', price: 17000, quantity: 1 },
    ],
  },
];

const LOCAL_STORAGE_MENU_KEY = 'menukita_menu_v1';
const LOCAL_STORAGE_ORDERS_KEY = 'menukita_orders_v1';

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

// Update Ketersediaan Menu
export const updateMenuAvailability = async (
  itemId: string,
  isAvailable: boolean
): Promise<boolean> => {
  return updateMenuItem(itemId, { is_available: isAvailable });
};

// Tambah Menu Baru
export const createMenuItem = async (
  itemData: Omit<MenuItem, 'id'>
): Promise<MenuItem> => {
  const newId = 'MENU-' + Date.now();
  const newItem: MenuItem = {
    ...itemData,
    id: newId,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          id: newItem.id,
          name: newItem.name,
          category: newItem.category,
          price: newItem.price,
          description: newItem.description || '',
          emoji: newItem.emoji || '☕',
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

// Perbarui Detail Menu
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

// Hapus Menu
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
          order_number,
          customer_name,
          order_type,
          table_number,
          notes,
          total_price,
          status,
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
        return data.map((o) => {
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
  menu: MenuItem[]
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

  const newOrder: Order = {
    id: orderId,
    customer_name: form.name.trim() || 'Pelanggan',
    order_type: form.type,
    table_number: form.type === 'dine' ? form.table : null,
    notes: form.note.trim(),
    total_price: totalPrice,
    status: 'baru',
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
          customer_name: newOrder.customer_name,
          order_type: newOrder.order_type,
          table_number: newOrder.table_number,
          notes: newOrder.notes,
          total_price: newOrder.total_price,
          status: newOrder.status,
        })
        .select()
        .single();

      if (!orderErr && insertedOrder) {
        // Insert items
        const rows = orderItems.map((it) => ({
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

// Majukan Status Pesanan (Kitchen POS)
export const advanceOrderStatus = async (
  orderId: string,
  nextStatus: OrderStatus
): Promise<boolean> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (!error) return true;
    } catch (e) {
      console.warn('Gagal update status pesanan di Supabase:', e);
    }
  }

  // Fallback LocalStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existingOrders: Order[] = cached ? JSON.parse(cached) : [...INITIAL_ORDERS];
    const updated = existingOrders.map((o) =>
      o.id === orderId ? { ...o, status: nextStatus, updated_at: new Date().toISOString() } : o
    );
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('menukita_orders_updated'));
    return true;
  }

  return false;
};

// Pengumuman / Running Text Marquee
export const DEFAULT_ANNOUNCEMENT =
  '☕ Biji Kopi Fresh Roast Setiap Hari | 🥐 Pastry Normandia Panggang Hangat | 🍯 Sirup Gula Aren Organik Pilihan | ⚡ Pesanan Cepat Langsung Dari Meja';
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

// Ambil Teks Pengumuman dari Supabase dengan fallback Lokal
export const fetchAnnouncementText = async (): Promise<string> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'announcement_text')
        .single();

      if (!error && data?.value) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_ANNOUNCEMENT_KEY, data.value);
        }
        return data.value;
      }
    } catch (e) {
      console.warn('Gagal membaca announcement dari Supabase, gunakan lokal:', e);
    }
  }

  return getAnnouncementText();
};

// Simpan Teks Pengumuman ke Supabase dan Lokal
export const saveAnnouncementText = async (text: string): Promise<boolean> => {
  const cleaned = text.trim() || DEFAULT_ANNOUNCEMENT;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_ANNOUNCEMENT_KEY, cleaned);
    window.dispatchEvent(new Event('menukita_announcement_updated'));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          key: 'announcement_text',
          value: cleaned,
          updated_at: new Date().toISOString(),
        });

      if (!error) return true;
    } catch (e) {
      console.warn('Gagal menyimpan announcement ke Supabase:', e);
    }
  }

  return true;
};


