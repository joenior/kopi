'use client';

import React, { useState, useEffect } from 'react';
import {
  Broadcast,
  CheckCircle,
  Play,
  Pause,
  Sparkle,
  Gauge,
  Palette,
  NotePencil,
} from '@phosphor-icons/react';

export interface MarqueeConfig {
  enabled: boolean;
  text: string;
  speed: 'slow' | 'medium' | 'fast';
  theme: 'amber' | 'espresso' | 'emerald';
}

export const DEFAULT_MARQUEE: MarqueeConfig = {
  enabled: true,
  text: 'Selamat datang di Kedai Senja · Pesan langsung dari meja, bayar di kasir saat pesanan siap · Buka setiap hari 08.00 - 22.00 · Free WiFi & Stopkontak di Setiap Meja · Promo Beli 2 Kopi Susu Gratis 1 Croissant!',
  speed: 'medium',
  theme: 'amber',
};

export const LOCAL_STORAGE_MARQUEE_KEY = 'menukita_marquee_v1';

export function getMarqueeConfig(): MarqueeConfig {
  if (typeof window === 'undefined') return DEFAULT_MARQUEE;
  const stored = localStorage.getItem(LOCAL_STORAGE_MARQUEE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return DEFAULT_MARQUEE;
}

export function MarqueeManager() {
  const [config, setConfig] = useState<MarqueeConfig>(() => getMarqueeConfig());
  const [savedAlert, setSavedAlert] = useState(false);

  const handleSave = (newConfig: MarqueeConfig) => {
    setConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_MARQUEE_KEY, JSON.stringify(newConfig));
      window.dispatchEvent(new Event('menukita_marquee_updated'));
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2500);
    }
  };

  const speedDuration = {
    slow: '40s',
    medium: '25s',
    fast: '15s',
  }[config.speed];

  const themeClasses = {
    amber: 'bg-amber-500/10 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
    espresso: 'bg-[#2b1d14] text-[#f4ece2] border-[#43362c]',
    emerald: 'bg-emerald-500/10 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
  }[config.theme];

  const presets = [
    {
      title: 'Promo Spesial',
      text: 'PROMO HARI INI: Pesan 2 Kopi Susu Gula Aren, Dapatkan Diskon 20% Pastry Croissant! · Tunjukkan bukti pesanan ke kasir.',
    },
    {
      title: 'Info Jam & Fasilitas',
      text: 'Kedai Senja buka 08.00 - 22.00 · Free High-Speed WiFi · Stopkontak tersedia di area Indoor & Outdoor · Ruang ber-AC nyaman.',
    },
    {
      title: 'Pesan Meja Mandiri',
      text: 'Pesan langsung dari meja tanpa antre kasir · Cukup pilih menu, konfirmasi pesanan, dan bayar saat barista memanggil nomor meja.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              <Broadcast size={22} weight="bold" className="text-[var(--primary)]" />
              <span>Pengaturan Teks Berjalan (Running Marquee)</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Kelola teks pengumuman dan promo yang berjalan secara realtime di halaman pelanggan dan display kedai.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave({ ...config, enabled: !config.enabled })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active-press ${
                config.enabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
              <span>{config.enabled ? 'Status: Aktif' : 'Status: Nonaktif'}</span>
            </button>
          </div>
        </div>

        {/* Live Preview Bar */}
        <div>
          <span className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
            Pratinjau Teks Berjalan (Live Preview):
          </span>
          <div className={`overflow-hidden rounded-xl border p-2.5 text-xs font-bold ${themeClasses}`}>
            {config.enabled ? (
              <div
                className="whitespace-nowrap inline-block animate-marquee"
                style={{ animationDuration: speedDuration }}
              >
                <span className="inline-block px-4">{config.text}</span>
                <span className="inline-block px-4">{config.text}</span>
              </div>
            ) : (
              <span className="italic text-neutral-500">
                (Teks berjalan sedang dinonaktifkan. Aktifkan sakelar di atas untuk menampilkannya.)
              </span>
            )}
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 pt-2">
          {/* Text input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Kalimat Pengumuman / Promo
            </label>
            <textarea
              rows={3}
              value={config.text}
              onChange={(e) => handleSave({ ...config, text: e.target.value })}
              placeholder="Ketik teks pengumuman berjalan di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all resize-none"
            />
          </div>

          {/* Preset Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1.5">
              Gunakan Templat Cepat:
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleSave({ ...config, text: p.text })}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] hover:border-[var(--border-strong)] text-[11px] font-medium text-[var(--text-main)] transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Speed & Theme Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Speed */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                <Gauge size={14} />
                <span>Kecepatan Berjalan</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['slow', 'medium', 'fast'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleSave({ ...config, speed: spd })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      config.speed === spd
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xs'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {spd === 'slow' ? 'Lambat' : spd === 'medium' ? 'Sedang' : 'Cepat'}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                <Palette size={14} />
                <span>Warna Tema Banner</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'amber', label: 'Amber Crema' },
                  { key: 'espresso', label: 'Espresso' },
                  { key: 'emerald', label: 'Emerald' },
                ].map((th) => (
                  <button
                    key={th.key}
                    type="button"
                    onClick={() => handleSave({ ...config, theme: th.key as MarqueeConfig['theme'] })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      config.theme === th.key
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xs'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {savedAlert && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold animate-fade-in">
            <CheckCircle size={15} weight="bold" />
            <span>Perubahan teks berjalan berhasil disimpan dan aktif!</span>
          </div>
        )}
      </div>
    </div>
  );
}
