'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({
  children,
  speed = 28,
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={cn('overflow-x-auto whitespace-nowrap py-1', className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex overflow-hidden select-none py-1.5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]',
        className
      )}
    >
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: speed,
        }}
        className={cn(
          'flex shrink-0 items-center gap-6 whitespace-nowrap',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
      >
        <div className="flex items-center gap-6">{children}</div>
        <div className="flex items-center gap-6" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
