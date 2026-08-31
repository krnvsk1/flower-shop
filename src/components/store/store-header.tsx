'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import type { PublicPromo } from '@/lib/promo';

interface StoreHeaderProps {
  onCartClick: () => void;
}

function readPromos(data: unknown): PublicPromo[] {
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: PublicPromo[] }).items;
  }
  return [];
}

export function StoreHeader({ onCartClick }: StoreHeaderProps) {
  const count = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const [promos, setPromos] = useState<PublicPromo[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/promo');
        if (!res.ok) return;
        setPromos(readPromos(await res.json()));
      } catch {
        setPromos([]);
      }
    };
    void load();
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#f4eee4]/55 backdrop-blur-md">
      {promos.length > 0 ? (
        <div className="px-5 sm:px-8 lg:px-12 py-2 border-b border-border/50 text-center">
          <p className="text-[11px] tracking-[0.22em] uppercase text-foreground">
            {promos
              .map((promo) => `${promo.badge} · −${promo.discountPercent}% · ${promo.title}`)
              .join('  ·  ')}
          </p>
        </div>
      ) : null}
      <div className="flex items-center justify-between px-5 sm:px-8 lg:px-12 h-16 sm:h-[4.5rem]">
        <a href="/" className="font-display text-[1.65rem] font-semibold tracking-tight leading-none">
          Atelier
        </a>
        <nav className="hidden sm:flex items-center gap-8 text-[11px] tracking-[0.22em] uppercase text-muted-foreground">
          <a href="#collection" className="hover:text-foreground transition-colors">
            Коллекция
          </a>
          <span className="text-foreground/30">Город</span>
        </nav>
        <button
          type="button"
          onClick={onCartClick}
          data-cart-target
          className="relative inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase cursor-pointer hover:text-primary transition-colors"
          aria-label="Открыть корзину"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden sm:inline">Корзина</span>
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-[10px] tracking-normal font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
              >
                {count > 99 ? '99+' : count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
