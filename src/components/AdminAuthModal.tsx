'use client';

import React, { useState } from 'react';
import {
  LockKey,
  SignIn,
  UserPlus,
  X,
  WarningCircle,
  CheckCircle,
  ShieldCheck,
  Database,
  ArrowRight,
} from '@phosphor-icons/react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Input } from '@/components/motion/input';
import { signInAdmin, signUpAdmin, isSupabaseConfigured } from '@/lib/supabase';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailError =
    email.length > 0 && !email.includes('@')
      ? 'Masukkan alamat email yang valid.'
      : undefined;

  const passwordError =
    password.length > 0 && password.length < 6
      ? 'Kata sandi minimal 6 karakter.'
      : undefined;

  if (!isOpen) return null;

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (!configured) {
      setErrorMessage(
        'Supabase belum terhubung di .env.local. Silakan isi NEXT_PUBLIC_SUPABASE_URL dan KEY untuk mengaktifkan autentikasi.'
      );
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const { data, error } = await signUpAdmin(email.trim(), password);
        if (error) {
          setErrorMessage(error.message || 'Gagal mendaftar akun baru.');
        } else if (data?.user && !data.session) {
          // Supabase email confirmation might be enabled
          setSuccessMessage('Pendaftaran berhasil! Cek email Anda untuk konfirmasi aktivasi akun.');
        } else {
          setSuccessMessage('Pendaftaran berhasil dan Anda telah masuk!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const { data, error } = await signInAdmin(email.trim(), password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('Email atau kata sandi salah. Silakan periksa kembali.');
          } else if (error.message.includes('Email not confirmed')) {
            setErrorMessage('Email belum dikonfirmasi. Periksa kotak masuk/spam email Anda.');
          } else {
            setErrorMessage(error.message || 'Gagal masuk akun.');
          }
        } else if (data?.user) {
          setSuccessMessage('Autentikasi berhasil! Mengalihkan ke dashboard...');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 600);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menghubungi Supabase.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-gradient-to-r from-[var(--primary-light)]/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-md">
              <ShieldCheck size={22} weight="bold" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--text-main)]">
                {isRegister ? 'Daftar Akun Pemilik' : 'Akses Dapur & Pemilik'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Dilindungi Supabase Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors"
            aria-label="Tutup"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Info Banner if Supabase Not Configured */}
        {!configured && (
          <div className="m-5 mb-0 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <Database size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" weight="bold" />
            <div className="space-y-1">
              <p className="font-semibold">Koneksi Supabase Belum Aktif</p>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Aplikasi masih berjalan dalam mode demo lokal. Hubungkan Supabase melalui berkas <code className="px-1 py-0.5 bg-amber-200/60 dark:bg-amber-900/60 rounded">.env.local</code> untuk menggunakan login resmi.
              </p>
            </div>
          </div>
        )}

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-start gap-2 animate-fadeIn">
              <WarningCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" weight="bold" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" weight="bold" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email Field */}
          <Input
            label="Alamat Email Pemilik / Barista"
            type="email"
            placeholder="barista@kedaisenja.com"
            leftIcon={<Mail />}
            value={email}
            onChange={setEmail}
            error={emailError}
            reserveErrorLine
            required
          />

          {/* Password Field */}
          <Input
            label="Kata Sandi"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimal 6 karakter"
            leftIcon={<Lock />}
            value={password}
            onChange={setPassword}
            error={passwordError}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="pointer-events-auto cursor-pointer"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            }
            reserveErrorLine
            required
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRegister ? (
              <>
                <UserPlus size={16} weight="bold" />
                <span>Daftar Akun Baru</span>
              </>
            ) : (
              <>
                <SignIn size={16} weight="bold" />
                <span>Masuk ke Dashboard</span>
              </>
            )}
          </button>

          {/* Toggle Login / Register */}
          <div className="pt-2 text-center text-xs text-[var(--text-muted)]">
            {isRegister ? (
              <p>
                Sudah memiliki akun barista?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-0.5"
                >
                  Masuk di sini <ArrowRight size={12} />
                </button>
              </p>
            ) : (
              <p>
                Belum punya akun pengelola?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-0.5"
                >
                  Daftarkan staf baru <ArrowRight size={12} />
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Security Note Footer */}
        <div className="px-6 py-3 bg-[var(--bg-muted)]/50 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <LockKey size={13} weight="bold" className="text-[var(--primary)]" />
          <span>Hanya akun terdaftar yang dapat mengubah status pesanan & menu</span>
        </div>
      </div>
    </div>
  );
}
