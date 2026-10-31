'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPRING_LAYOUT } from '@/lib/ease';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ size?: number; weight?: 'bold' | 'regular' | 'fill' }>;
  count?: number;
}

export interface SharedLayoutTabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  layoutId?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function SharedLayoutTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  layoutId = 'shared-tab-pill',
  className,
  size = 'md',
}: SharedLayoutTabsProps<T>) {
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center p-1 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-2xl gap-1 select-none overflow-x-auto max-w-full',
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 rounded-xl font-semibold transition-colors z-10 cursor-pointer shrink-0',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm',
              isActive
                ? 'text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={reduce ? undefined : layoutId}
                transition={SPRING_LAYOUT}
                className="absolute inset-0 bg-[var(--primary)] rounded-xl shadow-xs -z-10"
              />
            )}
            {Icon && (
              <Icon
                size={size === 'sm' ? 14 : 16}
                weight={isActive ? 'bold' : 'regular'}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
