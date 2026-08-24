'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

interface StoreHeaderProps {
  onCartClick: () => void;
}

export function StoreHeader({ onCartClick }: StoreHeaderProps) {
  const count = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#f4eee4]/55 backdrop-blur-md">
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
