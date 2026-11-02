'use client';

import React from 'react';
import {
  Coffee,
  Drop,
  Cookie,
  ForkKnife,
  CookingPot,
  Sparkle,
  IceCream,
  Wine,
} from '@phosphor-icons/react';

interface MenuIconProps {
  category?: string;
  name?: string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  className?: string;
}

export function MenuIcon({
  category = '',
  name = '',
  size = 20,
  weight = 'duotone',
  className = '',
}: MenuIconProps) {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();

  // Bakery, Pastry, Roti, Croissant
  if (
    n.includes('croissant') ||
    n.includes('pastry') ||
    n.includes('roti') ||
    n.includes('toast') ||
    n.includes('cake') ||
    n.includes('pie')
  ) {
    return <Cookie size={size} weight={weight} className={className} />;
  }

  // Camilan / Fries / Snack
  if (
    n.includes('kentang') ||
    n.includes('fries') ||
    n.includes('snack') ||
    n.includes('truffle') ||
    n.includes('goreng')
  ) {
    return <CookingPot size={size} weight={weight} className={className} />;
  }

  // Makanan umum
  if (cat.includes('makan') || cat.includes('food')) {
    return <ForkKnife size={size} weight={weight} className={className} />;
  }

  // Non-Kopi / Minuman Segar
  if (
    cat.includes('non') ||
    n.includes('matcha') ||
    n.includes('coklat') ||
    n.includes('chocolate') ||
    n.includes('susu') ||
    n.includes('milk') ||
    n.includes('tea') ||
    n.includes('teh') ||
    n.includes('juice') ||
    n.includes('jus')
  ) {
    return <Drop size={size} weight={weight} className={className} />;
  }

  // Default: Kopi / Espresso
  return <Coffee size={size} weight={weight} className={className} />;
}
