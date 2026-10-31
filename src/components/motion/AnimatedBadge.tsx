'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SPRING_PRESS } from '@/lib/ease';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'info';

export interface AnimatedBadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  variant?: BadgeTone;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--border-subtle)]',
  accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  neutral: 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border-subtle)]',
};

const DOT_COLORS: Record<BadgeTone, string> = {
  primary: 'bg-[var(--primary)]',
  accent: 'bg-amber-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-neutral-400',
};

export function AnimatedBadge({
  children,
  tone,
  variant,
  pulse = false,
  size = 'md',
  className,
  icon,
}: AnimatedBadgeProps) {
  const reduce = useReducedMotion();
  const resolvedTone: BadgeTone = variant ?? tone ?? 'primary';

  return (
    <motion.span
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={SPRING_PRESS}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border backdrop-blur-xs select-none shadow-2xs',
        size === 'sm' ? 'px-2 py-0.2 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        TONE_CLASSES[resolvedTone],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              DOT_COLORS[resolvedTone]
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              DOT_COLORS[resolvedTone]
            )}
          />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.span>
  );
}
