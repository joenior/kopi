'use client';

import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import { SPRING_PRESS } from '@/lib/ease';
import { cn } from '@/lib/utils';

export interface ExpandingButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  isLoading?: boolean;
}

export function ExpandingButton({
  children,
  icon,
  variant = 'primary',
  isLoading = false,
  className,
  disabled,
  ...props
}: ExpandingButtonProps) {
  const reduce = useReducedMotion();

  const variantClass = {
    primary: 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md shadow-[var(--primary)]/20',
    secondary: 'bg-[var(--bg-surface)] hover:bg-[var(--primary-light)] text-[var(--text-main)] border border-[var(--border-subtle)]',
    accent: 'bg-[var(--accent)] hover:opacity-95 text-white shadow-md shadow-amber-500/20',
  }[variant];

  return (
    <motion.button
      whileHover={reduce || disabled || isLoading ? undefined : { scale: 1.02 }}
      whileTap={reduce || disabled || isLoading ? undefined : { scale: 0.97 }}
      transition={SPRING_PRESS}
      disabled={disabled || isLoading}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm select-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        variantClass,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          <span>{children}</span>
          <span className="inline-flex transition-transform duration-200 group-hover:translate-x-1">
            {icon || <ArrowRight size={16} weight="bold" />}
          </span>
        </>
      )}
    </motion.button>
  );
}
