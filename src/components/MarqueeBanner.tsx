'use client';

import React, { useState, useEffect } from 'react';
import { getMarqueeConfig, MarqueeConfig } from './MarqueeManager';
import { Megaphone } from '@phosphor-icons/react';

export function MarqueeBanner() {
  const [config, setConfig] = useState<MarqueeConfig | null>(() =>
    typeof window !== 'undefined' ? getMarqueeConfig() : null
  );

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getMarqueeConfig());
    };
    window.addEventListener('menukita_marquee_updated', handleUpdate);
    return () => {
      window.removeEventListener('menukita_marquee_updated', handleUpdate);
    };
  }, []);

  if (!config || !config.enabled) return null;

  const speedDuration = {
    slow: '45s',
    medium: '28s',
    fast: '16s',
  }[config.speed];

  const themeClasses = {
    amber: 'bg-amber-500/10 text-amber-900 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/70',
    espresso: 'bg-[#2b1d14] text-[#f4ece2] border-[#43362c]',
    emerald: 'bg-emerald-500/10 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/70',
  }[config.theme];

  return (
    <div className={`w-full overflow-hidden border rounded-2xl p-2.5 mb-4 text-xs font-bold flex items-center shadow-2xs ${themeClasses}`}>
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--primary)] text-white text-[11px] font-bold flex-none mr-2 shadow-2xs">
        <Megaphone size={13} weight="fill" />
        <span>Info</span>
      </div>
      <div className="overflow-hidden flex-1 relative">
        <div
          className="whitespace-nowrap inline-block animate-marquee"
          style={{ animationDuration: speedDuration }}
        >
          <span className="inline-block px-4">{config.text}</span>
          <span className="inline-block px-4">{config.text}</span>
        </div>
      </div>
    </div>
  );
}
