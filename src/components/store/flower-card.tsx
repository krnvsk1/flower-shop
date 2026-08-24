'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart-store';
import type { CartItem } from '@/store/cart-store';

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
}

const FLOWER_EMOJIS: Record<string, string> = {
  Розы: '🌹',
  Тюльпаны: '🌷',
  Лилии: '🌸',
  Гвоздики: '🏵️',
  Хризантемы: '🌼',
  Орхидеи: '🪻',
  Сезонные: '🌻',
  Композиции: '💐',
  Другое: '🌸',
  Roses: '🌹',
  Tulips: '🌷',
  Lilies: '🌸',
  Sunflowers: '🌻',
  Orchids: '🪻',
  Daisies: '🌼',
  Peonies: '💮',
  Carnations: '🏵️',
};

const FALLBACK_EMOJI = '💐';

export function FlowerCard({ flower }: FlowerCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const emoji = (flower.category && FLOWER_EMOJIS[flower.category]) || FALLBACK_EMOJI;
  const inStock = flower.stock > 0;

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      flowerId: flower.id,
      name: flower.name,
      price: flower.price,
      quantity: 1,
      imageUrl: flower.imageUrl,
    };
    addItem(cartItem);
    toast.success(`${flower.name} добавлен в корзину`);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="overflow-hidden border-border bg-card shadow-none hover:shadow-[0_12px_40px_-24px_rgba(80,40,40,0.45)] transition-shadow h-full flex flex-col rounded-none py-0 gap-0">
        <div className="relative w-full aspect-[4/5] bg-secondary flex items-center justify-center overflow-hidden">
          {flower.imageUrl ? (
            <img
              src={flower.imageUrl}
              alt={flower.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-display text-5xl text-primary/30 select-none" aria-hidden>
              {emoji}
            </span>
          )}
          <span className="absolute top-3 left-3 text-[10px] tracking-[0.18em] uppercase bg-background/90 text-foreground px-2.5 py-1">
            {flower.category || 'Цветы'}
          </span>
        </div>

        <CardContent className="flex-1 p-5 flex flex-col gap-2">
          <h3 className="font-display text-xl font-semibold text-foreground leading-snug">
            {flower.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {flower.description}
          </p>
          <div className="flex items-end justify-between mt-auto pt-3">
            <span className="font-display text-2xl text-primary">
              {flower.price.toLocaleString('ru-RU')} ₽
            </span>
            {inStock ? (
              <span className="text-[11px] tracking-wide uppercase text-sage">
                В наличии
              </span>
            ) : (
              <span className="text-[11px] tracking-wide uppercase text-muted-foreground">Нет в наличии</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer rounded-none h-11 tracking-wide"
          >
            {inStock ? 'В корзину' : 'Нет в наличии'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
