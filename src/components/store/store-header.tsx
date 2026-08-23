'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flower2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';

interface StoreHeaderProps {
  onCartClick: () => void;
}

export function StoreHeader({ onCartClick }: StoreHeaderProps) {
  const itemCount = useCartStore((s) => s.itemCount);
  const count = itemCount();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Store name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-sm">
            <Flower2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800 leading-tight tracking-tight md:text-xl">
              Цветочный магазин
            </h1>
            <p className="text-sm text-slate-400 leading-tight hidden sm:block md:text-base">
              Доставка цветов по городу
            </p>
          </div>
        </div>

        {/* Cart button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCartClick}
          className="relative text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-full h-12 w-12 cursor-pointer"
          aria-label="Открыть корзину"
        >
          <ShoppingCart className="w-5 h-5" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm"
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
