'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Plus, Minus } from '@phosphor-icons/react';
import { SPRING_PRESS, SPRING_LAYOUT } from '@/lib/ease';
import { cn } from '@/lib/utils';

export interface AdaptiveStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  addLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function AdaptiveStepper({
  value,
  onIncrement,
  onDecrement,
  min = 0,
  max = 99,
  disabled = false,
  addLabel = 'Tambah',
  className,
  size = 'md',
}: AdaptiveStepperProps) {
  const reduce = useReducedMotion();
  const isZero = value <= min;

  if (isZero) {
    return (
      <motion.button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        whileHover={reduce || disabled ? undefined : { scale: 1.04 }}
        whileTap={reduce || disabled ? undefined : { scale: 0.95 }}
        transition={SPRING_PRESS}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold bg-[var(--primary)] text-white shadow-xs hover:bg-[var(--primary-hover)] transition-colors active:scale-95 disabled:opacity-50 cursor-pointer',
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm',
          className
        )}
      >
        <Plus size={13} weight="bold" />
        <span>{addLabel}</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      transition={SPRING_LAYOUT}
      className={cn(
        'inline-flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] shadow-xs select-none',
        className
      )}
    >
      <motion.button
        type="button"
        onClick={onDecrement}
        whileHover={reduce ? undefined : { scale: 1.1 }}
        whileTap={reduce ? undefined : { scale: 0.9 }}
        transition={SPRING_PRESS}
        className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
        aria-label="Kurangi jumlah"
      >
        <Minus size={13} weight="bold" />
      </motion.button>

      <span className="w-6 text-center font-bold text-xs sm:text-sm text-[var(--text-main)] tabular-nums overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="inline-block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>

      <motion.button
        type="button"
        onClick={onIncrement}
        disabled={value >= max || disabled}
        whileHover={reduce ? undefined : { scale: 1.1 }}
        whileTap={reduce ? undefined : { scale: 0.9 }}
        transition={SPRING_PRESS}
        className="w-7 h-7 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] flex items-center justify-center transition-colors cursor-pointer shadow-xs disabled:opacity-40"
        aria-label="Tambah jumlah"
      >
        <Plus size={13} weight="bold" />
      </motion.button>
    </motion.div>
  );
}
