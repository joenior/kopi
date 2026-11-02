'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User, ShieldCheck, Sun, Moon, Database, Check, Copy, X, LockKey, SignOut } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { SPRING_LAYOUT } from '@/lib/ease';
import { isSupabaseConfigured, shouldShowDbStatus } from '@/lib/supabase';

interface HeaderProps {
  mode: 'cust' | 'adm';
  onModeChange: (mode: 'cust' | 'adm') => void;
  tableNumber?: string | null;
  authUser?: SupabaseUser | null;
  userRole?: 'staff' | 'owner';
  onRoleChange?: (role: 'staff' | 'owner') => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export function Header({
  mode,
  onModeChange,
  tableNumber,
  authUser,
  userRole = 'owner',
  onRoleChange,
  onOpenAuth,
  onSignOut,
}: HeaderProps) {
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
      // fallback
      navigator.clipboard.writeText('-- Silakan buka file supabase/schema.sql di repo project');
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-[var(--border-subtle)] px-4 py-3 transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] border border-[var(--border-subtle)] flex items-center justify-center p-1.5 shadow-sm">
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
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-[var(--text-main)] font-serif">
                  Kedai Senja
                </span>
              </div>
              {tableNumber && (
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  Pesanan Meja #{tableNumber}
                </p>
              )}
            </div>
          </div>

          {/* Controls: Mode Switch, Theme, DB status */}
          <div className="flex items-center gap-2">
            {/* Database indicator (Hanya di preview / disembunyikan di production) */}
            {showDbStatus && (
              <button
                onClick={() => setShowDbModal(true)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all active-press shadow-2xs cursor-pointer ${supabaseConnected
                    ? 'bg-emerald-500/10 text-emerald-900 border-emerald-600/30 hover:bg-emerald-500/15 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-500/10 text-amber-900 border-amber-600/30 hover:bg-amber-500/15 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'
                  }`}
                title="Status Database Supabase"
              >
                <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-600 dark:bg-emerald-400 animate-pulse' : 'bg-amber-600 dark:bg-amber-400'}`} />
                <Database size={13} weight="bold" className={supabaseConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'} />
                <span>{supabaseConnected ? 'Supabase Live' : 'Demo Lokal'}</span>
              </button>
            )}

            {/* Segmented Mode Button with beUI Shared Layout Pill */}
            <div className="relative flex items-center p-1 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-full">
              <button
                type="button"
                onClick={() => onModeChange('cust')}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${mode === 'cust'
                    ? 'text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
              >
                {mode === 'cust' && (
                  <motion.div
                    layoutId="header-mode-indicator"
                    className="absolute inset-0 rounded-full bg-[var(--primary)] shadow-sm -z-10"
                    transition={SPRING_LAYOUT}
                  />
                )}
                <User size={13} weight={mode === 'cust' ? 'bold' : 'regular'} />
                <span>Pelanggan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (mode === 'adm') return;
                  if (!authUser && supabaseConnected) {
                    onOpenAuth?.();
                  } else {
                    onModeChange('adm');
                  }
                }}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${mode === 'adm'
                    ? 'text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
              >
                {mode === 'adm' && (
                  <motion.div
                    layoutId="header-mode-indicator"
                    className="absolute inset-0 rounded-full bg-[var(--primary)] shadow-sm -z-10"
                    transition={SPRING_LAYOUT}
                  />
                )}
                <ShieldCheck size={13} weight={mode === 'adm' ? 'bold' : 'regular'} />
                <span>{mode === 'adm' ? (userRole === 'staff' ? 'Staf (Dapur)' : 'Pemilik') : 'Staf / Pemilik'}</span>
                {!authUser && supabaseConnected && (
                  <LockKey size={11} className="text-amber-500 opacity-90" weight="bold" />
                )}
              </button>
            </div>

            {/* Authenticated Admin Badge & Logout */}
            {mode === 'adm' && authUser && (
              <div className="hidden sm:flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] text-[11px] animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-[var(--text-muted)] truncate max-w-[120px]" title={authUser.email}>
                  {authUser.email}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                  title="Keluar dari Akun Pemilik"
                >
                  <SignOut size={13} weight="bold" />
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <motion.button
              type="button"
              onClick={toggleTheme}
              suppressHydrationWarning
              whileTap={{ scale: 0.88, rotate: isDark ? 45 : -45 }}
              whileHover={{ scale: 1.06 }}
              className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer"
              title="Ganti Tema"
              aria-label="Ganti Tema"
            >
              {mounted && isDark ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Supabase Information & Setup Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDbModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-muted)] transition-colors"
            >
              <X size={18} weight="bold" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                <Database size={22} weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)] leading-tight">
                  Koneksi Database Supabase
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Arsitektur Next.js 16 + PostgreSQL Supabase Realtime
                </p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border mb-4 text-xs ${supabaseConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
              }`}>
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors active-press"
                >
                  {copiedSql ? <Check size={15} weight="bold" /> : <Copy size={15} weight="bold" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin Perintah SQL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border-strong)] text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
