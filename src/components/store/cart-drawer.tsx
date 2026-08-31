'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
}

function countLabel(count: number) {
  const n = count % 100;
  const n1 = count % 10;
  if (n > 10 && n < 20) return 'позиций';
  if (n1 === 1) return 'позиция';
  if (n1 >= 2 && n1 <= 4) return 'позиции';
  return 'позиций';
}

export function CartDrawer({ open, onOpenChange, onCheckout }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);

  const currentTotal = total();
  const currentCount = itemCount();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 w-full sm:max-w-[28rem] p-0 border-l-border/70 bg-[#f4eee4] shadow-none"
      >
        <SheetHeader className="px-6 pt-8 pb-6 space-y-2 text-left">
          <p className="text-[10px] tracking-[0.32em] uppercase text-brass">Atelier</p>
          <SheetTitle className="font-display text-5xl font-medium leading-none tracking-tight">
            Корзина
          </SheetTitle>
          <SheetDescription className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
            {items.length === 0
              ? 'Пока пусто'
              : `${currentCount} ${countLabel(currentCount)}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative flex flex-col justify-end min-h-[50vh] pb-10"
              >
                <p className="font-display italic absolute inset-0 flex items-center justify-center text-[5.5rem] leading-none text-foreground/8 pointer-events-none select-none">
                  fleur
                </p>
                <p className="relative font-display text-2xl">Выберите букет</p>
                <p className="relative mt-2 max-w-[14rem] text-sm leading-relaxed text-muted-foreground">
                  Откройте коллекцию и добавьте цветок — он появится здесь.
                </p>
              </motion.div>
            ) : (
              <div className="divide-y divide-border/80">
                {items.map((item) => (
                  <motion.div
                    key={item.flowerId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-4 py-6 first:pt-0"
                  >
                    <div className="w-20 h-28 flex-shrink-0 overflow-hidden bg-[#e4d3c4]">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-display italic text-4xl text-foreground/15">
                          {item.name.trim().charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-display text-[1.65rem] leading-[0.95]">{item.name}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.flowerId)}
                          className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground cursor-pointer shrink-0 mt-1"
                        >
                          Убрать
                        </button>
                      </div>
                      <p className="mt-2 font-display text-lg">
                        {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                        {item.listPrice && item.listPrice > item.price ? (
                          <span className="ml-2 text-base line-through text-muted-foreground">
                            {(item.listPrice * item.quantity).toLocaleString('ru-RU')} ₽
                          </span>
                        ) : null}
                      </p>
                      <div className="mt-auto pt-4 flex items-center gap-4">
                        <div className="inline-flex items-center gap-3 text-foreground">
                          <button
                            type="button"
                            className="h-8 w-8 inline-flex items-center justify-center cursor-pointer hover:text-primary"
                            onClick={() => updateQuantity(item.flowerId, item.quantity - 1)}
                            aria-label="Меньше"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-display text-lg w-5 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            className="h-8 w-8 inline-flex items-center justify-center cursor-pointer hover:text-primary"
                            onClick={() => updateQuantity(item.flowerId, item.quantity + 1)}
                            aria-label="Больше"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground">
                          {item.price.toLocaleString('ru-RU')} ₽ / шт.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 ? (
          <div className="px-6 py-6 mt-auto border-t border-border/70">
            <div className="flex items-end justify-between gap-4 mb-5">
              <span className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground pb-1">
                Итого
              </span>
              <span className="font-display text-4xl leading-none">
                {currentTotal.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <Button
              onClick={onCheckout}
              className="w-full bg-foreground hover:bg-foreground/90 text-background cursor-pointer rounded-none h-12 tracking-[0.22em] uppercase text-[11px]"
            >
              Оформить
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
