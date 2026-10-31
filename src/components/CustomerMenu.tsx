'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem } from '@/lib/types';
import { formatRupiah } from '@/lib/store';
import {
  MagnifyingGlass,
  ShoppingBag,
  Sparkle,
  Coffee,
  ForkKnife,
  Leaf,
  MapPin,
} from '@phosphor-icons/react';
import { SharedLayoutTabs, TabItem } from './motion/SharedLayoutTabs';
import { AdaptiveStepper } from './motion/AdaptiveStepper';
import { AnimatedBadge } from './motion/AnimatedBadge';
import { AnimatedNumber } from './motion/AnimatedNumber';
import { Marquee } from './motion/Marquee';
import { SPRING_LAYOUT } from '@/lib/ease';

import { DEFAULT_ANNOUNCEMENT, parseAnnouncementItems } from '@/lib/store';

interface CustomerMenuProps {
  menu: MenuItem[];
  cart: Record<string, number>;
  onAddToCart: (id: string, delta: number) => void;
  onOpenCart: () => void;
  tableNumber: string;
  announcementText?: string;
}

export function CustomerMenu({
  menu,
  cart,
  onAddToCart,
  onOpenCart,
  tableNumber,
  announcementText = DEFAULT_ANNOUNCEMENT,
}: CustomerMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const announcementItems = parseAnnouncementItems(announcementText);

  const categoryTabs: TabItem[] = [
    { id: 'Semua', label: 'Semua', icon: Sparkle },
    { id: 'Kopi', label: 'Kopi', icon: Coffee },
    { id: 'Non-Kopi', label: 'Non-Kopi', icon: Leaf },
    { id: 'Makanan', label: 'Makanan', icon: ForkKnife },
  ];

  // Calculate cart summary
  const totalItemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  // Filter items
  const filteredItems = menu.filter((item) => {
    const matchesCategory =
      selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-4xl mx-auto pb-32">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-warm)] mb-4">
        <div className="relative h-44 sm:h-52 w-full overflow-hidden">
          <Image
            src="/images/hero.jpg"
            alt="Kedai Senja Coffee Bar"
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            priority
            className="object-cover object-center filter brightness-[0.88]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            {tableNumber && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/90 text-white shadow-xs">
                  <MapPin size={12} weight="fill" />
                  Meja #{tableNumber}
                </span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight font-serif">
              Aroma Terbaik, Waktu Santai
            </h1>
          </div>
        </div>
      </div>

      {/* Artisanal Cafe Marquee */}
      {announcementItems.length > 0 && (
        <div className="mb-5 px-3 py-1.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xs">
          <Marquee speed={30} className="text-xs text-[var(--text-muted)] font-medium">
            {announcementItems.map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="inline-flex items-center gap-1.5 text-[var(--text-main)] font-semibold">
                  {item}
                </span>
                <span className="text-[var(--text-light)] select-none">•</span>
              </React.Fragment>
            ))}
          </Marquee>
        </div>
      )}

      {/* Category Pills & Search Bar */}
      <div className="sticky top-[61px] z-20 bg-[var(--bg-primary)]/95 backdrop-blur-md py-2.5 mb-5 space-y-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-light)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kopi, teh, pastry, camilan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-0.5 rounded-lg bg-[var(--bg-muted)]"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Categories with beUI Shared Layout Tabs */}
        <div className="flex overflow-x-auto pb-1 scrollbar-none">
          <SharedLayoutTabs
            items={categoryTabs}
            activeId={selectedCategory}
            onChange={(id) => setSelectedCategory(id)}
            layoutId="customer-category-tabs"
          />
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredItems.map((item) => {
          const qty = cart[item.id] || 0;
          const isSoldOut = !item.is_available;

          return (
            <div
              key={item.id}
              className={`group flex items-start gap-3.5 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs transition-all hover:border-[var(--border-strong)] hover:shadow-sm ${
                isSoldOut ? 'opacity-65' : ''
              }`}
            >
              {/* Product Visual */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[var(--bg-muted)] flex-none border border-[var(--border-subtle)]">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100px, 120px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {item.emoji}
                  </div>
                )}
                {item.badge && (
                  <div className="absolute top-1.5 left-1.5">
                    <AnimatedBadge
                      tone={
                        item.badge === 'Favorit' || item.badge === 'Best Seller'
                          ? 'accent'
                          : 'primary'
                      }
                      pulse={item.badge === 'Favorit' || item.badge === 'Best Seller'}
                    >
                      {item.badge}
                    </AnimatedBadge>
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)] leading-snug line-clamp-1 font-serif">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                    {item.description || 'Pilihan nikmat khas Kedai Senja.'}
                  </p>
                </div>

                {/* Price and Cart Controls with beUI AdaptiveStepper */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[var(--border-subtle)]/60">
                  <span className="font-extrabold text-sm sm:text-base text-[var(--primary)] font-serif">
                    {formatRupiah(item.price)}
                  </span>

                  {isSoldOut ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                      Habis
                    </span>
                  ) : (
                    <AdaptiveStepper
                      value={qty}
                      onIncrement={() => onAddToCart(item.id, 1)}
                      onDecrement={() => onAddToCart(item.id, -1)}
                      addLabel="Tambah"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 px-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
          <Coffee size={40} className="mx-auto text-[var(--text-light)] mb-2" />
          <h3 className="font-bold text-[var(--text-main)] text-base font-serif">Menu Tidak Ditemukan</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Coba kata kunci pencarian lain atau pilih kategori Semua.
          </p>
        </div>
      )}

      {/* Floating Sticky Checkout Bar with beUI Island Style & AnimatedNumber */}
      <AnimatePresence>
        {totalItemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.94 }}
            transition={SPRING_LAYOUT}
            className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none flex justify-center"
          >
            <div className="w-full max-w-md pointer-events-auto shadow-2xl rounded-2xl overflow-hidden border border-white/20">
              <button
                type="button"
                onClick={onOpenCart}
                className="w-full flex items-center justify-between p-3.5 bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                    <ShoppingBag size={22} weight="fill" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[var(--primary)]">
                      {totalItemCount}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] text-white/80 font-medium">
                      Pesanan Siap Dikirim
                    </div>
                    <div className="text-base font-extrabold tabular-nums flex items-center gap-1 font-serif">
                      <span>Rp</span>
                      <AnimatedNumber
                        value={totalPrice}
                        format={(n) => n.toLocaleString('id-ID')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-xl transition-colors">
                  <span>Lihat Keranjang</span>
                  <span>→</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
