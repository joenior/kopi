-- ====================================================================
-- MENUKITA (KEDAI SENJA) - SUPABASE DATABASE SCHEMA
-- ====================================================================
-- Skema database lengkap siap pakai untuk Supabase PostgreSQL
-- Dilengkapi Row Level Security (RLS) dan Supabase Realtime support.

-- 1. Buat Ekstensi UUID
create extension if not exists "uuid-ossp";

-- 2. Tabel Kategori Menu
create table if not exists public.categories (
    id text primary key,
    name text not null,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabel Item Menu
create table if not exists public.menu_items (
    id text primary key,
    category_id text references public.categories(id) on delete set null,
    category text not null,
    name text not null,
    description text default '',
    price integer not null,
    image_url text default '',
    emoji text default '☕',
    badge text default '',
    is_available boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabel Pesanan (Orders)
create table if not exists public.orders (
    id text primary key,
    order_number serial,
    customer_name text not null default 'Pelanggan',
    order_type text not null check (order_type in ('dine', 'takeaway')),
    table_number text,
    notes text default '',
    total_price integer not null default 0,
    status text not null default 'baru' check (status in ('baru', 'diproses', 'siap', 'selesai')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabel Item dalam Pesanan (Order Items)
create table if not exists public.order_items (
    id uuid default gen_random_uuid() primary key,
    order_id text references public.orders(id) on delete cascade not null,
    menu_item_id text references public.menu_items(id) on delete set null,
    item_name text not null,
    price integer not null,
    quantity integer not null default 1,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tabel Pengaturan Kedai (Running Text, Pengumuman, dll)
create table if not exists public.store_settings (
    key text primary key,
    value text not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Trigger update otomatis kolom updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at
    before update on public.menu_items
    for each row execute function public.handle_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
    before update on public.orders
    for each row execute function public.handle_updated_at();

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
    before update on public.store_settings
    for each row execute function public.handle_updated_at();

-- 8. Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

-- Kebijakan Kategori: Publik bisa membaca, hanya user terautentikasi (admin) yang bisa kelola
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone" on public.categories
    for select using (true);

drop policy if exists "Only authenticated users can manage categories" on public.categories;
create policy "Only authenticated users can manage categories" on public.categories
    for all to authenticated using (true) with check (true);

-- Kebijakan Menu: Publik bisa membaca, hanya staf/pemilik terautentikasi yang bisa ubah ketersediaan & kelola
drop policy if exists "Menu items are viewable by everyone" on public.menu_items;
create policy "Menu items are viewable by everyone" on public.menu_items
    for select using (true);

drop policy if exists "Anyone can toggle menu availability for demo kiosk" on public.menu_items;
drop policy if exists "Only authenticated users can update menu items" on public.menu_items;
create policy "Only authenticated users can update menu items" on public.menu_items
    for update to authenticated using (true) with check (true);

drop policy if exists "Anyone can insert menu items" on public.menu_items;
drop policy if exists "Only authenticated users can insert menu items" on public.menu_items;
create policy "Only authenticated users can insert menu items" on public.menu_items
    for insert to authenticated with check (true);

drop policy if exists "Only authenticated users can delete menu items" on public.menu_items;
create policy "Only authenticated users can delete menu items" on public.menu_items
    for delete to authenticated using (true);

-- Kebijakan Pesanan: Publik bisa membuat & memantau status pesanan, HANYA barista/pemilik terautentikasi yang bisa update status
drop policy if exists "Orders are viewable by everyone" on public.orders;
create policy "Orders are viewable by everyone" on public.orders
    for select using (true);

drop policy if exists "Anyone can insert orders" on public.orders;
create policy "Anyone can insert orders" on public.orders
    for insert with check (true);

drop policy if exists "Anyone can update order status" on public.orders;
drop policy if exists "Only authenticated staff can update order status" on public.orders;
create policy "Only authenticated staff can update order status" on public.orders
    for update to authenticated using (true) with check (true);

-- Kebijakan Order Items: Publik bisa membaca & insert pesanan mereka
drop policy if exists "Order items are viewable by everyone" on public.order_items;
create policy "Order items are viewable by everyone" on public.order_items
    for select using (true);

drop policy if exists "Anyone can insert order items" on public.order_items;
create policy "Anyone can insert order items" on public.order_items
    for insert with check (true);

drop policy if exists "Only authenticated staff can manage order items" on public.order_items;
create policy "Only authenticated staff can manage order items" on public.order_items
    for all to authenticated using (true) with check (true);

-- Kebijakan Pengaturan Kedai (Running Text): Publik membaca, pemilik mengelola
drop policy if exists "Store settings are viewable by everyone" on public.store_settings;
create policy "Store settings are viewable by everyone" on public.store_settings
    for select using (true);

drop policy if exists "Only authenticated users can manage store settings" on public.store_settings;
create policy "Only authenticated users can manage store settings" on public.store_settings
    for all to authenticated using (true) with check (true);

-- 9. Enable Realtime Publications
-- Memungkinkan websocket realtime untuk pesanan baru, menu, dan teks berjalan
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.store_settings;

-- 9. Seed Data Awal
insert into public.categories (id, name, display_order) values
    ('kopi', 'Kopi', 1),
    ('non-kopi', 'Non-Kopi', 2),
    ('makanan', 'Makanan', 3)
on conflict (id) do update set name = excluded.name, display_order = excluded.display_order;

insert into public.menu_items (id, category_id, category, name, description, price, emoji, image_url, badge, is_available) values
    ('1', 'kopi', 'Kopi', 'Kopi Susu Gula Aren', 'Espresso ganda mantap berpadu susu segar dan manis legit gula aren organik pilihan.', 22000, '☕', '/images/kopi-susu-aren.jpg', 'Favorit', true),
    ('2', 'kopi', 'Kopi', 'Americano', 'Espresso kaya rasa dengan crema emas lembut, disajikan panas atau dingin menyegarkan.', 18000, '☕', '/images/hero.jpg', 'Klasik', true),
    ('3', 'kopi', 'Kopi', 'Latte', 'Kombinasi seimbang espresso aromatik dan microfoam susu steamed dengan latte art anggun.', 25000, '🥛', '/images/latte.jpg', 'Best Seller', true),
    ('4', 'non-kopi', 'Non-Kopi', 'Matcha Latte', 'Matcha seremonial asli Jepang berpadu susu creamy lembut yang menenangkan.', 26000, '🍵', '/images/matcha.jpg', 'Populer', true),
    ('5', 'non-kopi', 'Non-Kopi', 'Coklat Dingin', 'Cokelat artisanal Belgia pekat dengan taburan bubuk kakao murni yang nikmat.', 24000, '🍫', '', 'Manis Pas', true),
    ('6', 'makanan', 'Makanan', 'Roti Bakar Coklat Keju', 'Roti brioche panggang harum dengan lumeran cokelat Belgia dan limpahan keju cheddar parut.', 18000, '🍞', '/images/croissant.jpg', 'Camilan', true),
    ('7', 'makanan', 'Makanan', 'Kentang Goreng Truffle', 'Kentang krispi renyah ditaburi sea salt, daun parsley segar, dan aroma truffle istimewa.', 17000, '🍟', '', 'Gurih', true),
    ('8', 'makanan', 'Makanan', 'Butter Croissant', 'Pastry khas Prancis berlapis renyah dan lembut dengan butter Normandia premium.', 20000, '🥐', '/images/croissant.jpg', 'Fresh Bake', true)
on conflict (id) do update set
    category_id = excluded.category_id,
    category = excluded.category,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    emoji = excluded.emoji,
    image_url = excluded.image_url,
    badge = excluded.badge;

-- Contoh Pesanan Awal untuk demo Kitchen Display / Admin
insert into public.orders (id, customer_name, order_type, table_number, notes, total_price, status, created_at) values
    ('ORD-98', 'Rina', 'dine', '2', 'Es sedikit', 62000, 'selesai', timezone('utc'::text, now()) - interval '45 minutes'),
    ('ORD-99', 'Dimas', 'takeaway', null, '', 38000, 'diproses', timezone('utc'::text, now()) - interval '18 minutes'),
    ('ORD-100', 'Sari', 'dine', '5', 'Tanpa gula', 42000, 'baru', timezone('utc'::text, now()) - interval '5 minutes')
on conflict (id) do nothing;

insert into public.order_items (order_id, menu_item_id, item_name, price, quantity) values
    ('ORD-98', '1', 'Kopi Susu Gula Aren', 22000, 2),
    ('ORD-98', '6', 'Roti Bakar Coklat Keju', 18000, 1),
    ('ORD-99', '2', 'Americano', 18000, 1),
    ('ORD-99', '8', 'Butter Croissant', 20000, 1),
    ('ORD-100', '3', 'Latte', 25000, 1),
    ('ORD-100', '7', 'Kentang Goreng Truffle', 17000, 1)
on conflict do nothing;

-- Teks Pengumuman / Running Text Bawaan Kedai
insert into public.store_settings (key, value) values
    ('announcement_text', '☕ Biji Kopi Fresh Roast Setiap Hari | 🥐 Pastry Normandia Panggang Hangat | 🍯 Sirup Gula Aren Organik Pilihan | ⚡ Pesanan Cepat Langsung Dari Meja')
on conflict (key) do nothing;

