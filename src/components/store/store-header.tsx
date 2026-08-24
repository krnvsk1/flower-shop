'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';

interface StoreHeaderProps {
  onCartClick: () => void;
}

export function StoreHeader({ onCartClick }: StoreHeaderProps) {
  const count = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.25rem] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-display text-2xl font-semibold tracking-wide text-foreground leading-none">
            Atelier
          </span>
          <span className="text-[10px] tracking-[0.28em] uppercase text-brass mt-1">
            Цветочный дом
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onCartClick}
          className="relative text-foreground hover:text-primary hover:bg-secondary rounded-full h-11 w-11 cursor-pointer"
          aria-label="Открыть корзину"
        >
          <ShoppingBag className="w-5 h-5" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
              >
                {count > 99 ? '99+' : count}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </header>
  );
}
