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
import { LockKey, WarningCircle } from '@phosphor-icons/react';
import { MenuItem, Order, CustomerForm, OrderStatus, PaymentMethod } from '@/lib/types';
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
  validateTableQR,
  checkOrderRateLimit,
  DEFAULT_CAFE_ID,
  DEFAULT_ANNOUNCEMENT,
} from '@/lib/store';
import { getSupabase, getAuthUser, signOutAdmin, isSupabaseConfigured, getStaffMembership } from '@/lib/supabase';
import {
  AnimatedToastStack,
  useAnimatedToastStack,
} from '@/components/motion/animated-toast-stack';

const statusDisplayNames: Record<OrderStatus, string> = {
  baru: 'Baru Masuk',
  diproses: 'Sedang Dibuat',
  siap: 'Siap Ambil / Diantar',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

function CoffeeShopApp() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('meja') || '';
  const tokenParam = searchParams.get('token') || '';
  const initialModeParam = searchParams.get('mode') === 'adm' ? 'adm' : 'cust';

  const [mode, setMode] = useState<'cust' | 'adm'>(initialModeParam);
  const [adminRole, setAdminRole] = useState<'staff' | 'owner'>('owner');
  const [custView, setCustView] = useState<'menu' | 'cart' | 'status'>('menu');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [deviceId, setDeviceId] = useState<string>('');
  const [myOrderIds, setMyOrderIds] = useState<string[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [announcementText, setAnnouncementText] = useState<string>(DEFAULT_ANNOUNCEMENT);
  const [tableValidation, setTableValidation] = useState<{ checked: boolean; valid: boolean; reason?: string }>({
    checked: false,
    valid: true,
  });

  // Client-side post-hydration state restore from localStorage
  useEffect(() => {
    let dId = localStorage.getItem('menukita_device_id');
    if (!dId) {
      dId = 'dev_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('menukita_device_id', dId);
    }
    setDeviceId(dId);

    try {
      const savedOrders = localStorage.getItem('menukita_my_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMyOrderIds(parsed);
          setCurrentOrderId((prev) => prev || parsed[0]);
        }
      }
    } catch {
      // ignore
    }

    const savedAnnouncement = localStorage.getItem('menukita_marquee_text');
    if (savedAnnouncement?.trim()) {
      setAnnouncementText(savedAnnouncement.trim());
    }
  }, []);

  // Animated Toast Stack (beUI)
  const { toasts, showToast, dismissToast, promiseToast } = useAnimatedToastStack({
    defaultDuration: 3600,
    limit: 4,
  });

  // Supabase Auth State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const [form, setForm] = useState<CustomerForm>({
    name: '',
    table: tableParam,
    type: tableParam ? 'dine' : 'dine',
    note: '',
  });

  // Validate Table QR Token (Customer Guard)
  useEffect(() => {
    async function checkQR() {
      if (tableParam) {
        const res = await validateTableQR(DEFAULT_CAFE_ID, tableParam, tokenParam);
        setTableValidation({ checked: true, valid: res.valid, reason: res.reason });
        if (!res.valid) {
          showToast(`QR Meja #${tableParam} tidak valid atau kedai tutup.`);
        }
      } else {
        setTableValidation({ checked: true, valid: true });
      }
    }
    checkQR();
  }, [tableParam, tokenParam, showToast]);

  // Load Staff/Owner Role from Supabase Membership
  useEffect(() => {
    async function loadRole() {
      if (authUser?.id) {
        const membership = await getStaffMembership(authUser.id);
        if (membership?.role) {
          setAdminRole(membership.role);
        }
      }
    }
    loadRole();
  }, [authUser]);

  // Guard Mode Admin: Blokir akses unauthenticated ke dashboard jika Supabase terhubung
  useEffect(() => {
    if (mode === 'adm' && !authUser && isSupabaseConfigured()) {
      const frame = requestAnimationFrame(() => {
        setShowAuthModal(true);
        setMode('cust');
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [mode, authUser]);

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
    try {
      await promiseToast(
        saveAnnouncementText(newText),
        {
          loading: {
            title: 'Menyimpan Teks Berjalan...',
            description: 'Menyinkronkan pengumuman baru...',
          },
          success: {
            title: 'Pengumuman Berhasil Disimpan!',
            description: 'Teks baris berjalan telah diperbarui secara langsung.',
          },
          error: {
            title: 'Gagal Menyimpan Pengumuman',
            description: 'Terjadi kesalahan sistem saat menyimpan teks pengumuman.',
          },
        }
      );
    } catch {
      // Handled by toast
    }
  }, [promiseToast]);

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
        const [menuData, ordersData, announcementData, user] = await Promise.all([
          fetchMenuData(),
          fetchOrdersData(),
          fetchAnnouncementText(),
          getAuthUser(),
        ]);
        if (!ignore) {
          setMenu(menuData);
          setOrders(ordersData);
          if (announcementData) setAnnouncementText(announcementData);
          if (user) setAuthUser(user);
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
            if (updatedOrders.length > 0) {
              setOrders(updatedOrders);
            }

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
      if (updatedOrders.length > 0) {
        setOrders(updatedOrders);
      }
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

  // Submit order with Rate Limit & Token Check + Promise Toast
  const handleSubmitOrder = async () => {
    if (tableParam && tableValidation.checked && !tableValidation.valid) {
      showToast('QR Meja tidak valid atau kedai tutup. Silakan hubungi kasir.');
      return;
    }

    // Rate Limit Check per Device/Table
    const rateCheck = await checkOrderRateLimit(DEFAULT_CAFE_ID, form.table || null, deviceId);
    if (!rateCheck.allowed) {
      showToast(rateCheck.message || 'Batas pesanan aktif tercapai untuk perangkat ini.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await promiseToast(
        submitNewOrder(form, cart, menu, deviceId),
        {
          loading: {
            title: 'Mengirim Pesanan ke Dapur...',
            description: 'Menyimpan rincian pesanan dan nomor meja.',
          },
          success: (res) => ({
            title: res ? `Pesanan #${res.id} Terkirim!` : 'Pesanan Berhasil Terkirim!',
            description: `Pesanan masuk antrean dapur. Silakan tunggu di meja ${form.table || 'Anda'}.`,
          }),
          error: {
            title: 'Gagal Mengirim Pesanan',
            description: 'Silakan periksa koneksi internet dan coba lagi.',
          },
        }
      );
      if (created) {
        setCart({});
        setCurrentOrderId(created.id);
        const updated = [created.id, ...myOrderIds.filter((x) => x !== created.id)];
        setMyOrderIds(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('menukita_my_orders', JSON.stringify(updated));
        }
        setCustView('status');
        const updatedOrders = await fetchOrdersData();
        setOrders(updatedOrders);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin/Kitchen: Advance order status with Promise Toast (forward transitions, manual payment, cancel reason)
  const handleAdvanceOrder = async (
    orderId: string,
    nextStatus: OrderStatus,
    options?: { paymentMethod?: PaymentMethod; cancellationReason?: string }
  ) => {
    const targetLabel = statusDisplayNames[nextStatus] || nextStatus;
    try {
      await promiseToast(
        advanceOrderStatus(orderId, nextStatus, options),
        {
          loading: {
            title: `Memproses Pesanan #${orderId}...`,
            description: `Mengalihkan antrean ke status "${targetLabel}"...`,
          },
          success: {
            title: `Pesanan #${orderId} Berhasil Diperbarui!`,
            description: `Status sekarang: "${targetLabel}"`,
          },
          error: {
            title: `Gagal Memperbarui Pesanan #${orderId}`,
            description: 'Terjadi kendala saat memperbarui status di database.',
          },
        }
      );
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            status: nextStatus,
            payment_status: nextStatus === 'selesai' ? 'lunas' : o.payment_status,
            payment_method:
              nextStatus === 'selesai'
                ? options?.paymentMethod || o.payment_method || 'tunai'
                : o.payment_method,
            cancellation_reason:
              nextStatus === 'dibatalkan'
                ? options?.cancellationReason || o.cancellation_reason
                : o.cancellation_reason,
          };
        })
      );
    } catch {
      // Handled by toast
    }
  };

  // Admin: Toggle menu stock with Promise Toast
  const handleToggleMenu = async (itemId: string, current: boolean) => {
    const nextAvailability = !current;
    const item = menu.find((m) => m.id === itemId);
    const itemName = item ? item.name : 'Menu';
    try {
      await promiseToast(
        updateMenuAvailability(itemId, nextAvailability),
        {
          loading: {
            title: `Memperbarui ${itemName}...`,
            description: nextAvailability ? 'Mengaktifkan kembali menu...' : 'Menandai menu sebagai habis...',
          },
          success: {
            title: nextAvailability ? 'Menu Kembali Tersedia' : 'Menu Ditandai Habis',
            description: `${itemName} berhasil ${nextAvailability ? 'diaktifkan' : 'ditandai habis'} di katalog.`,
          },
          error: {
            title: 'Gagal Mengubah Ketersediaan',
            description: 'Tidak dapat memperbarui status menu saat ini.',
          },
        }
      );
      setMenu((prev) =>
        prev.map((m) => (m.id === itemId ? { ...m, is_available: nextAvailability } : m))
      );
    } catch {
      // Handled by toast
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

  const currentOrder = orders.find((o) => o.id === currentOrderId) || (myOrderIds.length > 0 ? orders.find((o) => o.id === myOrderIds[0]) : undefined);

  // Jika di mode Pemilik dan sudah terautentikasi (atau demo lokal tanpa Supabase)
  const isOwnerDashboardActive = mode === 'adm' && (authUser || !isSupabaseConfigured());

  if (isOwnerDashboardActive) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-main)]">
        <AdminDashboard
          orders={orders}
          menu={menu}
          userRole={adminRole}
          onRoleChange={setAdminRole}
          onAdvanceOrder={handleAdvanceOrder}
          onToggleAvailability={handleToggleMenu}
          onCreateMenu={handleCreateMenu}
          onUpdateMenu={handleUpdateMenu}
          onDeleteMenu={handleDeleteMenu}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          announcementText={announcementText}
          onUpdateAnnouncement={handleUpdateAnnouncement}
          authUser={authUser}
          onSignOut={handleSignOut}
          onSwitchToCustomer={() => setMode('cust')}
        />

        {/* Animated Toast Stack (beUI) */}
        <AnimatedToastStack
          toasts={toasts}
          onDismiss={dismissToast}
          position="bottom-right"
          placement="fixed"
          maxVisible={4}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors">

      {/* Main App Header */}
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        tableNumber={form.table}
        authUser={authUser}
        userRole={adminRole}
        onRoleChange={setAdminRole}
        onOpenAuth={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Body Content */}
      <main className={`flex-1 py-6 sm:py-8 w-full mx-auto ${mode === 'adm' ? 'max-w-7xl px-3 sm:px-6' : 'max-w-5xl px-4'}`}>
        {mode === 'cust' ? (
          <>
            {tableParam && tableValidation.checked && !tableValidation.valid && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <WarningCircle size={16} weight="bold" className="text-rose-600 flex-shrink-0" />
                  <span className="font-bold">QR Meja #{tableParam} Tidak Valid:</span>
                  <span>{tableValidation.reason || 'Token QR tidak cocok atau kedai sedang tutup.'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, table: '' }))}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Pesan via Kiosk
                </button>
              </div>
            )}

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
              userRole={adminRole}
              onRoleChange={setAdminRole}
              onAdvanceOrder={handleAdvanceOrder}
              onToggleAvailability={handleToggleMenu}
              onCreateMenu={handleCreateMenu}
              onUpdateMenu={handleUpdateMenu}
              onDeleteMenu={handleDeleteMenu}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
              announcementText={announcementText}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              authUser={authUser}
              onSignOut={handleSignOut}
              onSwitchToCustomer={() => setMode('cust')}
            />
          )
        )}
      </main>

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async () => {
          const user = await getAuthUser();
          setAuthUser(user || ({ id: 'admin', email: 'barista@kedaisenja.com' } as User));
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

      {/* Animated Toast Stack (beUI) */}
      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
        placement="fixed"
        maxVisible={4}
      />
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
