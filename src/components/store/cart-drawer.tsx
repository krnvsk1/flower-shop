'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
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
      <SheetContent side="right" className="flex flex-col bg-white w-full sm:max-w-md">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle className="flex items-center gap-2 text-slate-800">
            <ShoppingBag className="w-5 h-5 text-rose-500" />
            Корзина
            {currentCount > 0 && (
              <span className="text-sm font-normal text-slate-500">
                ({currentCount} {currentCount === 1 ? 'товар' : currentCount < 5 ? 'товара' : 'товаров'})
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            {items.length === 0
              ? 'Ваша корзина пуста'
              : `Товаров в корзине: ${currentCount}`}
          </SheetDescription>
        </SheetHeader>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <ShoppingBag className="w-16 h-16 text-slate-200 mb-4" />
                <p className="text-slate-400 text-sm">Добавьте цветы в корзину</p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <motion.div
                    key={item.flowerId}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    {/* Image or emoji placeholder */}
                    <div className="w-16 h-16 rounded-md bg-gradient-to-br from-rose-50 to-emerald-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <span className="text-2xl" role="img" aria-label={item.name}>
                          💐
                        </span>
                      )}
                    </div>

                    {/* Info & controls */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-rose-600 font-semibold mt-0.5">
                        {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-slate-200 hover:bg-rose-50 hover:border-rose-200"
                          onClick={() =>
                            updateQuantity(item.flowerId, item.quantity - 1)
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center text-slate-700">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-slate-200 hover:bg-rose-50 hover:border-rose-200"
                          onClick={() =>
                            updateQuantity(item.flowerId, item.quantity + 1)
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-auto text-slate-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => removeItem(item.flowerId)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with total and checkout */}
        {items.length > 0 && (
          <>
            <Separator className="bg-slate-100" />
            <SheetFooter className="flex flex-col gap-3 px-4 pb-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-600 font-medium">Итого:</span>
                <span className="text-xl font-bold text-rose-600">
                  {currentTotal.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <Button
                onClick={onCheckout}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                size="lg"
              >
                Оформить заказ
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
