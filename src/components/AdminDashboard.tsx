'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { isSupabaseConfigured, shouldShowDbStatus } from '@/lib/supabase';
import { MenuItem, Order, OrderStatus, PaymentMethod, CafeProfile, StaffMembership } from '@/lib/types';
import {
  formatRupiah,
  formatTime,
  DEFAULT_ANNOUNCEMENT,
  fetchStaffMembers,
  addStaffMember,
  deleteStaffMember,
  fetchCafeProfile,
  updateCafeProfile,
  DEFAULT_CAFE_ID,
} from '@/lib/store';
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
  Check,
  Sparkle,
  Plus,
  PencilSimple,
  Trash,
  X,
  Package,
  WarningCircle,
  Image as ImageIcon,
  Database,
  Sun,
  Moon,
  SignOut,
  ArrowLeft,
  User,
  Copy,
  Money,
  CreditCard,
  ShieldCheck,
  Drop,
  Cookie,
  Coffee,
} from '@phosphor-icons/react';
import {
  CookingPot,
  UtensilsCrossed,
  QrCode as LucideQrCode,
  BarChart3,
  ArrowLeft as LucideArrowLeft,
  LogOut as LucideLogOut,
  Database as LucideDatabase,
  RotateCw as LucideRotateCw,
  Sun as LucideSun,
  Moon as LucideMoon,
  User as LucideUser,
  Copy as LucideCopy,
  Check as LucideCheck,
  X as LucideX,
  GripVertical,
  ArrowDown as LucideArrowDown,
  Users as LucideUsers,
  Store as LucideStore,
  CreditCard as LucideCreditCard,
  Ban as LucideBan,
  ShieldCheck as LucideShieldCheck,
  Info as LucideInfo,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPRING_LAYOUT, SPRING_PRESS } from '@/lib/ease';
import { cn } from '@/lib/utils';
import {
  AnimatedSidebarProvider,
  AnimatedSidebar,
  AnimatedSidebarHeader,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarGroupContent,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuButton,
  AnimatedSidebarTrigger,
  AnimatedSidebarRail,
  AnimatedSidebarInset,
} from '@/components/motion/animated-sidebar';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { AnimatedBadge } from '@/components/motion/AnimatedBadge';
import { TableManager } from './TableManager';
import { CashierOrderModal } from './CashierOrderModal';
import { MenuIcon } from './MenuIcon';

