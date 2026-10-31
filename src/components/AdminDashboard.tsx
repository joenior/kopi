'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MenuItem, Order, OrderStatus } from '@/lib/types';
import { formatRupiah, formatTime, DEFAULT_ANNOUNCEMENT, parseAnnouncementItems } from '@/lib/store';
import {
  Kanban,
  ForkKnife,
  ChartBar,
  ArrowRight,
  CheckCircle,
  TrendUp,
  MagnifyingGlass,
  ArrowsClockwise,
  QrCode,
  Megaphone,
  Check,
  Sparkle,
  Plus,
  PencilSimple,
  Trash,
  X,
  Package,
  WarningCircle,
  Image as ImageIcon,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { SPRING_LAYOUT, SPRING_PRESS } from '@/lib/ease';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { AnimatedBadge } from '@/components/motion/AnimatedBadge';
import { Marquee } from './motion/Marquee';
import { TableManager } from './TableManager';

interface AdminDashboardProps {
  orders: Order[];
  menu: MenuItem[];
  onAdvanceOrder: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  onToggleAvailability: (itemId: string, current: boolean) => Promise<void>;
  onCreateMenu?: (itemData: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenu?: (itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  onDeleteMenu?: (itemId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  announcementText?: string;
  onUpdateAnnouncement?: (text: string) => Promise<void> | void;
}

export function AdminDashboard({
  orders,
  menu,
  onAdvanceOrder,
  onToggleAvailability,
  onCreateMenu,
  onUpdateMenu,
  onDeleteMenu,
  onRefresh,
  isRefreshing,
  announcementText,
  onUpdateAnnouncement,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pesanan' | 'menu' | 'meja' | 'laporan' | 'pengumuman'>('pesanan');
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [menuCategory, setMenuCategory] = useState<string>('Semua');
  const [menuStockFilter, setMenuStockFilter] = useState<'semua' | 'tersedia' | 'habis'>('semua');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [draftAnnouncement, setDraftAnnouncement] = useState<string>(announcementText || DEFAULT_ANNOUNCEMENT);
  const [prevAnnouncement, setPrevAnnouncement] = useState<string | undefined>(announcementText);
  const [isSavedAnnouncement, setIsSavedAnnouncement] = useState<boolean>(false);

  // Menu Catalog CRUD Modals State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [isSavingMenu, setIsSavingMenu] = useState<boolean>(false);
  const [isDeletingMenu, setIsDeletingMenu] = useState<boolean>(false);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Kopi');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formEmoji, setFormEmoji] = useState<string>('☕');
  const [formImageUrl, setFormImageUrl] = useState<string>('/images/kopi-susu-aren.jpg');
  const [formBadge, setFormBadge] = useState<string>('');
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  if (announcementText !== prevAnnouncement) {
    setPrevAnnouncement(announcementText);
    setDraftAnnouncement(announcementText || DEFAULT_ANNOUNCEMENT);
  }

  // Tabs Definition
  const tabs = [
    { key: 'pesanan', label: 'Pesanan Dapur', icon: Kanban },
    { key: 'menu', label: 'Kelola Menu', icon: ForkKnife },
    { key: 'meja', label: 'Kelola Meja & QR', icon: QrCode },
    { key: 'laporan', label: 'Laporan Penjualan', icon: ChartBar },
    { key: 'pengumuman', label: 'Teks Berjalan', icon: Megaphone },
  ] as const;

  const handleSaveAnnouncement = async () => {
    await onUpdateAnnouncement?.(draftAnnouncement);
    setIsSavedAnnouncement(true);
    setTimeout(() => setIsSavedAnnouncement(false), 2500);
  };

  // Next status transition mapping
  const nextStatusMap: Record<'baru' | 'diproses' | 'siap', { next: OrderStatus; label: string }> = {
    baru: { next: 'diproses', label: 'Proses Pesanan' },
    diproses: { next: 'siap', label: 'Pesanan Siap' },
    siap: { next: 'selesai', label: 'Selesaikan' },
  };

  // Filter orders by status
  const ordersNew = orders.filter((o) => o.status === 'baru');
  const ordersCooking = orders.filter((o) => o.status === 'diproses');
  const ordersReady = orders.filter((o) => o.status === 'siap');
  const ordersDone = orders.filter((o) => o.status === 'selesai');

  // Laporan calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
  const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const dineCount = orders.filter((o) => o.order_type === 'dine').length;
  const takeCount = orders.filter((o) => o.order_type === 'takeaway').length;

  // Item aggregation
  const itemSalesMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.order_items && o.order_items.length > 0) {
      o.order_items.forEach((it) => {
        if (!itemSalesMap[it.menu_item_id]) {
          itemSalesMap[it.menu_item_id] = {
            name: it.item_name,
            category: 'Kategori',
            qty: 0,
            revenue: 0,
          };
        }
        itemSalesMap[it.menu_item_id].qty += it.quantity;
        itemSalesMap[it.menu_item_id].revenue += it.price * it.quantity;
      });
    } else if (o.items) {
      Object.entries(o.items).forEach(([id, qty]) => {
        const menuItem = menu.find((m) => m.id === id);
        const name = menuItem ? menuItem.name : `Item #${id}`;
        const price = menuItem ? menuItem.price : 0;
        if (!itemSalesMap[id]) {
          itemSalesMap[id] = {
            name,
            category: menuItem ? menuItem.category : '',
            qty: 0,
            revenue: 0,
          };
        }
        itemSalesMap[id].qty += qty;
        itemSalesMap[id].revenue += price * qty;
      });
    }
  });

  const topItems = Object.entries(itemSalesMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 6);

  const maxQty = topItems.length > 0 ? Math.max(...topItems.map(([, v]) => v.qty)) : 1;

  const imagePresets = [
    { label: 'Kopi Susu Aren', url: '/images/kopi-susu-aren.jpg' },
    { label: 'Latte Art', url: '/images/latte.jpg' },
    { label: 'Americano / Hero', url: '/images/hero.jpg' },
    { label: 'Matcha Latte', url: '/images/matcha.jpg' },
    { label: 'Butter Croissant', url: '/images/croissant.jpg' },
    { label: 'Tanpa Foto (Hanya Emoji)', url: '' },
  ];

  const emojiPresets = ['☕', '🥛', '🍵', '🍫', '🥐', '🍞', '🥪', '🍟', '🍰', '🧊', '🧋', '🥤', '🥞', '🧇'];
  const badgePresets = ['Favorit', 'Best Seller', 'Baru', 'Promo', 'Klasik', 'Fresh Bake', 'Camilan'];

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Kopi');
    setFormPrice('');
    setFormDescription('');
    setFormEmoji('☕');
    setFormImageUrl('/images/kopi-susu-aren.jpg');
    setFormBadge('');
    setFormIsAvailable(true);
    setFormError(null);
    setIsMenuModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormDescription(item.description || '');
    setFormEmoji(item.emoji || '☕');
    setFormImageUrl(item.image_url || '');
    setFormBadge(item.badge || '');
    setFormIsAvailable(item.is_available);
    setFormError(null);
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama menu wajib diisi.');
      return;
    }
    const parsedPrice = parseInt(formPrice, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Harga harus berupa angka lebih besar dari Rp 0.');
      return;
    }

    setIsSavingMenu(true);
    setFormError(null);
    try {
      if (editingItem) {
        await onUpdateMenu?.(editingItem.id, {
          name: formName.trim(),
          category: formCategory,
          price: parsedPrice,
          description: formDescription.trim(),
          emoji: formEmoji.trim() || '☕',
          image_url: formImageUrl.trim(),
          badge: formBadge.trim(),
          is_available: formIsAvailable,
        });
      } else {
        await onCreateMenu?.({
          name: formName.trim(),
          category: formCategory,
          price: parsedPrice,
          description: formDescription.trim(),
          emoji: formEmoji.trim() || '☕',
          image_url: formImageUrl.trim(),
          badge: formBadge.trim(),
          is_available: formIsAvailable,
        });
      }
      setIsMenuModalOpen(false);
    } catch (err) {
      console.error('Error saving menu:', err);
      setFormError('Gagal menyimpan menu. Silakan coba lagi.');
    } finally {
      setIsSavingMenu(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeletingMenu(true);
    try {
      await onDeleteMenu?.(deletingItem.id);
      setDeletingItem(null);
    } catch (err) {
      console.error('Error deleting menu:', err);
    } finally {
      setIsDeletingMenu(false);
    }
  };

  // Stock Counters
  const totalMenuItems = menu.length;
  const availableMenuItems = menu.filter((m) => m.is_available).length;
  const outOfStockMenuItems = menu.filter((m) => !m.is_available).length;

  // Filter menu in Tab 2
  const filteredMenu = menu.filter((m) => {
    const matchCat = menuCategory === 'Semua' || m.category === menuCategory;
    const matchSearch =
      menuSearch.trim() === '' ||
      m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(menuSearch.toLowerCase()));
    const matchStock =
      menuStockFilter === 'semua' ||
      (menuStockFilter === 'tersedia' && m.is_available) ||
      (menuStockFilter === 'habis' && !m.is_available);
    return matchCat && matchSearch && matchStock;
  });

  return (
    <div className="w-full max-w-6xl mx-auto pb-24">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
            Dasbor Kedai Senja
          </h1>
        </div>

        {/* Refresh and status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all active-press disabled:opacity-50"
          >
            <ArrowsClockwise size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Sinkronkan Data</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation with beUI Shared Layout Pill */}
      <div className="flex gap-2 p-1.5 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-2xl mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-[var(--text-main)] font-extrabold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-active-tab-pill"
                  className="absolute inset-0 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm -z-10"
                  transition={SPRING_LAYOUT}
                />
              )}
              <Icon size={16} weight={isActive ? 'bold' : 'regular'} />
              <span>{tab.label}</span>
              {tab.key === 'pesanan' && ordersNew.length + ordersCooking.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--primary)] text-white shadow-2xs">
                  {ordersNew.length + ordersCooking.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PESANAN DAPUR (KANBAN KITCHEN POS) */}
      {/* ==================================================================== */}
      {activeTab === 'pesanan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Baru */}
            <div className="flex flex-col rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                    Baru Masuk
                  </h3>
                </div>
                <AnimatedBadge variant="warning" pulse={ordersNew.length > 0} size="sm">
                  {ordersNew.length}
                </AnimatedBadge>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                <AnimatePresence initial={false}>
                  {ordersNew.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      menu={menu}
                      actionConfig={nextStatusMap.baru}
                      onAction={() => onAdvanceOrder(o.id, nextStatusMap.baru.next)}
                    />
                  ))}
                </AnimatePresence>

                {ordersNew.length === 0 && (
                  <div className="text-center py-12 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-2xl">
                    Tidak ada pesanan baru.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Diproses */}
            <div className="flex flex-col rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                    Sedang Dibuat
                  </h3>
                </div>
                <AnimatedBadge variant="info" size="sm">
                  {ordersCooking.length}
                </AnimatedBadge>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                <AnimatePresence initial={false}>
                  {ordersCooking.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      menu={menu}
                      actionConfig={nextStatusMap.diproses}
                      onAction={() => onAdvanceOrder(o.id, nextStatusMap.diproses.next)}
                    />
                  ))}
                </AnimatePresence>

                {ordersCooking.length === 0 && (
                  <div className="text-center py-12 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-2xl">
                    Dapur sedang santai.
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Siap */}
            <div className="flex flex-col rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                    Siap Ambil / Diantar
                  </h3>
                </div>
                <AnimatedBadge variant="success" pulse={ordersReady.length > 0} size="sm">
                  {ordersReady.length}
                </AnimatedBadge>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                <AnimatePresence initial={false}>
                  {ordersReady.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      menu={menu}
                      actionConfig={nextStatusMap.siap}
                      onAction={() => onAdvanceOrder(o.id, nextStatusMap.siap.next)}
                    />
                  ))}
                </AnimatePresence>

                {ordersReady.length === 0 && (
                  <div className="text-center py-12 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-2xl">
                    Belum ada pesanan yang siap.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selesai / Riwayat Pesanan Section */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] py-2"
            >
              <CheckCircle size={16} weight="bold" />
              <span>
                {showHistory
                  ? 'Sembunyikan Riwayat Pesanan Selesai'
                  : `Lihat Riwayat Pesanan Selesai (${ordersDone.length} Pesanan)`}
              </span>
            </button>

            {showHistory && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mt-3 animate-fade-in">
                {ordersDone.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-subtle)] text-xs space-y-2 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>#{o.id} · a/n {o.customer_name}</span>
                      <span className="text-emerald-700 dark:text-emerald-400">Selesai ✓</span>
                    </div>
                    <div className="text-[var(--text-muted)]">
                      {o.order_type === 'dine' ? `Meja #${o.table_number}` : 'Takeaway'} · {formatTime(o.created_at)}
                    </div>
                    <div className="font-extrabold text-sm text-[var(--primary)] pt-1 border-t border-[var(--border-subtle)]">
                      {formatRupiah(o.total_price)}
                    </div>
                  </div>
                ))}

                {ordersDone.length === 0 && (
                  <div className="col-span-full text-center py-6 text-xs text-[var(--text-muted)]">
                    Belum ada pesanan yang diselesaikan hari ini.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: KELOLA MENU & STOK KEDAI */}
      {/* ==================================================================== */}
      {activeTab === 'menu' && (
        <div className="space-y-5">
          {/* Top Summary & Action Bar */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  <ForkKnife size={22} weight="bold" className="text-[var(--primary)]" />
                  <span>Katalog Menu &amp; Stok Kedai</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Atur ketersediaan stok, harga, deskripsi, dan varian menu yang tampil ke pelanggan secara langsung.
                </p>
              </div>

              {/* Action Button: Tambah Menu */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[var(--primary-hover)] active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                <Plus size={16} weight="bold" />
                <span>+ Tambah Menu Baru</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-subtle)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center flex-none">
                  <Package size={20} weight="bold" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Total Menu</span>
                  <span className="text-lg font-extrabold text-[var(--text-main)]">{totalMenuItems} Menu</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-none">
                  <CheckCircle size={20} weight="fill" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">Stok Tersedia</span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{availableMenuItems} Aktif</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 flex items-center justify-center flex-none">
                  <WarningCircle size={20} weight="fill" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-red-800 dark:text-red-300 block">Stok Habis</span>
                  <span className="text-lg font-extrabold text-red-700 dark:text-red-400">{outOfStockMenuItems} Kosong</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                {['Semua', 'Kopi', 'Non-Kopi', 'Makanan'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMenuCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      menuCategory === cat
                        ? 'bg-[var(--primary)] text-white shadow-2xs'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Stock Status Filter */}
              <div className="flex gap-1.5 bg-[var(--bg-muted)] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMenuStockFilter('semua')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    menuStockFilter === 'semua'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Semua ({totalMenuItems})
                </button>
                <button
                  type="button"
                  onClick={() => setMenuStockFilter('tersedia')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    menuStockFilter === 'tersedia'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shadow-2xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Tersedia ({availableMenuItems})
                </button>
                <button
                  type="button"
                  onClick={() => setMenuStockFilter('habis')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    menuStockFilter === 'habis'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 shadow-2xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Habis ({outOfStockMenuItems})
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-light)]"
                />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Cari nama menu atau deskripsi..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                />
                {menuSearch && (
                  <button
                    type="button"
                    onClick={() => setMenuSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--border-subtle)] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <span>Daftar Menu ({filteredMenu.length})</span>
              <span>Aksi &amp; Status Stok</span>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]/70">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--bg-muted)]/20 px-2 rounded-2xl"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="relative w-14 h-14 rounded-2xl bg-[var(--bg-muted)] overflow-hidden flex-none border border-[var(--border-subtle)] shadow-2xs">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          sizes="56px"
                          unoptimized={item.image_url.startsWith('http')}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {item.emoji}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-[var(--text-main)] truncate font-serif">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                          {item.category}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20">
                            {item.badge}
                          </span>
                        )}
                        {!item.is_available && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                            Stok Habis
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1 max-w-xl">
                          {item.description}
                        </p>
                      )}

                      <div className="text-xs font-extrabold text-[var(--primary)] pt-0.5">
                        {formatRupiah(item.price)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions Group */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Stock Availability Toggle Button */}
                    <button
                      type="button"
                      onClick={() => onToggleAvailability(item.id, item.is_available)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active-press border cursor-pointer ${
                        item.is_available
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      }`}
                      title={item.is_available ? 'Klik untuk tandai Stok Habis' : 'Klik untuk aktifkan Stok'}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                        }`}
                      />
                      <span>{item.is_available ? 'Tersedia' : 'Habis · Aktifkan'}</span>
                    </button>

                    {/* Edit Menu Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                      title="Edit Detail Menu"
                    >
                      <PencilSimple size={16} weight="bold" />
                    </button>

                    {/* Delete Menu Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="p-2 rounded-xl border border-red-200/50 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Hapus Menu dari Katalog"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredMenu.length === 0 && (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
                    <Package size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[var(--text-main)]">
                      Tidak ada menu yang sesuai
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                      Coba ganti kata kunci pencarian, ubah filter kategori, atau tambahkan menu baru ke katalog kedai.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all cursor-pointer mt-2"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Tambah Menu Baru Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: KELOLA MEJA & KODE QR */}
      {/* ==================================================================== */}
      {activeTab === 'meja' && (
        <TableManager orders={orders} />
      )}

      {/* ==================================================================== */}
      {/* TAB 4: LAPORAN PENJUALAN & ANALITIK */}
      {/* ==================================================================== */}
      {activeTab === 'laporan' && (
        <div className="space-y-6">
          {/* Top Metric Cards with AnimatedNumber */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-xs font-medium text-[var(--text-muted)] block">
                Pesanan Hari Ini
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-[var(--text-main)]">
                  <AnimatedNumber value={orders.length} />
                </span>
                <span className="text-xs text-[var(--text-muted)]">transaksi</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-xs font-medium text-[var(--text-muted)] block">
                Total Omzet
              </span>
              <div className="mt-1">
                <span className="text-2xl font-extrabold text-[var(--primary)]">
                  <AnimatedNumber value={totalRevenue} prefix="Rp " />
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-xs font-medium text-[var(--text-muted)] block">
                Rata-rata Pesanan (AOV)
              </span>
              <div className="mt-1">
                <span className="text-2xl font-extrabold text-[var(--text-main)]">
                  <AnimatedNumber value={avgOrder} prefix="Rp " />
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-xs font-medium text-[var(--text-muted)] block">
                Tipe Pesanan
              </span>
              <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-[var(--text-main)]">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  Meja: {dineCount}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  Takeaway: {takeCount}
                </span>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[var(--text-main)] flex items-center gap-2">
                  <TrendUp size={20} weight="bold" className="text-[var(--primary)]" />
                  <span>Menu Paling Laris (Top Seller)</span>
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {topItems.map(([id, item], idx) => {
                const percent = Math.round((item.qty / maxQty) * 100);
                return (
                  <div key={id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] text-[11px] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--text-muted)] font-normal">
                          {formatRupiah(item.revenue)}
                        </span>
                        <span className="font-bold text-[var(--primary)]">
                          {item.qty} porsi
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2.5 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {topItems.length === 0 && (
                <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                  Belum ada transaksi terekam untuk dianalisis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: PENGUMUMAN & TEKS BERJALAN (MARQUEE) */}
      {/* ==================================================================== */}
      {activeTab === 'pengumuman' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="pb-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <Megaphone size={22} weight="bold" className="text-[var(--primary)]" />
              <span>Pengaturan Teks Berjalan (Running Text)</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Teks ini tampil terus berjalan di bagian atas katalog menu pelanggan (Kiosk &amp; Meja QR).
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              Pratinjau Langsung (Live Preview Pelanggan)
            </span>
            <div className="p-3 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] overflow-hidden shadow-2xs">
              <Marquee speed={28} className="text-xs text-[var(--text-muted)] font-medium">
                {parseAnnouncementItems(draftAnnouncement).map((item, idx) => (
                  <React.Fragment key={idx}>
                    <span className="inline-flex items-center gap-1.5 text-[var(--text-main)] font-semibold">
                      {item}
                    </span>
                    <span className="text-[var(--text-light)] select-none">•</span>
                  </React.Fragment>
                ))}
              </Marquee>
            </div>
          </div>

          {/* Textarea Input */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)] block">
                Isi Teks Pengumuman <span className="text-[var(--text-muted)] font-normal">(Gunakan pemisah pipa <code className="px-1.5 py-0.5 rounded bg-[var(--bg-muted)] font-mono text-[var(--primary)] font-bold">|</code> atau baris baru / Enter)</span>
              </label>
              <button
                type="button"
                onClick={() => setDraftAnnouncement((prev) => (prev ? `${prev} | ` : ''))}
                className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] hover:bg-[var(--bg-surface)] text-[11px] font-bold text-[var(--text-main)] transition-all cursor-pointer self-start sm:self-auto"
                title="Sisipkan tanda pipa pemisah"
              >
                + Sisipkan Pemisah ( | )
              </button>
            </div>
            <textarea
              rows={4}
              value={draftAnnouncement}
              onChange={(e) => setDraftAnnouncement(e.target.value)}
              placeholder="Contoh: Diskon 20% Espresso Hari Ini | Pastry Fresh Normandia | Free Wifi Cepat (atau pisahkan dengan Enter)"
              className="w-full px-4 py-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 leading-relaxed resize-none"
            />
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
              <span>Tips: Pasang emoji seperti ☕, 🥐, ⚡, 🍯 untuk menambah daya tarik.</span>
              <span className="font-mono">{draftAnnouncement.length} karakter</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[var(--text-main)] block">
              Pilihan Cepat / Template Siap Pakai:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setDraftAnnouncement(
                    '☕ Diskon 20% Espresso & Americano hingga 11:00 | 🥐 Pastry Normandia Panggang Hangat | ⚡ Pesan langsung dari meja'
                  )
                }
                className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] text-left transition-all active-press cursor-pointer"
              >
                <div className="text-xs font-bold text-[var(--text-main)]">Promo Pagi Hari</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                  Diskon 20% espresso, pastry hangat, pesan dari meja
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDraftAnnouncement(
                    '🌱 Single Origin Gayo Washed & Flores Bajawa Baru Masuk | 🍯 Gula Aren Organik Pilihan | ☕ Coba Manual Brew Hari Ini'
                  )
                }
                className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] text-left transition-all active-press cursor-pointer"
              >
                <div className="text-xs font-bold text-[var(--text-main)]">Biji Kopi Spesial</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                  Biji single origin baru datang dan manual brew
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDraftAnnouncement(
                    '✨ Buka Setiap Hari 08:00 - 23:00 | 📶 Free WiFi Kencang & Stopkontak di Setiap Meja | 🎵 Suasana Santai Nyaman'
                  )
                }
                className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] text-left transition-all active-press cursor-pointer"
              >
                <div className="text-xs font-bold text-[var(--text-main)]">Fasilitas & Jam Buka</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                  Jam operasional, WiFi kencang, dan stopkontak
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handleSaveAnnouncement}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[var(--primary-hover)] transition-all active-press cursor-pointer flex items-center justify-center gap-2"
            >
              {isSavedAnnouncement ? (
                <>
                  <Check size={16} weight="bold" />
                  <span>Teks Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Sparkle size={16} weight="fill" />
                  <span>Simpan Perubahan Teks</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setDraftAnnouncement(DEFAULT_ANNOUNCEMENT)}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-semibold hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              Reset ke Teks Bawaan
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: TAMBAH / EDIT MENU */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={SPRING_LAYOUT}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)] font-serif flex items-center gap-2">
                    {editingItem ? (
                      <>
                        <PencilSimple size={20} weight="bold" className="text-[var(--primary)]" />
                        <span>Edit Menu: {editingItem.name}</span>
                      </>
                    ) : (
                      <>
                        <Plus size={20} weight="bold" className="text-[var(--primary)]" />
                        <span>Tambah Menu Baru</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {editingItem
                      ? 'Perbarui informasi dan ketersediaan menu di katalog kedai.'
                      : 'Lengkapi formulir untuk menambahkan varian menu baru.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Error Alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <WarningCircle size={16} weight="fill" className="flex-none" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSaveMenu} className="space-y-4">
                {/* Nama Menu */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] block">
                    Nama Menu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Kopi Susu Pandan Wangi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                  />
                </div>

                {/* Kategori & Harga Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kategori */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-main)] block">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-[var(--bg-muted)] p-1 rounded-xl">
                      {['Kopi', 'Non-Kopi', 'Makanan'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormCategory(cat)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            formCategory === cat
                              ? 'bg-[var(--primary)] text-white shadow-2xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Harga */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-main)] block">
                      Harga (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="25000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Badge Promosi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] block">
                    Badge Promosi (Opsional)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {badgePresets.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setFormBadge(formBadge === b ? '' : b)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          formBadge === b
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xs'
                            : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-transparent hover:border-[var(--border-subtle)]'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                    {formBadge && !badgePresets.includes(formBadge) && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--primary)] text-white">
                        {formBadge}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="Atau ketik badge kustom (e.g. Signature, Halal)"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                  />
                </div>

                {/* Ikon Emoji */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] block">
                    Ikon Emoji
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {emojiPresets.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setFormEmoji(em)}
                        className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer border ${
                          formEmoji === em
                            ? 'border-[var(--primary)] bg-[var(--primary-light)] scale-110 shadow-2xs'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Foto / Gambar Menu */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-main)] block flex items-center gap-1.5">
                    <ImageIcon size={14} />
                    <span>Pilihan Foto Menu</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {imagePresets.map((preset) => {
                      const isSelected = formImageUrl === preset.url;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormImageUrl(preset.url)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[var(--primary)] bg-[var(--primary-light)]/60 shadow-2xs ring-1 ring-[var(--primary)]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]/50'
                          }`}
                        >
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[var(--bg-muted)] flex-none border border-[var(--border-subtle)]">
                            {preset.url ? (
                              <Image
                                src={preset.url}
                                alt={preset.label}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">
                                ✨
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-[var(--text-main)] truncate">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Atau tempel URL gambar eksternal (https://...)"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 font-mono"
                  />
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] block">
                    Deskripsi Rasa &amp; Bahan
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Contoh: Espresso ganda mantap dengan sirup pandan wangi dan susu segar lembut."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
                  />
                </div>

                {/* Status Ketersediaan Awal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] block">
                    Status Ketersediaan Awal
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsAvailable(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        formIsAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-transparent'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Tersedia (Bisa Dipesan)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsAvailable(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        !formIsAvailable
                          ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700 shadow-2xs'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-transparent'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Stok Habis (Tidak Bisa Dipesan)</span>
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setIsMenuModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMenu}
                    className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[var(--primary-hover)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingMenu ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} weight="bold" />
                        <span>{editingItem ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL: KONFIRMASI HAPUS MENU */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={SPRING_LAYOUT}
              className="bg-[var(--bg-surface)] border border-red-200/50 dark:border-red-900/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <Trash size={28} weight="bold" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-[var(--text-main)]">
                  Hapus Menu dari Katalog?
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Apakah Anda yakin ingin menghapus <strong className="text-[var(--text-main)] font-semibold">“{deletingItem.name}”</strong>?
                  Menu ini akan dihapus secara permanen dari daftar pesanan kedai.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingMenu}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDeletingMenu ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Ya, Hapus</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponent: Individual Kanban Order Card
function OrderCard({
  order,
  menu,
  actionConfig,
  onAction,
}: {
  order: Order;
  menu: MenuItem[];
  actionConfig: { next: OrderStatus; label: string };
  onAction: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const menuMap = new Map(menu.map((m) => [m.id, m]));

  const handleAction = async () => {
    setIsUpdating(true);
    try {
      await onAction();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      transition={SPRING_LAYOUT}
      className="p-4 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-subtle)] shadow-2xs hover:border-[var(--border-strong)] transition-colors space-y-3"
    >
      {/* Top Card Info */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]/70">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)]">
            #{order.id}
          </span>
          <span className="text-xs font-semibold text-[var(--text-main)]">
            {order.order_type === 'dine' ? `Meja #${order.table_number}` : 'Takeaway'}
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-muted)] font-medium">
          {formatTime(order.created_at)}
        </span>
      </div>

      {/* Customer Name */}
      <div className="font-bold text-sm text-[var(--text-main)]">
        a/n {order.customer_name}
      </div>

      {/* Items List */}
      <div className="space-y-1 text-xs">
        {order.order_items && order.order_items.length > 0 ? (
          order.order_items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-center text-[var(--text-main)]">
              <span className="font-medium">
                <span className="font-bold text-[var(--primary)]">{it.quantity}×</span> {it.item_name}
              </span>
              <span className="text-[var(--text-muted)]">{formatRupiah(it.price * it.quantity)}</span>
            </div>
          ))
        ) : order.items ? (
          Object.entries(order.items).map(([id, qty]) => {
            const m = menuMap.get(id);
            return (
              <div key={id} className="flex justify-between items-center text-[var(--text-main)]">
                <span className="font-medium">
                  <span className="font-bold text-[var(--primary)]">{qty}×</span> {m ? m.name : `Item #${id}`}
                </span>
                <span className="text-[var(--text-muted)]">
                  {m ? formatRupiah(m.price * qty) : ''}
                </span>
              </div>
            );
          })
        ) : null}
      </div>

      {/* Barista Notes Callout */}
      {order.notes && (
        <div className="p-2.5 rounded-xl bg-[var(--primary-light)]/80 dark:bg-[var(--primary-light)]/40 border border-[var(--border-strong)] text-xs text-[var(--text-main)] shadow-2xs">
          <span className="font-extrabold text-[var(--primary)] uppercase tracking-wider text-[10px] mr-1">Catatan:</span>
          <span className="font-medium italic">“{order.notes}”</span>
        </div>
      )}

      {/* Price & Action Button */}
      <div className="pt-2 border-t border-[var(--border-subtle)]/70 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-[var(--text-muted)] block">Total Bayar:</span>
          <span className="font-extrabold text-sm text-[var(--primary)]">
            {formatRupiah(order.total_price)}
          </span>
        </div>

        <motion.button
          type="button"
          onClick={handleAction}
          disabled={isUpdating}
          whileHover={isUpdating ? undefined : { scale: 1.04 }}
          whileTap={isUpdating ? undefined : { scale: 0.95 }}
          transition={SPRING_PRESS}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
        >
          {isUpdating ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{actionConfig.label}</span>
              <ArrowRight size={13} weight="bold" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
