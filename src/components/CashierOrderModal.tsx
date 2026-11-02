'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Search,
  Trash2,
  UtensilsCrossed,
  Coffee,
  CheckCircle2,
  Receipt,
  User,
  Hash,
  FileText,
} from 'lucide-react';
import { MenuItem, Order, CustomerForm, OrderType } from '@/lib/types';
import { formatRupiah, submitNewOrder } from '@/lib/store';
import { SPRING_LAYOUT, SPRING_PRESS } from '@/lib/ease';

interface CashierOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: MenuItem[];
  onOrderCreated: (order: Order) => Promise<void> | void;
}

function getItemImage(item: MenuItem): string {
  if (item.image_url) return item.image_url;
  const cat = item.category.toLowerCase();
  if (cat.includes('non') || cat.includes('teh') || cat.includes('coklat')) {
    return '/images/matcha.jpg';
  }
  if (
    cat.includes('makan') ||
    cat.includes('pastry') ||
    cat.includes('roti') ||
    cat.includes('snack') ||
    cat.includes('kentang')
  ) {
    return '/images/croissant.jpg';
  }
  return '/images/kopi-susu-aren.jpg';
}

export function CashierOrderModal({
  isOpen,
  onClose,
  menu,
  onOrderCreated,
}: CashierOrderModalProps) {
  // Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('dine');
  const [tableNumber, setTableNumber] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');

  // Cart & Catalog State
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter menu items
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchCat =
        selectedCategory === 'all' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  // Calculations
  const cartEntries = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menu.find((m) => m.id === id);
        return {
          id,
          qty,
          item,
          subtotal: item ? item.price * qty : 0,
        };
      })
      .filter((entry) => Boolean(entry.item));
  }, [cart, menu]);

  const totalItemsCount = useMemo(() => {
    return cartEntries.reduce((sum, entry) => sum + entry.qty, 0);
  }, [cartEntries]);

  const totalPrice = useMemo(() => {
    return cartEntries.reduce((sum, entry) => sum + entry.subtotal, 0);
  }, [cartEntries]);

  // Cart Handlers
  const handleAddToCart = (itemId: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const handleClearItem = (itemId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handleResetForm = () => {
    setCustomerName('');
    setOrderType('dine');
    setTableNumber('1');
    setNotes('');
    setCart({});
    setSearchQuery('');
    setSelectedCategory('all');
    setErrorMessage(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartEntries.length === 0) {
      setErrorMessage('Pilih minimal 1 menu untuk membuat pesanan.');
      return;
    }

    const form: CustomerForm = {
      name: customerName.trim() || 'Pelanggan Kasir',
      type: orderType,
      table: orderType === 'dine' ? tableNumber : '',
      note: notes.trim(),
    };

    setIsSubmitting(true);
    try {
      const created = await submitNewOrder(form, cart, menu);
      if (created) {
        await onOrderCreated(created);
        handleResetForm();
        onClose();
      } else {
        setErrorMessage('Gagal menyimpan pesanan. Silakan coba kembali.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={SPRING_LAYOUT}
        className="relative w-full max-w-4xl h-[92vh] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-gradient-to-r from-[var(--primary-light)]/40 via-transparent to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-md">
              <Receipt className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-[var(--text-main)] font-serif">
                  Input Pesanan Kasir (Walk-in)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--primary-light)] text-[var(--primary)] font-bold border border-[var(--primary)]/20">
                  POS Kasir
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Buat pesanan langsung pelanggan yang datang ke meja kasir
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body (2 Columns on Desktop) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Kolom Kiri: Katalog & Pemilihan Menu (60%) */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] min-w-0 bg-[var(--bg-primary)]/40 overflow-hidden">
            {/* Search & Category Filter */}
            <div className="p-4 border-b border-[var(--border-subtle)] space-y-3 shrink-0 bg-[var(--bg-surface)]">
              {/* Search Bar */}
              <div className="relative">
                <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kopi, pastry, makanan..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-light)]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {[
                  { id: 'all', label: 'Semua Menu', icon: UtensilsCrossed },
                  { id: 'kopi', label: 'Kopi', icon: Coffee },
                  { id: 'non-kopi', label: 'Non-Kopi', icon: UtensilsCrossed },
                  { id: 'makanan', label: 'Makanan', icon: UtensilsCrossed },
                ].map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-[var(--primary)] text-white shadow-xs'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <IconComponent className="size-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredMenu.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                  <UtensilsCrossed className="size-8 mb-2 opacity-40" />
                  <p className="text-sm font-semibold">Tidak ada menu yang sesuai</p>
                  <p className="text-xs text-[var(--text-light)]">Coba ubah kata kunci atau kategori filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredMenu.map((item) => {
                    const qty = cart[item.id] || 0;
                    const isAvailable = item.is_available;
                    const bgImage = getItemImage(item);

                    return (
                      <div
                        key={item.id}
                        className={`isolate group relative overflow-hidden rounded-2xl border p-3 min-h-[115px] flex flex-col justify-between transition-all duration-300 bg-neutral-900 ${
                          qty > 0
                            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/50 shadow-md'
                            : 'border-white/10 hover:border-white/30 shadow-xs'
                        } ${!isAvailable ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                      >
                        {/* Background Product Image */}
                        <Image
                          src={bgImage}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 250px"
                          className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        />

                        {/* Dark Gradient Overlay for High Contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/35 pointer-events-none" />

                        {/* Top Row: Category / Badge / Status */}
                        <div className="relative z-10 flex items-center justify-between gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white/90 backdrop-blur-xs border border-white/15">
                            {item.category}
                          </span>

                          {!isAvailable && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-600 text-white shadow-xs">
                              Habis
                            </span>
                          )}

                          {isAvailable && item.badge && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-black shadow-xs">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {/* Bottom Row: Name, Price, and Action Button */}
                        <div className="relative z-10 flex items-end justify-between gap-2 pt-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow-md truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs font-extrabold text-[#f6be8a] drop-shadow-md mt-0.5">
                              {formatRupiah(item.price)}
                            </p>
                          </div>

                          {/* Controls */}
                          {isAvailable && (
                            <div className="shrink-0">
                              {qty > 0 ? (
                                <div className="flex items-center gap-1 bg-black/80 border border-[var(--primary)] backdrop-blur-md rounded-xl p-0.5 shadow-md">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromCart(item.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
                                    aria-label="Kurangi kuantitas"
                                  >
                                    <Minus className="size-3.5" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-extrabold text-white">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(item.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors cursor-pointer shadow-xs"
                                    aria-label="Tambah kuantitas"
                                  >
                                    <Plus className="size-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(item.id)}
                                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/25 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active-press shadow-sm"
                                >
                                  <Plus className="size-3.5" />
                                  <span>Pilih</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Rincian Pelanggan & Ringkasan Keranjang (40%) */}
          <form
            onSubmit={handleSubmit}
            className="w-full lg:w-[380px] flex flex-col bg-[var(--bg-surface)] shrink-0 min-h-0"
          >
            {/* Scrollable Form & Cart List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Data Pelanggan */}
              <div className="space-y-3 pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                  <User className="size-3.5 text-[var(--primary)]" />
                  <span>Informasi Pelanggan</span>
                </div>

                {/* Nama Pelanggan */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Nama Pelanggan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi, Meja 3, atau Tamu"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                  />
                </div>

                {/* Tipe Pesanan Toggle */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Tipe Pesanan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('dine')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        orderType === 'dine'
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <UtensilsCrossed className="size-3.5" />
                      <span>Dine In (Meja)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('takeaway')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        orderType === 'takeaway'
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <ShoppingBag className="size-3.5" />
                      <span>Takeaway (Bungkus)</span>
                    </button>
                  </div>
                </div>

                {/* Nomor Meja (Jika Dine In) */}
                {orderType === 'dine' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1 flex items-center justify-between">
                      <span>Nomor Meja</span>
                      <span className="text-[10px] text-[var(--text-light)]">1 - 20</span>
                    </label>
                    <div className="relative">
                      <Hash className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Contoh: 1, 2, Bar"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                )}

                {/* Catatan Tambahan */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Catatan Pesanan (Opsional)
                  </label>
                  <div className="relative">
                    <FileText className="size-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Gula dipisah, ekstra es"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Daftar Item Pesanan dalam Keranjang */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                    <ShoppingBag className="size-3.5 text-[var(--primary)]" />
                    <span>Daftar Item ({totalItemsCount})</span>
                  </div>
                  {cartEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart({})}
                      className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {cartEntries.length === 0 ? (
                  <div className="py-6 px-4 rounded-xl border border-dashed border-[var(--border-subtle)] text-center text-[var(--text-muted)] text-xs">
                    <p className="font-medium">Belum ada item dipilih</p>
                    <p className="text-[11px] text-[var(--text-light)] mt-0.5">
                      Pilih menu dari katalog di sebelah kiri
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cartEntries.map(({ id, qty, item, subtotal }) => (
                      <div
                        key={id}
                        className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[var(--text-main)] truncate">
                            {item?.name}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {qty} × {formatRupiah(item?.price || 0)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[var(--primary)]">
                            {formatRupiah(subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleClearItem(id)}
                            className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Hapus item"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Total & Submit Footer */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3 shrink-0 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">Subtotal ({totalItemsCount} item)</span>
                <span className="font-bold text-[var(--text-main)]">{formatRupiah(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/60">
                <span className="text-sm font-bold text-[var(--text-main)]">Total Tagihan</span>
                <span className="text-base font-extrabold text-[var(--primary)] font-serif">
                  {formatRupiah(totalPrice)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cartEntries.length === 0 || isSubmitting}
                  className="py-2.5 px-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer active-press"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Kirim ke Dapur</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