interface AdminDashboardProps {
  orders: Order[];
  menu: MenuItem[];
  userRole?: 'staff' | 'owner';
  onRoleChange?: (role: 'staff' | 'owner') => void;
  onAdvanceOrder: (
    orderId: string,
    nextStatus: OrderStatus,
    options?: { paymentMethod?: PaymentMethod; cancellationReason?: string }
  ) => Promise<void>;
  onToggleAvailability: (itemId: string, current: boolean) => Promise<void>;
  onCreateMenu?: (itemData: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenu?: (itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  onDeleteMenu?: (itemId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  announcementText?: string;
  onUpdateAnnouncement?: (text: string) => Promise<void> | void;
  authUser?: SupabaseUser | null;
  onSignOut?: () => void;
  onSwitchToCustomer?: () => void;
}

export function AdminDashboard({
  orders,
  menu,
  userRole = 'owner',
  onRoleChange,
  onAdvanceOrder,
  onToggleAvailability,
  onCreateMenu,
  onUpdateMenu,
  onDeleteMenu,
  onRefresh,
  isRefreshing,
  announcementText,
  onUpdateAnnouncement,
  authUser,
  onSignOut,
  onSwitchToCustomer,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pesanan' | 'menu' | 'meja' | 'laporan' | 'staf' | 'profil'>('pesanan');
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [menuCategory, setMenuCategory] = useState<string>('Semua');
  const [menuStockFilter, setMenuStockFilter] = useState<'semua' | 'tersedia' | 'habis'>('semua');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [draftAnnouncement, setDraftAnnouncement] = useState<string>(announcementText || DEFAULT_ANNOUNCEMENT);
  const [prevAnnouncement, setPrevAnnouncement] = useState<string | undefined>(announcementText);
  const [isSavedAnnouncement, setIsSavedAnnouncement] = useState<boolean>(false);

  // Theme & Supabase Connection States (Hydration-Safe)
  const [mounted, setMounted] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [supabaseConnected] = useState<boolean>(() => isSupabaseConfigured());
  const [showDbStatus] = useState<boolean>(() => shouldShowDbStatus());
  const [showDbModal, setShowDbModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      const savedTheme = localStorage.getItem('menukita_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const activeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      setIsDark(activeDark);
      if (activeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('menukita_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('menukita_theme', 'dark');
      setIsDark(true);
    }
  };

  const copySqlInstruction = async () => {
    try {
      const res = await fetch('/api/schema-sql');
      const sqlText = await res.text();
      await navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      navigator.clipboard.writeText('-- Silakan buka file supabase/schema.sql di repo project');
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  // Cashier Walk-in Order Modal State
  const [isCashierModalOpen, setIsCashierModalOpen] = useState<boolean>(false);

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
  const [formIcon, setFormIcon] = useState<string>('coffee');
  const [formImageUrl, setFormImageUrl] = useState<string>('/images/kopi-susu-aren.jpg');
  const [formBadge, setFormBadge] = useState<string>('');
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Payment and Cancel modals state
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  // Tabs Definition based on RBAC roles (staff vs owner)
  const allTabs = [
    { key: 'pesanan', label: 'Pesanan Dapur', icon: CookingPot, roles: ['staff', 'owner'] },
    {
      key: 'menu',
      label: userRole === 'staff' ? 'Ketersediaan Menu' : 'Kelola Menu',
      icon: UtensilsCrossed,
      roles: ['staff', 'owner'],
    },
    { key: 'meja', label: 'Kelola Meja & QR', icon: LucideQrCode, roles: ['owner'] },
    { key: 'laporan', label: 'Laporan Penjualan', icon: BarChart3, roles: ['owner'] },
    { key: 'staf', label: 'Kelola Staf', icon: LucideUsers, roles: ['owner'] },
    { key: 'profil', label: 'Profil Kedai', icon: LucideStore, roles: ['owner'] },
  ] as const;

  const tabs = allTabs.filter((t) => (t.roles as readonly string[]).includes(userRole));

  // Enforce staff constraint: cannot view owner-only tabs
  useEffect(() => {
    if (userRole === 'staff' && activeTab !== 'pesanan' && activeTab !== 'menu') {
      const frame = requestAnimationFrame(() => setActiveTab('pesanan'));
      return () => cancelAnimationFrame(frame);
    }
  }, [userRole, activeTab]);

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
  const ordersCanceled = orders.filter((o) => o.status === 'dibatalkan');

  // Drag and Drop (Kanban Kitchen POS) State - Touchscreen & Mouse
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<'baru' | 'diproses' | 'siap' | null>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState<boolean>(false);
  const touchStartRef = React.useRef<{ x: number; y: number; order: Order } | null>(null);

  const handleDragStart = (order: Order) => {
    setDraggedOrder(order);
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setActiveDropCol(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, colId: 'baru' | 'diproses' | 'siap') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropCol !== colId) {
      setActiveDropCol(colId);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setActiveDropCol(null);
    }
  };

  const handleColumnDrop = async (e: React.DragEvent, colId: 'baru' | 'diproses' | 'siap') => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrder?.id;
    setActiveDropCol(null);
    setDraggedOrder(null);
    if (orderId) {
      const order = orders.find((o) => o.id === orderId);
      if (order && order.status !== colId) {
        await onAdvanceOrder(orderId, colId);
      }
    }
  };

  // Touch handlers for touchscreen monitor
  const handleTouchStart = (order: Order, e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, order };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      if (!isTouchDragging) {
        setIsTouchDragging(true);
        setDraggedOrder(touchStartRef.current.order);
      }
      setTouchPos({ x: t.clientX, y: t.clientY });

      // Detect target column under finger position
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const colEl = el?.closest('[data-column-id]');
      const colId = colEl?.getAttribute('data-column-id') as 'baru' | 'diproses' | 'siap' | null;
      if (colId && (colId === 'baru' || colId === 'diproses' || colId === 'siap')) {
        setActiveDropCol(colId);
      } else {
        setActiveDropCol(null);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isTouchDragging && touchStartRef.current && activeDropCol) {
      const order = touchStartRef.current.order;
      if (activeDropCol !== order.status) {
        await onAdvanceOrder(order.id, activeDropCol);
      }
    }
    touchStartRef.current = null;
    setIsTouchDragging(false);
    setTouchPos(null);
    setDraggedOrder(null);
    setActiveDropCol(null);
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    setIsTouchDragging(false);
    setTouchPos(null);
    setDraggedOrder(null);
    setActiveDropCol(null);
  };

  const kanbanColumns: {
    id: 'baru' | 'diproses' | 'siap';
    title: string;
    dotColor: string;
    badgeVariant: 'warning' | 'info' | 'success';
    orders: Order[];
    emptyText: string;
    actionKey: 'baru' | 'diproses' | 'siap';
  }[] = [
    {
      id: 'baru',
      title: 'Baru Masuk',
      dotColor: 'bg-amber-500 animate-pulse',
      badgeVariant: 'warning',
      orders: ordersNew,
      emptyText: 'Tidak ada pesanan baru.',
      actionKey: 'baru',
    },
    {
      id: 'diproses',
      title: 'Sedang Dibuat',
      dotColor: 'bg-blue-500',
      badgeVariant: 'info',
      orders: ordersCooking,
      emptyText: 'Dapur sedang santai.',
      actionKey: 'diproses',
    },
    {
      id: 'siap',
      title: 'Siap Ambil / Diantar',
      dotColor: 'bg-emerald-500',
      badgeVariant: 'success',
      orders: ordersReady,
      emptyText: 'Belum ada pesanan yang siap.',
      actionKey: 'siap',
    },
  ];

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
    { label: 'Tanpa Foto (Hanya Ikon)', url: '' },
  ];

  const iconPresets = [
    { id: 'coffee', label: 'Kopi', icon: Coffee },
    { id: 'drop', label: 'Teh/Susu', icon: Drop },
    { id: 'cookie', label: 'Pastry/Roti', icon: Cookie },
    { id: 'food', label: 'Makanan', icon: ForkKnife },
    { id: 'snack', label: 'Camilan', icon: CookingPot },
  ];
  const badgePresets = ['Favorit', 'Best Seller', 'Baru', 'Promo', 'Klasik', 'Fresh Bake', 'Camilan'];

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Kopi');
    setFormPrice('');
    setFormDescription('');
    setFormIcon('coffee');
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
    setFormIcon(item.icon || 'coffee');
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
          icon: formIcon,
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
          icon: formIcon,
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
    <AnimatedSidebarProvider defaultOpen={true}>
      <div className="h-screen w-screen flex overflow-hidden bg-[var(--bg-primary)] text-[var(--text-main)] fixed inset-0 z-40">
        {/* Animated Sidebar Navigation */}
        <AnimatedSidebar
          collapsible="icon"
          variant="sidebar"
          ariaLabel="Navigasi Dasbor Pemilik"
          className="border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 h-full"
        >
          {/* Header Branding Tunggal (Logo Asli) */}
          <AnimatedSidebarHeader className="h-16 px-4 border-b border-[var(--border-subtle)] flex flex-row items-center gap-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] border border-[var(--border-subtle)] flex items-center justify-center p-1.5 shadow-2xs shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Logo Kedai Senja"
                  width={24}
                  height={24}
                  style={{ width: 'auto', height: 'auto' }}
                  className="w-6 h-6 object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-[var(--text-main)] truncate tracking-tight font-serif">
                  Kedai Senja
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate font-medium">
                  Panel Pemilik
                </span>
              </div>
            </div>
          </AnimatedSidebarHeader>

          {/* Sidebar Menu Group */}
          <AnimatedSidebarContent className="p-2 space-y-4 flex-1 overflow-y-auto">
            <AnimatedSidebarGroup>
              <AnimatedSidebarGroupContent>
                <AnimatedSidebarMenu className="gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    const count =
                      tab.key === 'pesanan' ? ordersNew.length + ordersCooking.length : 0;
                    return (
                      <AnimatedSidebarMenuItem key={tab.key}>
                        <AnimatedSidebarMenuButton
                          isActive={isActive}
                          onSelect={() => setActiveTab(tab.key)}
                          icon={
                            <Icon
                              className={cn(
                                'size-4.5 shrink-0 transition-colors',
                                isActive ? 'text-[var(--primary)] stroke-[2.2px]' : 'text-[var(--text-muted)] stroke-[1.8px]'
                              )}
                            />
                          }
                          badge={
                            count > 0 ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--primary)] text-white shadow-2xs">
                                {count}
                              </span>
                            ) : undefined
                          }
                          className={cn(
                            'transition-all',
                            isActive
                              ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold shadow-2xs'
                              : 'hover:bg-[var(--bg-muted)]/70'
                          )}
                        >
                          {tab.label}
                        </AnimatedSidebarMenuButton>
                      </AnimatedSidebarMenuItem>
                    );
                  })}
                </AnimatedSidebarMenu>
              </AnimatedSidebarGroupContent>
            </AnimatedSidebarGroup>
          </AnimatedSidebarContent>

          {/* Sidebar Footer: Switch Pelanggan */}
          <AnimatedSidebarFooter className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {onSwitchToCustomer && (
              <button
                type="button"
                onClick={onSwitchToCustomer}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                title="Beralih ke Tampilan Menu Pelanggan"
              >
                <LucideArrowLeft className="size-4 shrink-0" />
                <span className="truncate">Menu Pelanggan</span>
              </button>
            )}
          </AnimatedSidebarFooter>

          <AnimatedSidebarRail />
        </AnimatedSidebar>

        {/* Inset Main Content Area */}
        <AnimatedSidebarInset className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--bg-primary)]">
          {/* Merged Top Bar (Menyatukan fitur sticky-top ke dalam Inset) */}
          <header className="h-16 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 flex items-center justify-between gap-3 shadow-2xs">
            {/* Sisi Kiri: Trigger Tunggal + Judul Halaman Aktif */}
            <div className="flex items-center gap-3 min-w-0">
              <AnimatedSidebarTrigger />
              <div className="truncate">
                <h1 className="text-base sm:text-lg font-bold text-[var(--text-main)] truncate tracking-tight font-serif">
                  {tabs.find((t) => t.key === activeTab)?.label}
                </h1>
                <p className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">
                  {activeTab === 'pesanan' && 'Pantau antrean pesanan dapur & kasir (KDS) secara real-time'}
                  {activeTab === 'menu' &&
                    (userRole === 'staff'
                      ? 'Lihat katalog & ubah ketersediaan menu (Tersedia / Habis)'
                      : 'Kelola katalog menu lengkap, harga, dan ketersediaan')}
                  {activeTab === 'meja' && 'Kelola titik meja, token QR dinamis, dan cetak kode QR meja'}
                  {activeTab === 'laporan' && 'Laporan penjualan kedai, ringkasan omset, dan ranking menu'}
                  {activeTab === 'staf' && 'Kelola keanggotaan dan hak akses akun staf kedai'}
                  {activeTab === 'profil' && 'Pengaturan informasi kedai dan status buka/tutup'}
                </p>
              </div>
            </div>

            {/* Sisi Kanan: Role Indicator / Switcher, DB Status, Refresh, Dark Mode, Quick Return, dan Profile */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Role Indicator: Badge tetap saat login, switcher hanya saat simulasi lokal */}
              {authUser ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-main)] shadow-2xs">
                  {userRole === 'owner' ? (
                    <>
                      <LucideShieldCheck className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="hidden sm:inline">Pemilik Kedai</span>
                      <span className="sm:hidden">Owner</span>
                    </>
                  ) : (
                    <>
                      <CookingPot className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="hidden sm:inline">Staf Barista &amp; Kasir</span>
                      <span className="sm:hidden">Staf</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center p-0.5 rounded-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] text-xs">
                  <button
                    type="button"
                    onClick={() => onRoleChange?.('staff')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold transition-all text-xs cursor-pointer',
                      userRole === 'staff'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    )}
                    title="Beralih ke Role Staf (Barista + Kasir)"
                  >
                    <CookingPot className="size-3.5" />
                    <span className="hidden md:inline">Staf (Barista &amp; Kasir)</span>
                    <span className="md:hidden">Staf</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRoleChange?.('owner')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold transition-all text-xs cursor-pointer',
                      userRole === 'owner'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    )}
                    title="Beralih ke Role Pemilik (Akses Penuh)"
                  >
                    <LucideShieldCheck className="size-3.5" />
                    <span>Pemilik</span>
                  </button>
                </div>
              )}

              {/* Supabase Status Pill (Hanya di preview / disembunyikan di production) */}
              {showDbStatus && (
                <button
                  type="button"
                  onClick={() => setShowDbModal(true)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${supabaseConnected
                      ? 'bg-emerald-500/10 text-emerald-900 border-emerald-600/30 hover:bg-emerald-500/15 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-500/10 text-amber-900 border-amber-600/30 hover:bg-amber-500/15 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'
                    }`}
                  title="Status Database Supabase (Klik untuk detail skema)"
                >
                  <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <LucideDatabase className="size-3.5" />
                  <span>{supabaseConnected ? 'Supabase Live' : 'Demo Lokal'}</span>
                </button>
              )}

              {/* Refresh Button */}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all cursor-pointer active-press disabled:opacity-50 shadow-2xs"
                title="Sinkronkan data dengan database Supabase"
              >
                <LucideRotateCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
                <span className="hidden md:inline">Sinkronkan</span>
              </button>

              {/* Theme Toggle Button (Hydration-Safe) */}
              <button
                type="button"
                onClick={toggleTheme}
                suppressHydrationWarning
                className="w-8 h-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Ganti Tema Gelap / Terang"
                aria-label="Ganti Tema"
              >
                {mounted && isDark ? <LucideSun className="size-4" /> : <LucideMoon className="size-4" />}
              </button>

              {/* Quick Switch ke Mode Pelanggan */}
              {onSwitchToCustomer && (
                <button
                  type="button"
                  onClick={onSwitchToCustomer}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition-all cursor-pointer shadow-2xs"
                  title="Buka Menu Tampilan Pelanggan"
                >
                  <LucideUser className="size-3.5" />
                  <span>Pelanggan</span>
                </button>
              )}

              {/* Authenticated Admin User Badge & Logout Button */}
              {authUser && (
                <div className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] text-xs shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-[var(--text-muted)] max-w-[130px] truncate" title={authUser.email}>
                    {authUser.email}
                  </span>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="p-1 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-red-600 transition-colors cursor-pointer"
                      title="Keluar dari Akun Pemilik"
                      aria-label="Keluar dari Akun Pemilik"
                    >
                      <LucideLogOut className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Area Konten Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

            {/* ==================================================================== */}
            {/* TAB 1: PESANAN DAPUR (KANBAN KITCHEN POS) */}
            {/* ==================================================================== */}
            {activeTab === 'pesanan' && (
              <div className="space-y-4">
                {/* Touchscreen Helper Banner */}
                <div className="flex items-center justify-between gap-2 px-1 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--primary)] flex items-center justify-center">
                      <GripVertical className="size-3.5" />
                    </span>
                    <span>Tarik kartu untuk pindah status cepat (layar sentuh / mouse) atau klik tombol pada kartu</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {kanbanColumns.map((col) => {
                    const isTarget = activeDropCol === col.id;
                    const isValidTarget = draggedOrder && draggedOrder.status !== col.id;

                    return (
                      <div
                        key={col.id}
                        data-column-id={col.id}
                        onDragOver={(e) => handleColumnDragOver(e, col.id)}
                        onDragLeave={handleColumnDragLeave}
                        onDrop={(e) => handleColumnDrop(e, col.id)}
                        className={cn(
                          'flex flex-col rounded-3xl bg-[var(--bg-surface)] border p-4 shadow-xs transition-all duration-200 min-h-[380px]',
                          isTarget && isValidTarget
                            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/40 bg-[var(--primary-light)]/20 shadow-md scale-[1.01]'
                            : isTarget && !isValidTarget
                            ? 'border-[var(--border-strong)] bg-[var(--bg-muted)]/40'
                            : draggedOrder && isValidTarget
                            ? 'border-dashed border-[var(--primary)]/40'
                            : 'border-[var(--border-subtle)]'
                        )}
                      >
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
                          <div className="flex items-center gap-2">
                            <span className={cn('w-2.5 h-2.5 rounded-full', col.dotColor)} />
                            <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                              {col.title}
                            </h3>
                          </div>
                          <AnimatedBadge
                            variant={col.badgeVariant}
                            pulse={col.id !== 'diproses' && col.orders.length > 0}
                            size="sm"
                          >
                            {col.orders.length}
                          </AnimatedBadge>
                        </div>

                        {/* Drop zone indicator when hovering */}
                        {isTarget && isValidTarget && (
                          <div className="mb-3 p-2.5 border-2 border-dashed border-[var(--primary)] bg-[var(--primary-light)]/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[var(--primary)] animate-pulse">
                            <LucideArrowDown className="size-4 animate-bounce" />
                            <span>Lepas di sini untuk pindah ke &quot;{col.title}&quot;</span>
                          </div>
                        )}

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                          <AnimatePresence initial={false}>
                            {col.orders.map((o) => (
                              <OrderCard
                                key={o.id}
                                order={o}
                                menu={menu}
                                actionConfig={nextStatusMap[col.actionKey]}
                                onAction={() => {
                                  if (nextStatusMap[col.actionKey].next === 'selesai') {
                                    setPaymentModalOrder(o);
                                  } else {
                                    onAdvanceOrder(o.id, nextStatusMap[col.actionKey].next);
                                  }
                                }}
                                onCancel={() => setCancelModalOrder(o)}
                                isDragging={draggedOrder?.id === o.id}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onTouchStartDrag={handleTouchStart}
                                onTouchMoveDrag={handleTouchMove}
                                onTouchEndDrag={handleTouchEnd}
                                onTouchCancelDrag={handleTouchCancel}
                              />
                            ))}
                          </AnimatePresence>

                          {col.orders.length === 0 && !isTarget && (
                            <div className="text-center py-12 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-2xl">
                              {col.emptyText}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selesai & Dibatalkan / Riwayat Pesanan Section */}
                <div className="pt-4 space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] py-2 cursor-pointer"
                  >
                    <CheckCircle size={16} weight="bold" />
                    <span>
                      {showHistory
                        ? 'Sembunyikan Riwayat Pesanan'
                        : `Lihat Riwayat Pesanan (${ordersDone.length} Selesai, ${ordersCanceled.length} Dibatalkan)`}
                    </span>
                  </button>

                  {showHistory && (
                    <div className="space-y-5 animate-fade-in">
                      {/* Pesanan Selesai */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                          Pesanan Selesai ({ordersDone.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                          {ordersDone.map((o) => (
                            <div
                              key={o.id}
                              className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-subtle)] text-xs space-y-2 opacity-90 hover:opacity-100 transition-opacity"
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span>#{o.id} · a/n {o.customer_name}</span>
                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
                                  <Check size={11} weight="bold" />
                                  <span>Lunas ({o.payment_method?.toUpperCase() || 'TUNAI'})</span>
                                </span>
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
                            <div className="col-span-full text-center py-4 text-xs text-[var(--text-muted)]">
                              Belum ada pesanan yang diselesaikan hari ini.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pesanan Dibatalkan */}
                      {ordersCanceled.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]/70">
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                            <LucideBan className="size-3.5" />
                            <span>Pesanan Dibatalkan ({ordersCanceled.length})</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                            {ordersCanceled.map((o) => (
                              <div
                                key={o.id}
                                className="p-4 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-xs space-y-2 opacity-90"
                              >
                                <div className="flex justify-between items-center font-bold">
                                  <span>#{o.id} · a/n {o.customer_name}</span>
                                  <span className="text-red-700 dark:text-red-300 font-semibold text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-800">
                                    Dibatalkan
                                  </span>
                                </div>
                                <div className="text-[var(--text-muted)]">
                                  {o.order_type === 'dine' ? `Meja #${o.table_number}` : 'Takeaway'} · {formatTime(o.created_at)}
                                </div>
                                {o.cancellation_reason && (
                                  <div className="p-2 rounded-xl bg-red-100/60 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-[11px]">
                                    <strong>Alasan:</strong> &ldquo;{o.cancellation_reason}&rdquo;
                                  </div>
                                )}
                                <div className="font-extrabold text-sm text-[var(--text-muted)] line-through pt-1 border-t border-[var(--border-subtle)]">
                                  {formatRupiah(o.total_price)}
                                </div>
                              </div>
                            ))}
                          </div>
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

                    {/* Action Button: Tambah Menu (Hanya Pemilik) */}
                    {userRole === 'owner' ? (
                      <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[var(--primary-hover)] active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                      >
                        <Plus size={16} weight="bold" />
                        <span>+ Tambah Menu Baru</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                        <LucideInfo className="size-4 shrink-0 text-amber-600" />
                        <span>Mode Staf: Hanya ubah ketersediaan menu</span>
                      </div>
                    )}
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${menuCategory === cat
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
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${menuStockFilter === 'semua'
                            ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                      >
                        Semua ({totalMenuItems})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenuStockFilter('tersedia')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${menuStockFilter === 'tersedia'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shadow-2xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                      >
                        Tersedia ({availableMenuItems})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenuStockFilter('habis')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${menuStockFilter === 'habis'
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
                              <div className="w-full h-full flex items-center justify-center text-[var(--primary)]">
                                <MenuIcon category={item.category} name={item.name} size={28} />
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
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active-press border cursor-pointer ${item.is_available
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                              }`}
                            title={item.is_available ? 'Klik untuk tandai Stok Habis' : 'Klik untuk aktifkan Stok'}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                                }`}
                            />
                            <span>{item.is_available ? 'Tersedia' : 'Habis · Aktifkan'}</span>
                          </button>

                          {/* Edit & Delete Menu Buttons (Hanya Pemilik) */}
                          {userRole === 'owner' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                                title="Edit Detail Menu & Harga"
                              >
                                <PencilSimple size={16} weight="bold" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="p-2 rounded-xl border border-red-200/50 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Hapus Menu dari Katalog"
                              >
                                <Trash size={16} weight="bold" />
                              </button>
                            </>
                          )}
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
            {/* TAB 5: KELOLA STAF & KEANGGOTAAN (PEMILIK SAJA) */}
            {/* ==================================================================== */}
            {activeTab === 'staf' && userRole === 'owner' && (
              <StaffManagementTab onRefresh={onRefresh} />
            )}

            {/* ==================================================================== */}
            {/* TAB 6: PROFIL KEDAI & STATUS OPERASIONAL (PEMILIK SAJA) */}
            {/* ==================================================================== */}
            {activeTab === 'profil' && userRole === 'owner' && (
              <CafeProfileTab />
            )}
          </div>
        </AnimatedSidebarInset>
      </div>

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
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${formCategory === cat
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
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${formBadge === b
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

                {/* Pilihan Ikon Menu */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] block">
                    Pilihan Ikon Menu
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {iconPresets.map((ip) => {
                      const IconComp = ip.icon;
                      return (
                        <button
                          key={ip.id}
                          type="button"
                          onClick={() => setFormIcon(ip.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                            formIcon === ip.id
                              ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] shadow-2xs font-bold'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'
                          }`}
                        >
                          <IconComp size={15} weight="duotone" />
                          <span>{ip.label}</span>
                        </button>
                      );
                    })}
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
                          className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${isSelected
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
                              <div className="w-full h-full flex items-center justify-center text-[var(--primary)]">
                                <Sparkle size={14} weight="fill" />
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
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${formIsAvailable
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
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${!formIsAvailable
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

      {/* ==================================================================== */}
      {/* MODAL: KONEKSI DATABASE SUPABASE */}
      {/* ==================================================================== */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDbModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                <Database size={22} weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)] leading-tight font-serif">
                  Koneksi Database Supabase
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Arsitektur Next.js 16 + PostgreSQL Supabase Realtime
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border mb-4 text-xs ${supabaseConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
                }`}
            >
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {supabaseConnected
                  ? 'Status: Terhubung Langsung ke Supabase (Live)'
                  : 'Status: Mode Demo Lokal (LocalStorage Otomatis)'}
              </div>
              <p className="leading-relaxed">
                {supabaseConnected
                  ? 'Aplikasi telah terhubung ke proyek Supabase Anda. Semua perubahan menu dan pesanan disinkronkan secara realtime via PostgreSQL WebSockets.'
                  : 'Aplikasi saat ini berjalan menggunakan penyimpanan lokal browser (LocalStorage) yang responsif dan siap dicoba tanpa konfigurasi awal.'}
              </p>
            </div>

            <div className="space-y-3 text-xs text-[var(--text-main)]">
              <h4 className="font-semibold text-sm text-[var(--text-main)]">
                Langkah Cepat Sambungkan ke Supabase Anda:
              </h4>

              <div className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)] space-y-2">
                <div className="font-mono text-[11px] text-[var(--text-muted)]">
                  1. Buka Dashboard Supabase Anda &gt; <b>SQL Editor</b>.
                </div>
                <div className="font-mono text-[11px] text-[var(--text-muted)]">
                  2. Jalankan skrip database dari file <code className="text-[var(--primary)] font-bold">supabase/schema.sql</code>.
                </div>
                <div className="font-mono text-[11px] text-[var(--text-muted)]">
                  3. Buka <b>Project Settings &gt; API</b>, lalu salin URL dan Anon Key ke file <code className="text-[var(--primary)] font-bold">.env.local</code>:
                </div>
                <pre className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[11px] overflow-x-auto text-[var(--text-main)]">
                  {`NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`}
                </pre>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={copySqlInstruction}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors active-press cursor-pointer"
                >
                  {copiedSql ? <Check size={15} weight="bold" /> : <Copy size={15} weight="bold" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin Perintah SQL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border-strong)] text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ==================================================================== */}
      {/* FLOATING ACTION BUTTON: ORDER KASIR (WALK-IN) */}
      {/* ==================================================================== */}
      <motion.button
        type="button"
        onClick={() => setIsCashierModalOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={SPRING_PRESS}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm shadow-xl shadow-[var(--primary)]/30 border border-white/20 active-press cursor-pointer group"
        title="Input Pesanan Langsung Kasir (Walk-in)"
        aria-label="Tambah Order Kasir Baru"
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
          <Plus size={16} weight="bold" />
        </div>
        <span className="tracking-wide">Order Kasir Baru</span>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] bg-white/15 text-white/90 uppercase tracking-wider font-extrabold">
          POS
        </span>
      </motion.button>

      {/* Cashier Order Modal */}
      <CashierOrderModal
        isOpen={isCashierModalOpen}
        onClose={() => setIsCashierModalOpen(false)}
        menu={menu}
        onOrderCreated={async () => {
          setIsCashierModalOpen(false);
          await onRefresh();
        }}
      />

      {/* Modal Batalkan Pesanan (Wajib Alasan) */}
      {cancelModalOrder && (
        <CancelOrderModal
          order={cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          onConfirm={async (orderId, reason) => {
            await onAdvanceOrder(orderId, 'dibatalkan', { cancellationReason: reason });
            setCancelModalOrder(null);
          }}
        />
      )}

      {/* Modal Catat Pembayaran & Selesaikan Pesanan */}
      {paymentModalOrder && (
        <PaymentCompleteModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onConfirm={async (orderId, method) => {
            await onAdvanceOrder(orderId, 'selesai', { paymentMethod: method });
            setPaymentModalOrder(null);
          }}
        />
      )}

      {/* Floating Drag Preview for Touchscreen */}
      {isTouchDragging && draggedOrder && touchPos && (
        <div
          style={{
            position: 'fixed',
            left: `${touchPos.x}px`,
            top: `${touchPos.y - 40}px`,
            transform: 'translate(-50%, -50%) rotate(2deg) scale(1.03)',
            pointerEvents: 'none',
            zIndex: 9999,
            width: '280px',
          }}
          className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--primary)] shadow-2xl backdrop-blur-md opacity-95 space-y-2 select-none"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)]">
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-main)] border border-[var(--border-subtle)]">
              #{draggedOrder.id}
            </span>
            <span className="text-xs font-semibold text-[var(--text-main)]">
              {draggedOrder.order_type === 'dine' ? `Meja #${draggedOrder.table_number}` : 'Takeaway'}
            </span>
          </div>
          <div className="font-bold text-sm text-[var(--text-main)] truncate">
            a/n {draggedOrder.customer_name}
          </div>
          {activeDropCol && activeDropCol !== draggedOrder.status ? (
            <div className="py-1 px-2.5 rounded-lg bg-[var(--primary)] text-white text-[11px] font-bold text-center flex items-center justify-center gap-1.5 shadow-xs">
              <LucideArrowDown className="size-3.5" />
              <span>
                Pindah ke:{' '}
                {activeDropCol === 'baru'
                  ? 'Baru Masuk'
                  : activeDropCol === 'diproses'
                  ? 'Sedang Dibuat'
                  : 'Siap Ambil / Diantar'}
              </span>
            </div>
          ) : (
            <div className="py-1 px-2.5 rounded-lg bg-[var(--bg-muted)] text-[var(--text-muted)] text-[11px] font-semibold text-center">
              Geser ke kolom target...
            </div>
          )}
        </div>
      )}
    </AnimatedSidebarProvider>
  );
}

