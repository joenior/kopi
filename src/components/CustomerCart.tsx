'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { MenuItem, CustomerForm } from '@/lib/types';
import { formatRupiah } from '@/lib/store';
import {
  ArrowLeft,
  ShoppingBag,
  NotePencil,
  CheckCircle,
  WarningCircle,
  Storefront,
  Bag,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { AdaptiveStepper } from '@/components/motion/AdaptiveStepper';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { ExpandingButton } from '@/components/motion/ExpandingButton';
import { MenuIcon } from './MenuIcon';

interface CustomerCartProps {
  cart: Record<string, number>;
  menu: MenuItem[];
  form: CustomerForm;
  onUpdateForm: (newForm: Partial<CustomerForm>) => void;
  onUpdateCart: (id: string, delta: number) => void;
  onBackToMenu: () => void;
  onSubmitOrder: () => Promise<void>;
  isSubmitting: boolean;
}

export function CustomerCart({
  cart,
  menu,
  form,
  onUpdateForm,
  onUpdateCart,
  onBackToMenu,
  onSubmitOrder,
  isSubmitting,
}: CustomerCartProps) {
  const [errorMsg, setErrorMsg] = useState<string>('');

  const menuMap = new Map(menu.map((m) => [m.id, m]));
  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);

  const totalItemCount = cartEntries.reduce((sum, [, q]) => sum + q, 0);
  const totalPrice = cartEntries.reduce((sum, [id, qty]) => {
    const item = menuMap.get(id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (totalItemCount === 0) {
      setErrorMsg('Keranjang pesanan masih kosong.');
      return;
    }

    if (form.type === 'dine' && !form.table) {
      setErrorMsg('Silakan pilih nomor meja Anda.');
      return;
    }

    try {
      await onSubmitOrder();
      // Trigger joyful celebration confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6f4e37', '#d97706', '#15803d'],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim pesanan. Silakan coba lagi.';
      setErrorMsg(message);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24">
      {/* Back Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors active-press py-1"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Kembali ke Menu</span>
        </button>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 shadow-[var(--shadow-warm)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
              Keranjang Pesanan
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <ShoppingBag size={22} weight="fill" />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="divide-y divide-[var(--border-subtle)]/70 my-4">
          <AnimatePresence initial={false}>
            {cartEntries.map(([id, qty]) => {
              const item = menuMap.get(id);
              if (!item) return null;
              const itemTotal = item.price * qty;

              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  className="py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl bg-[var(--bg-muted)] overflow-hidden flex-none border border-[var(--border-subtle)]">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--bg-muted)] text-[var(--primary)]">
                          <MenuIcon category={item.category} name={item.name} size={22} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-[var(--text-main)] truncate">
                        {item.name}
                      </h4>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                  </div>

                  {/* Stepper & Total */}
                  <div className="flex items-center gap-3">
                    <AdaptiveStepper
                      value={qty}
                      onIncrement={() => onUpdateCart(id, 1)}
                      onDecrement={() => onUpdateCart(id, -1)}
                      size="sm"
                    />
                    <div className="text-right min-w-[75px]">
                      <span className="font-bold text-xs sm:text-sm text-[var(--primary)]">
                        <AnimatedNumber value={itemTotal} prefix="Rp " />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {cartEntries.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-[var(--text-muted)]">Keranjang belanja Anda masih kosong.</p>
              <button
                type="button"
                onClick={onBackToMenu}
                className="mt-3 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
              >
                Pilih Menu Kopi
              </button>
            </div>
          )}
        </div>

        {/* Pricing Subtotal with AnimatedNumber */}
        {cartEntries.length > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-subtle)] mb-6 space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Subtotal ({totalItemCount} item)</span>
              <span>
                <AnimatedNumber value={totalPrice} prefix="Rp " />
              </span>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Biaya Layanan &amp; Pajak</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Termasuk</span>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between items-center text-sm sm:text-base font-extrabold text-[var(--text-main)]">
              <span>Total Tagihan</span>
              <span className="text-[var(--primary)]">
                <AnimatedNumber value={totalPrice} prefix="Rp " />
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-light)] italic text-center pt-1">
              * Pembayaran dilakukan di kasir saat mengambil atau menerima pesanan.
            </p>
          </div>
        )}

        {/* Customer Form */}
        {cartEntries.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)] flex items-center gap-1.5">
              <NotePencil size={18} weight="duotone" className="text-[var(--primary)]" />
              <span>Detail Pemesan</span>
            </h3>

            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Nama Pemanggil / Pelanggan <span className="text-[var(--primary)]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => onUpdateForm({ name: e.target.value })}
                placeholder="Contoh: Rina / Dimas"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all"
              />
            </div>

            {/* Tipe Pesanan */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                Tipe Pesanan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateForm({ type: 'dine' })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all active-press ${
                    form.type === 'dine'
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Storefront size={16} weight={form.type === 'dine' ? 'bold' : 'regular'} />
                  <span>Makan di Tempat</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateForm({ type: 'takeaway' })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all active-press ${
                    form.type === 'takeaway'
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Bag size={16} weight={form.type === 'takeaway' ? 'bold' : 'regular'} />
                  <span>Dibawa Pulang</span>
                </button>
              </div>
            </div>

            {/* Nomor Meja (jika Dine-in) */}
            {form.type === 'dine' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Nomor Meja <span className="text-[var(--primary)]">*</span>
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onUpdateForm({ table: num })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all active-press ${
                        form.table === num
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs scale-102'
                          : 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Catatan Khusus Barista <span className="text-neutral-400 font-normal">(opsional)</span>
              </label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => onUpdateForm({ note: e.target.value })}
                placeholder="Contoh: Es sedikit, gula aren dipisah, jangan terlalu manis..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all resize-none"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-medium">
                <WarningCircle size={16} weight="fill" className="flex-none" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button with beUI ExpandingButton */}
            <ExpandingButton
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              icon={<CheckCircle size={18} weight="bold" />}
              className="w-full py-4 rounded-2xl text-sm font-bold shadow-lg shadow-[var(--primary)]/20"
            >
              Kirim Pesanan Sekarang · Rp {totalPrice.toLocaleString('id-ID')}
            </ExpandingButton>
          </form>
        )}
      </div>
    </div>
  );
}
