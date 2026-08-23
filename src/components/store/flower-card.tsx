'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, PackageCheck } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart-store';
import type { CartItem } from '@/store/cart-store';

export interface Flower {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  category: string;
}

interface FlowerCardProps {
  flower: Flower;
}

const FLOWER_EMOJIS: Record<string, string> = {
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

  const emoji = FLOWER_EMOJIS[flower.category] || FALLBACK_EMOJI;
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
    toast.success(`${flower.name} added to cart`);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Image / Placeholder */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-rose-50 to-emerald-50 flex items-center justify-center overflow-hidden">
          {flower.imageUrl ? (
            <img
              src={flower.imageUrl}
              alt={flower.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-7xl select-none" role="img" aria-label={flower.name}>
              {emoji}
            </span>
          )}
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 bg-white/90 text-slate-700 border-slate-200 text-xs backdrop-blur-sm"
          >
            {flower.category}
          </Badge>
        </div>

        <CardContent className="flex-1 p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-slate-800 text-base leading-tight md:text-lg md:leading-relaxed">
            {flower.name}
          </h3>
          <p className="text-sm text-slate-500 md:text-base md:line-clamp-3 leading-relaxed">
            {flower.description}
          </p>
          <div className="flex items-center justify-between mt-auto pt-1">
            <span className="text-lg font-bold text-rose-600 md:text-xl">
              {flower.price.toLocaleString('ru-RU')} ₽
            </span>
            {inStock ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <PackageCheck className="w-3.5 h-3.5" />
                В наличии: {flower.stock}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium md:text-sm">Нет в наличии</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {inStock ? 'В корзину' : 'Нет в наличии'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