// Subcomponent: Individual Kanban Order Card
function OrderCard({
  order,
  menu,
  actionConfig,
  onAction,
  onCancel,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onTouchStartDrag,
  onTouchMoveDrag,
  onTouchEndDrag,
  onTouchCancelDrag,
}: {
  order: Order;
  menu: MenuItem[];
  actionConfig: { next: OrderStatus; label: string };
  onAction: () => void;
  onCancel?: () => void;
  isDragging?: boolean;
  onDragStart?: (order: Order) => void;
  onDragEnd?: () => void;
  onTouchStartDrag?: (order: Order, e: React.TouchEvent) => void;
  onTouchMoveDrag?: (e: React.TouchEvent) => void;
  onTouchEndDrag?: (e: React.TouchEvent) => void;
  onTouchCancelDrag?: () => void;
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
      draggable={!isUpdating}
      onDragStart={(e) => {
        const dragEvent = e as unknown as React.DragEvent;
        if (dragEvent.dataTransfer) {
          dragEvent.dataTransfer.setData('text/plain', order.id);
          dragEvent.dataTransfer.effectAllowed = 'move';
        }
        onDragStart?.(order);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        'p-4 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-subtle)] shadow-2xs hover:border-[var(--border-strong)] transition-all space-y-3 cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40 scale-95 border-dashed border-2 border-[var(--primary)] shadow-none'
      )}
    >
      {/* Top Card Info */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]/70">
        <div className="flex items-center gap-1.5">
          {/* Touchscreen & Mouse Drag Grip Handle */}
          <div
            onTouchStart={(e) => onTouchStartDrag?.(order, e)}
            onTouchMove={(e) => onTouchMoveDrag?.(e)}
            onTouchEnd={(e) => onTouchEndDrag?.(e)}
            onTouchCancel={() => onTouchCancelDrag?.()}
            className="flex items-center justify-center p-1.5 -ml-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
            title="Sentuh & geser untuk ubah status pesanan"
            aria-label="Grip geser kartu pesanan"
          >
            <GripVertical className="size-4" />
          </div>
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

      {/* Price & Action Buttons */}
      <div className="pt-2 border-t border-[var(--border-subtle)]/70 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-[var(--text-muted)] block">Total Bayar:</span>
          <span className="font-extrabold text-sm text-[var(--primary)]">
            {formatRupiah(order.total_price)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onCancel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="p-2 rounded-xl border border-red-200/60 bg-red-50/50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:border-red-900 dark:text-red-300 transition-colors cursor-pointer"
              title="Batalkan Pesanan (Wajib Berikan Alasan)"
              aria-label="Batalkan Pesanan"
            >
              <LucideBan className="size-3.5" />
            </button>
          )}

          <motion.button
            type="button"
            onClick={handleAction}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
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
      </div>
    </motion.div>
  );
}

