'use client';

import { useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import type { CartItem } from '@/store/cart-store';
import { cn } from '@/lib/utils';

export interface Flower {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  category: string | null;
}

interface FlowerCardProps {
  flower: Flower;
  expanded: boolean;
  featured?: boolean;
  onToggle: () => void;
}

type Flight = {
  imageUrl?: string | null;
  letter: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tx: number;
  ty: number;
};

export function FlowerCard({ flower, expanded, featured = false, onToggle }: FlowerCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const originRef = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(flower.imageUrl) && !imageFailed;

  const inStock = flower.stock > 0;
  const maxQty = Math.max(flower.stock, 1);
  const letter = flower.name.trim().charAt(0).toUpperCase();

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation();
    if (!inStock || flight) return;

    const origin = originRef.current?.getBoundingClientRect();
    const cart = document.querySelector('[data-cart-target]')?.getBoundingClientRect();
    const quantity = Math.min(Math.max(1, qty), flower.stock);

    const cartItem: CartItem = {
      flowerId: flower.id,
      name: flower.name,
      price: flower.price,
      quantity,
      imageUrl: flower.imageUrl,
    };

    if (origin && cart) {
      setFlight({
        imageUrl: flower.imageUrl,
        letter,
        x: origin.left,
        y: origin.top,
        w: origin.width,
        h: origin.height,
        tx: cart.left + cart.width / 2 - 22,
        ty: cart.top + cart.height / 2 - 22,
      });
      window.setTimeout(() => {
        addItem(cartItem);
        setQty(1);
        onToggle();
      }, 420);
      return;
    }

    addItem(cartItem);
    setQty(1);
    onToggle();
  };

  return (
    <>
      <motion.article
        layout
        animate={{
          scale: expanded ? 1.015 : 1,
          y: expanded ? -6 : 0,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={cn('relative h-full', expanded ? 'z-30' : 'z-0')}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!flight) onToggle();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!flight) onToggle();
            }
          }}
          className={cn(
            'group w-full h-full text-left cursor-pointer overflow-hidden bg-secondary',
            expanded && 'ring-1 ring-foreground/15 shadow-[0_30px_80px_-40px_rgba(40,24,16,0.55)]'
          )}
        >
          <div
            ref={originRef}
            className={cn(
              'relative overflow-hidden',
              featured ? 'aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] min-h-[420px]' : 'aspect-[3/4]'
            )}
          >
            {showPhoto ? (
              <img
                src={flower.imageUrl!}
                alt={flower.name}
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#efe8dc] via-[#e4d3c4] to-[#c9b6a4]">
                <span className="font-display italic absolute inset-0 flex items-center justify-center text-[28vw] sm:text-[8rem] text-foreground/10 select-none">
                  {letter}
                </span>
              </div>
            )}
            <div
              className={cn(
                'absolute inset-0',
                showPhoto
                  ? 'bg-gradient-to-t from-foreground/65 via-foreground/10 to-transparent'
                  : 'bg-gradient-to-t from-foreground/25 via-transparent to-transparent'
              )}
            />
            <div
              className={cn(
                'absolute top-4 left-4 text-[10px] tracking-[0.28em] uppercase',
                showPhoto ? 'text-primary-foreground/90' : 'text-foreground/55'
              )}
            >
              {flower.category || 'Цветы'}
            </div>
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 p-5 sm:p-6',
                showPhoto ? 'text-primary-foreground' : 'text-foreground'
              )}
            >
              <h3
                className={cn(
                  'font-display leading-[0.95] pr-4',
                  featured ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                )}
              >
                {flower.name}
              </h3>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="font-display text-xl sm:text-2xl">
                  {flower.price.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-[10px] tracking-[0.18em] uppercase opacity-80">
                  {inStock ? 'В наличии' : 'Нет'}
                </span>
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                key="qty"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="bg-foreground text-primary-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 flex flex-col gap-4">
                  {flower.description ? (
                    <p className="text-sm leading-relaxed text-primary-foreground/75">
                      {flower.description}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center border border-primary-foreground/25">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-none text-primary-foreground hover:bg-primary-foreground/10 cursor-pointer"
                        disabled={!inStock || qty <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQty((n) => Math.max(1, n - 1));
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-10 text-center font-display text-lg">{qty}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-none text-primary-foreground hover:bg-primary-foreground/10 cursor-pointer"
                        disabled={!inStock || qty >= maxQty}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQty((n) => Math.min(maxQty, n + 1));
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="font-display text-xl">
                      {(flower.price * qty).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={!inStock || Boolean(flight)}
                    className="w-full bg-primary-foreground text-foreground hover:bg-primary-foreground/90 cursor-pointer rounded-none h-11 tracking-[0.18em] uppercase text-[11px]"
                  >
                    {inStock ? 'В корзину' : 'Нет в наличии'}
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.article>

      {typeof document !== 'undefined' && flight
        ? createPortal(
            <motion.div
              className="fixed z-[80] pointer-events-none overflow-hidden bg-[#e4d3c4] shadow-lg"
              initial={{
                left: flight.x,
                top: flight.y,
                width: flight.w,
                height: flight.h,
                opacity: 1,
                borderRadius: 0,
              }}
              animate={{
                left: flight.tx,
                top: flight.ty,
                width: 44,
                height: 44,
                opacity: 0.2,
                borderRadius: 999,
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => setFlight(null)}
            >
              {flight.imageUrl ? (
                <img src={flight.imageUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display italic text-2xl text-foreground/40">
                  {flight.letter}
                </span>
              )}
            </motion.div>,
            document.body
          )
        : null}
    </>
  );
}
