'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { EASE_OUT } from '@/lib/ease';
import { cn } from '@/lib/utils';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
  startOnView?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  format,
  prefix = '',
  suffix = '',
  className,
  startOnView = true,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  // When reduced motion is preferred, render target value directly
  const effectiveValue = reduce ? value : display;

  useEffect(() => {
    if (reduce) {
      fromRef.current = value;
      return;
    }
    if (startOnView && !inView) return;
    const controls = animate(fromRef.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(v),
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [value, duration, inView, startOnView, reduce]);

  const defaultFormat = (n: number) => `${prefix}${Math.round(n).toLocaleString('id-ID')}${suffix}`;
  const formatter = format ?? defaultFormat;

  return (
    <span ref={ref} className={cn('tabular-nums inline-block', className)}>
      {formatter(effectiveValue)}
    </span>
  );
}