// Modal: Batalkan Pesanan (Wajib Alasan)
function CancelOrderModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (orderId: string, reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const quickReasons = [
    'Bahan Baku Habis',
    'Pelanggan Batal / Walk-out',
    'Salah Input Pesanan',
    'Meja Kosong / Tidak Ditemukan',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(order.id, reason.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <LucideBan className="size-5" />
            <h3 className="font-bold text-base text-[var(--text-main)]">
              Batalkan Pesanan #{order.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-muted)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Pesanan a/n <strong>{order.customer_name}</strong> akan dibatalkan. Sesuai aturan sistem, alasan pembatalan <strong>wajib diisi</strong> dan akan dicatat dalam riwayat audit.
        </p>

        {/* Quick Reason Chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickReasons.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors border border-[var(--border-subtle)] cursor-pointer"
            >
              {r}
            </button>
          ))}
        </div>

        {/* Input Textarea */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
              Alasan Pembatalan (Wajib):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Stok susu oat mendadak habis..."
              rows={3}
              required
              className="w-full p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-main)] placeholder-[var(--text-light)] focus:ring-2 focus:ring-red-500/40 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-muted)] cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isSubmitting}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Membatalkan...' : 'Konfirmasi Batalkan Pesanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal: Catat Pembayaran & Selesaikan Pesanan
function PaymentCompleteModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (orderId: string, method: PaymentMethod) => Promise<void>;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('tunai');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const methods = [
    { id: 'tunai' as PaymentMethod, label: 'Tunai (Cash)', desc: 'Pembayaran uang fisik langsung di meja kasir', icon: Money },
    { id: 'qris' as PaymentMethod, label: 'QRIS', desc: 'Scan QRIS statis / dinamis kasir', icon: QrCode },
    { id: 'transfer' as PaymentMethod, label: 'Transfer Bank', desc: 'Bukti transfer via rekening kedai', icon: CreditCard },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(order.id, selectedMethod);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <LucideCreditCard className="size-5" />
            <h3 className="font-bold text-base text-[var(--text-main)]">
              Catat Pembayaran #{order.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-muted)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex justify-between items-center text-xs">
          <div>
            <span className="text-[var(--text-muted)] block">Pelanggan:</span>
            <span className="font-bold text-[var(--text-main)] text-sm">{order.customer_name}</span>
            <span className="text-[var(--text-muted)] block mt-0.5">
              {order.order_type === 'dine' ? `Meja #${order.table_number}` : 'Takeaway'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[var(--text-muted)] block">Total Tagihan:</span>
            <span className="font-extrabold text-base text-[var(--primary)]">
              {formatRupiah(order.total_price)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-main)] block mb-2">
              Pilih Metode Pembayaran Manual:
            </label>
            <div className="space-y-2">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all',
                    selectedMethod === m.id
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]/50 text-[var(--text-main)] shadow-xs'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                  )}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={m.id}
                    checked={selectedMethod === m.id}
                    onChange={() => setSelectedMethod(m.id)}
                    className="accent-[var(--primary)]"
                  />
                  <div className="w-8 h-8 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--primary)] shrink-0">
                    <m.icon size={20} weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-xs block text-[var(--text-main)]">{m.label}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{m.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">
              * Mode pencatatan manual: Status pembayaran akan diset LUNAS dan pesanan dipindahkan ke status SELESAI (tanpa payment gateway).
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-muted)] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                'Memproses...'
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Check size={14} weight="bold" />
                  <span>Catat Lunas & Selesaikan</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponent: Tab Kelola Staf (Pemilik Saja)
function StaffManagementTab({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [staffList, setStaffList] = useState<StaffMembership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<'staff' | 'owner'>('staff');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchStaffMembers();
      setStaffList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchStaffMembers().then((data) => {
      if (isMounted) {
        setStaffList(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await addStaffMember(DEFAULT_CAFE_ID, email, role, name);
      setIsAddModalOpen(false);
      setEmail('');
      setName('');
      setRole('staff');
      await loadData();
      await onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string, staffName?: string) => {
    if (confirm(`Yakin ingin mencabut akses staf ${staffName || ''}?`)) {
      await deleteStaffMember(id);
      await loadData();
      await onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <LucideUsers className="size-5 text-[var(--primary)]" />
              <span>Kelola Akun Staf &amp; Keanggotaan RBAC</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Hak akses disimpan dalam tabel keanggotaan <code>staff_memberships</code> (cafe_id, user_id, role).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-md hover:bg-[var(--primary-hover)] transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus size={16} weight="bold" />
            <span>+ Tambah Anggota Staf</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-subtle)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Total Anggota</span>
            <span className="text-xl font-extrabold text-[var(--text-main)]">{staffList.length} Orang</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">Staf (Barista &amp; Kasir)</span>
            <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400">
              {staffList.filter((s) => s.role === 'staff').length} Akun
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
            <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 block">Pemilik (Owner)</span>
            <span className="text-xl font-extrabold text-purple-700 dark:text-purple-400">
              {staffList.filter((s) => s.role === 'owner').length} Akun
            </span>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-main)]">Daftar Keanggotaan Kedai</h3>
        <div className="divide-y divide-[var(--border-subtle)]">
          {staffList.map((member) => (
            <div key={member.id} className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
                  {member.role === 'owner' ? (
                    <ShieldCheck size={20} weight="fill" className="text-purple-600" />
                  ) : (
                    <Coffee size={20} weight="duotone" className="text-[var(--primary)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-main)] truncate">
                      {member.display_name || member.email || 'Staf'}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        member.role === 'owner'
                          ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      )}
                    >
                      {member.role === 'owner' ? 'Pemilik' : 'Staf (Barista + Kasir)'}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] truncate block">{member.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteStaff(member.id, member.display_name)}
                className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Hapus Akses Staf"
              >
                <Trash size={16} weight="bold" />
              </button>
            </div>
          ))}

          {staffList.length === 0 && !loading && (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">
              Belum ada anggota staf yang terdaftar.
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="font-bold text-base text-[var(--text-main)] flex items-center gap-2">
                <LucideUsers className="size-5 text-[var(--primary)]" />
                <span>Tambah Anggota Staf</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-muted)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
                  Alamat Email Supabase Auth:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staf@kedaisenja.com"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
                  Nama Tampilan:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Budi - Barista Pagi"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
                  Pilih Role Akses:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={cn(
                      'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                      role === 'staff'
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]/60 text-[var(--primary)] font-bold'
                        : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                    )}
                  >
                    <span className="block text-xs font-bold">Staf</span>
                    <span className="text-[10px] font-normal block mt-0.5">Barista &amp; Kasir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={cn(
                      'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                      role === 'owner'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                        : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                    )}
                  >
                    <span className="block text-xs font-bold">Pemilik</span>
                    <span className="text-[10px] font-normal block mt-0.5">Akses Penuh Kedai</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-muted)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Tab Profil Kedai (Pemilik Saja)
function CafeProfileTab() {
  const [profile, setProfile] = useState<CafeProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchCafeProfile().then((data) => {
      setProfile(data);
      setName(data.name || 'Kedai Senja');
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setIsActive(data.is_active ?? true);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCafeProfile(DEFAULT_CAFE_ID, {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        is_active: isActive,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 max-w-2xl">
      <div className="pb-4 border-b border-[var(--border-subtle)]">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <LucideStore className="size-5 text-[var(--primary)]" />
          <span>Pengaturan Profil Kedai &amp; Operasional</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Data kedai ini digunakan untuk identitas pesanan QR pelanggan dan pembatasan akses RLS (cafe_id: <code>{DEFAULT_CAFE_ID}</code>).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
            Nama Kedai:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
            Alamat Kedai:
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
            Nomor Telepon / WhatsApp:
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)]/40 focus:outline-none"
          />
        </div>

        {/* Operational Switch */}
        <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-[var(--text-main)] block">Status Operasional Kedai</span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {isActive
                ? 'Kedai sedang BUKA. Pelanggan dapat memesan lewat QR meja.'
                : 'Kedai sedang TUTUP. Pemesanan via QR meja akan ditolak secara otomatis.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
              isActive
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
            )}
          >
            {isActive ? 'Buka (Aktif)' : 'Tutup (Nonaktif)'}
          </button>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold hover:bg-[var(--primary-hover)] transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Profil Kedai'}
          </button>
          {savedSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
              <Check size={14} weight="bold" />
              <span>Profil berhasil disimpan!</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
