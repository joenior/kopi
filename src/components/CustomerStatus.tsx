'use client';

import React from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { formatRupiah, formatTime } from '@/lib/store';
import {
  CheckCircle,
  Clock,
  Coffee,
  Check,
  Sparkle,
  ArrowCounterClockwise,
  Receipt,
  Storefront,
  Bag,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedBadge } from '@/components/motion/AnimatedBadge';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { ExpandingButton } from '@/components/motion/ExpandingButton';

interface CustomerStatusProps {
  order: Order;
  onOrderAgain: () => void;
}

export function CustomerStatus({ order, onOrderAgain }: CustomerStatusProps) {
  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'baru', label: 'Baru', desc: 'Diterima kasir' },
    { key: 'diproses', label: 'Diproses', desc: 'Barista meracik' },
    { key: 'siap', label: 'Siap', desc: 'Siap dinikmati' },
    { key: 'selesai', label: 'Selesai', desc: 'Terima kasih' },
  ];

  const statusIndexMap: Record<OrderStatus, number> = {
    baru: 0,
    diproses: 1,
    siap: 2,
    selesai: 3,
  };

  const currentIdx = statusIndexMap[order.status] ?? 0;

  const statusMessages = [
    {
      title: 'Pesanan Diterima di Kedai Senja',
      desc: 'Pesananmu sudah masuk antrean dapur. Barista akan segera meraciknya.',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200',
    },
    {
      title: 'Barista Sedang Menyiapkan Pesananmu',
      desc: 'Biji kopi pilihan sedang digiling dan diekstraksi dengan sepenuh hati.',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/50 dark:text-blue-200',
    },
    {
      title: 'Pesananmu Sudah Siap!',
      desc: order.order_type === 'dine'
        ? `Silakan ambil di bar pengambilan atau barista kami akan mengantar ke Meja #${order.table_number}.`
        : 'Pesanan takeaway Anda sudah rapi dan siap diambil di meja kasir.',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200',
    },
    {
      title: 'Pesanan Telah Selesai',
      desc: 'Terima kasih telah berkunjung ke Kedai Senja. Selamat menikmati hari Anda!',
      badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200',
    },
  ];

  const activeMsg = statusMessages[currentIdx];

  return (
    <div className="w-full max-w-lg mx-auto pb-24">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-7 shadow-[var(--shadow-warm)]">
        {/* Order Identifier */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--border-subtle)]">
                #{order.id}
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Clock size={13} />
                {formatTime(order.created_at)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
              Status Pesanan
            </h1>
          </div>

          <div className="text-right">
            <AnimatedBadge
              variant={currentIdx === 2 ? 'success' : currentIdx === 1 ? 'info' : 'warning'}
              pulse={currentIdx !== 3}
              icon={order.order_type === 'dine' ? <Storefront size={13} weight="bold" /> : <Bag size={13} weight="bold" />}
            >
              {order.order_type === 'dine' ? `Meja #${order.table_number}` : 'Takeaway'}
            </AnimatedBadge>
            <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              a/n {order.customer_name}
            </div>
          </div>
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="my-6">
          <div className="relative flex justify-between">
            {/* Connecting line */}
            <div className="absolute top-4 left-6 right-6 h-1 bg-[var(--border-subtle)] -z-0">
              <motion.div
                className="h-full bg-[var(--primary)] rounded-full"
                initial={false}
                animate={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              />
            </div>

            {steps.map((st, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div key={st.key} className="flex flex-col items-center text-center z-10 w-20">
                  <motion.div
                    animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={isCurrent ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } : undefined}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                      isPast
                        ? 'bg-[var(--primary)] text-white shadow-sm'
                        : isCurrent
                        ? 'bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20 shadow-md'
                        : 'bg-[var(--bg-surface)] text-[var(--text-light)] border-2 border-[var(--border-subtle)]'
                    }`}
                  >
                    {isPast ? <Check size={14} weight="bold" /> : idx + 1}
                  </motion.div>
                  <span
                    className={`text-xs mt-2 font-semibold ${
                      isCurrent
                        ? 'text-[var(--text-main)] font-bold'
                        : isPast
                        ? 'text-[var(--text-main)]'
                        : 'text-[var(--text-light)]'
                    }`}
                  >
                    {st.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">
                    {st.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Active Status Alert Box with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={`p-4 rounded-2xl border ${activeMsg.badgeColor} mb-6`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/50 dark:bg-black/20 flex-none mt-0.5">
                {currentIdx === 2 ? (
                  <Sparkle size={22} weight="fill" className="text-emerald-600 animate-bounce" />
                ) : currentIdx === 3 ? (
                  <CheckCircle size={22} weight="fill" className="text-neutral-600" />
                ) : (
                  <Coffee size={22} weight="fill" className="text-[var(--primary)] animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-snug">
                  {activeMsg.title}
                </h3>
                <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
                  {activeMsg.desc}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Order Details Accordion / List */}
        <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-subtle)] mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)] mb-3 uppercase tracking-wider">
            <Receipt size={16} weight="duotone" className="text-[var(--primary)]" />
            <span>Rincian Menu Dipesan</span>
          </div>

          <ul className="divide-y divide-[var(--border-subtle)]/70 text-xs sm:text-sm">
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((it, idx) => (
                <li key={idx} className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold flex items-center justify-center">
                      {it.quantity}×
                    </span>
                    <span className="font-medium text-[var(--text-main)]">{it.item_name}</span>
                  </div>
                  <span className="font-semibold text-[var(--text-muted)]">
                    {formatRupiah(it.price * it.quantity)}
                  </span>
                </li>
              ))
            ) : order.items ? (
              Object.entries(order.items).map(([id, qty]) => (
                <li key={id} className="py-2.5 flex justify-between items-center">
                  <span className="font-medium text-[var(--text-main)]">
                    {qty}× Item #{id}
                  </span>
                </li>
              ))
            ) : null}
          </ul>

          {order.notes && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--primary-light)]/80 dark:bg-[var(--primary-light)]/40 border border-[var(--border-strong)] text-xs text-[var(--text-main)] shadow-2xs">
                <span className="font-extrabold text-[var(--primary)] uppercase tracking-wider text-[10px] mr-1">Catatan Khusus:</span>
                <span className="font-medium italic">“{order.notes}”</span>
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex justify-between items-center font-extrabold text-sm sm:text-base">
            <span className="text-[var(--text-main)]">Total (Bayar di Kasir)</span>
            <span className="text-[var(--primary)]">
              <AnimatedNumber value={order.total_price} prefix="Rp " />
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <ExpandingButton
            type="button"
            onClick={onOrderAgain}
            variant="primary"
            icon={<ArrowCounterClockwise size={16} weight="bold" />}
            className="w-full py-3.5 text-xs sm:text-sm shadow-md"
          >
            Pesan Tambahan / Kembali ke Menu
          </ExpandingButton>
          <p className="text-[11px] text-[var(--text-light)] text-center leading-relaxed">
            Halaman ini terhubung secara realtime. Status akan otomatis berubah saat barista memproses pesanan.
          </p>
        </div>
      </div>
    </div>
  );
}
