'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { User, RealtimeChannel } from '@supabase/supabase-js';
import { Header } from '@/components/Header';
import { CustomerMenu } from '@/components/CustomerMenu';
import { CustomerCart } from '@/components/CustomerCart';
import { CustomerStatus } from '@/components/CustomerStatus';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminAuthModal } from '@/components/AdminAuthModal';
import { LockKey } from '@phosphor-icons/react';
import { MenuItem, Order, CustomerForm, OrderStatus } from '@/lib/types';
import {
  fetchMenuData,
  fetchOrdersData,
  submitNewOrder,
  advanceOrderStatus,
  updateMenuAvailability,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getAnnouncementText,
  fetchAnnouncementText,
  saveAnnouncementText,
} from '@/lib/store';
import { getSupabase, getAuthUser, signOutAdmin, isSupabaseConfigured } from '@/lib/supabase';

function CoffeeShopApp() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('meja') || '';
  const initialModeParam = searchParams.get('mode') === 'adm' ? 'adm' : 'cust';

  const [mode, setMode] = useState<'cust' | 'adm'>(initialModeParam);
  const [custView, setCustView] = useState<'menu' | 'cart' | 'status'>('menu');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState<string>(() => getAnnouncementText());

  // Supabase Auth State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const [form, setForm] = useState<CustomerForm>({
    name: '',
    table: tableParam,
    type: tableParam ? 'dine' : 'dine',
    note: '',
  });

  // Sync running text marquee from store/localStorage
  useEffect(() => {
    const handleSyncAnnouncement = () => {
      setAnnouncementText(getAnnouncementText());
    };
    window.addEventListener('menukita_announcement_updated', handleSyncAnnouncement);
    return () => {
      window.removeEventListener('menukita_announcement_updated', handleSyncAnnouncement);
    };
  }, []);

  const handleUpdateAnnouncement = useCallback(async (newText: string) => {
    setAnnouncementText(newText);
    await saveAnnouncementText(newText);
    showToast('Teks pengumuman berjalan berhasil diperbarui!');
  }, [showToast]);

  // Check Supabase Auth State
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getAuthUser();
      setAuthUser(user);
      if (!user && initialModeParam === 'adm' && isSupabaseConfigured()) {
        setShowAuthModal(true);
      }
    };
    checkAuth();

    const supabase = getSupabase();
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthUser(session?.user ?? null);
      });
      authSubscription = data?.subscription;
    }

    return () => {
      authSubscription?.unsubscribe?.();
    };
  }, [initialModeParam]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [menuData, ordersData, announcementData] = await Promise.all([
        fetchMenuData(),
        fetchOrdersData(),
        fetchAnnouncementText(),
      ]);
      setMenu(menuData);
      setOrders(ordersData);
      if (announcementData) setAnnouncementText(announcementData);
    } catch (err) {
      console.error('Error memuat data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function initData() {
      try {
        const [menuData, ordersData, announcementData] = await Promise.all([
          fetchMenuData(),
          fetchOrdersData(),
          fetchAnnouncementText(),
        ]);
        if (!ignore) {
          setMenu(menuData);
          setOrders(ordersData);
          if (announcementData) setAnnouncementText(announcementData);
        }
      } catch (err) {
        console.error('Error memuat data:', err);
      }
    }

    void initData();

    // Supabase Realtime Subscription (bila terhubung)
    const supabase = getSupabase();
    let ordersChannel: RealtimeChannel | null = null;
    let menuChannel: RealtimeChannel | null = null;
    let settingsChannel: RealtimeChannel | null = null;

    if (supabase) {
      ordersChannel = supabase
        .channel('realtime_orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          async (payload: { eventType: string; new?: Record<string, unknown> }) => {
            console.log('Realtime Order Event:', payload);
            const updatedOrders = await fetchOrdersData();
            setOrders(updatedOrders);

            if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedOrder = payload.new as { id?: string; status?: string };
              if (updatedOrder.id === currentOrderId) {
                const statusNames: Record<string, string> = {
                  diproses: 'Sedang Disiapkan Barista',
                  siap: 'Pesananmu Sudah SIAP!',
                  selesai: 'Pesanan Selesai. Terima kasih!',
                };
                const statusKey = updatedOrder.status || '';
                showToast(`Status #${updatedOrder.id}: ${statusNames[statusKey] || statusKey}`);
              }
            }
          }
        )
        .subscribe();

      menuChannel = supabase
        .channel('realtime_menu')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items' },
          async () => {
            const updatedMenu = await fetchMenuData();
            setMenu(updatedMenu);
          }
        )
        .subscribe();

      settingsChannel = supabase
        .channel('realtime_settings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'store_settings' },
          async (payload: { eventType: string; new?: Record<string, unknown> }) => {
            const newRow = payload.new as { key?: string; value?: string } | undefined;
            if (newRow?.key === 'announcement_text' && newRow.value) {
              setAnnouncementText(newRow.value);
            } else {
              const updated = await fetchAnnouncementText();
              setAnnouncementText(updated);
            }
          }
        )
        .subscribe();
    }

    // LocalStorage cross-tab sync listeners for demo mode
    const handleLocalOrderUpdate = async () => {
      const updatedOrders = await fetchOrdersData();
      setOrders(updatedOrders);
    };

    const handleLocalMenuUpdate = async () => {
      const updatedMenu = await fetchMenuData();
      setMenu(updatedMenu);
    };

    window.addEventListener('menukita_orders_updated', handleLocalOrderUpdate);
    window.addEventListener('menukita_menu_updated', handleLocalMenuUpdate);
    window.addEventListener('storage', handleLocalOrderUpdate);

    return () => {
      ignore = true;
      if (ordersChannel) supabase?.removeChannel(ordersChannel);
      if (menuChannel) supabase?.removeChannel(menuChannel);
      if (settingsChannel) supabase?.removeChannel(settingsChannel);
      window.removeEventListener('menukita_orders_updated', handleLocalOrderUpdate);
      window.removeEventListener('menukita_menu_updated', handleLocalMenuUpdate);
      window.removeEventListener('storage', handleLocalOrderUpdate);
    };
  }, [currentOrderId, showToast]);

  // Add / reduce item in cart
  const handleAddToCart = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  // Submit order
  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const created = await submitNewOrder(form, cart, menu);
      if (created) {
        setCart({});
        setCurrentOrderId(created.id);
        setCustView('status');
        showToast(`Pesanan #${created.id} berhasil terkirim ke dapur!`);
        // Refresh orders list
        const updatedOrders = await fetchOrdersData();
        setOrders(updatedOrders);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin: Advance order status
  const handleAdvanceOrder = async (orderId: string, nextStatus: OrderStatus) => {
    const success = await advanceOrderStatus(orderId, nextStatus);
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      showToast(`Pesanan #${orderId} dialihkan ke status "${nextStatus}"`);
    }
  };

  // Admin: Toggle menu stock
  const handleToggleMenu = async (itemId: string, current: boolean) => {
    const nextAvailability = !current;
    const success = await updateMenuAvailability(itemId, nextAvailability);
    if (success) {
      setMenu((prev) =>
        prev.map((m) => (m.id === itemId ? { ...m, is_available: nextAvailability } : m))
      );
      showToast(
        nextAvailability
          ? 'Menu kembali diaktifkan (Tersedia)'
          : 'Menu ditandai Habis'
      );
    }
  };

  // Admin: Create new menu item
  const handleCreateMenu = async (itemData: Omit<MenuItem, 'id'>) => {
    const created = await createMenuItem(itemData);
    if (created) {
      setMenu((prev) => [created, ...prev.filter((m) => m.id !== created.id)]);
      showToast(`Menu "${created.name}" berhasil ditambahkan!`);
    }
  };

  // Admin: Update existing menu item
  const handleUpdateMenu = async (itemId: string, updates: Partial<MenuItem>) => {
    const success = await updateMenuItem(itemId, updates);
    if (success) {
      setMenu((prev) =>
        prev.map((m) => (m.id === itemId ? { ...m, ...updates } : m))
      );
      showToast('Perubahan menu berhasil disimpan!');
    }
  };

  // Admin: Delete menu item
  const handleDeleteMenu = async (itemId: string) => {
    const success = await deleteMenuItem(itemId);
    if (success) {
      setMenu((prev) => prev.filter((m) => m.id !== itemId));
      showToast('Menu berhasil dihapus dari katalog.');
    }
  };

  const handleModeChange = (newMode: 'cust' | 'adm') => {
    if (newMode === 'adm') {
      if (!authUser && isSupabaseConfigured()) {
        setShowAuthModal(true);
        return;
      }
    }
    setMode(newMode);
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setAuthUser(null);
    setMode('cust');
    showToast('Berhasil keluar dari akun pemilik.');
  };

  const currentOrder = orders.find((o) => o.id === currentOrderId);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-bounce">
          <div className="bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        tableNumber={form.table}
        authUser={authUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Body Content */}
      <main className="flex-1 px-4 py-6 sm:py-8 max-w-5xl w-full mx-auto">
        {mode === 'cust' ? (
          <>
            {custView === 'menu' && (
              <CustomerMenu
                menu={menu}
                cart={cart}
                onAddToCart={handleAddToCart}
                onOpenCart={() => setCustView('cart')}
                tableNumber={form.table}
                announcementText={announcementText}
              />
            )}

            {custView === 'cart' && (
              <CustomerCart
                cart={cart}
                menu={menu}
                form={form}
                onUpdateForm={(updated) => setForm((prev) => ({ ...prev, ...updated }))}
                onUpdateCart={handleAddToCart}
                onBackToMenu={() => setCustView('menu')}
                onSubmitOrder={handleSubmitOrder}
                isSubmitting={isSubmitting}
              />
            )}

            {custView === 'status' && currentOrder && (
              <CustomerStatus
                order={currentOrder}
                onOrderAgain={() => setCustView('menu')}
              />
            )}

            {custView === 'status' && !currentOrder && (
              <div className="text-center py-20">
                <p className="text-sm text-[var(--text-muted)]">Belum ada pesanan aktif.</p>
                <button
                  type="button"
                  onClick={() => setCustView('menu')}
                  className="mt-3 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold"
                >
                  Buka Menu
                </button>
              </div>
            )}
          </>
        ) : (
          !authUser && isSupabaseConfigured() ? (
            <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--border-subtle)] mx-auto flex items-center justify-center shadow-sm">
                <LockKey size={32} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-[var(--text-main)]">Akses Dapur & Pemilik Terkunci</h2>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Halaman ini dilindungi oleh Supabase Authentication. Masuk dengan akun staf atau pemilik untuk melihat pesanan dan mengelola menu.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold shadow-md hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
                >
                  Masuk Akun Pemilik
                </button>
                <button
                  type="button"
                  onClick={() => setMode('cust')}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-medium hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  Kembali ke Menu Pelanggan
                </button>
              </div>
            </div>
          ) : (
            <AdminDashboard
              orders={orders}
              menu={menu}
              onAdvanceOrder={handleAdvanceOrder}
              onToggleAvailability={handleToggleMenu}
              onCreateMenu={handleCreateMenu}
              onUpdateMenu={handleUpdateMenu}
              onDeleteMenu={handleDeleteMenu}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
              announcementText={announcementText}
              onUpdateAnnouncement={handleUpdateAnnouncement}
            />
          )
        )}
      </main>

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setMode('adm');
          showToast('Berhasil masuk ke Dashboard Pemilik!');
        }}
      />

      {/* Footer Branding */}
      <footer className="w-full border-t border-[var(--border-subtle)] py-6 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-surface)]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Kedai Senja · MenuKita. Kiosk &amp; QR Table Ordering System.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Next.js 16 + React 19</span>
            <span>·</span>
            <span>PostgreSQL Supabase</span>
            <span>·</span>
            <button
              onClick={() => handleModeChange(mode === 'cust' ? 'adm' : 'cust')}
              className="hover:underline font-semibold text-[var(--primary)]"
            >
              Mode: {mode === 'cust' ? 'Tampilan Pemilik' : 'Tampilan Pelanggan'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fcf8f4] dark:bg-[#15100c] text-[#6f4e37]">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-3 border-[#6f4e37]/30 border-t-[#6f4e37] rounded-full animate-spin" />
            <p className="text-xs font-bold tracking-wider uppercase">Menyiapkan Kedai Senja...</p>
          </div>
        </div>
      }
    >
      <CoffeeShopApp />
    </Suspense>
  );
}
