'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { FlowerGrid } from '@/components/store/flower-grid';
import { StoreHeader } from '@/components/store/store-header';
import { CartDrawer } from '@/components/store/cart-drawer';
import { CheckoutDialog } from '@/components/store/checkout-dialog';

function useIsMounted() {
  return useSyncExternalStore(
    (onStoreChange) => {
      onStoreChange();
      return () => {};
    },
    () => true,
    () => false
  );
}

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const mounted = useIsMounted();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <StoreHeader onCartClick={() => setCartOpen(true)} />

      <section className="border-b border-border/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <p className="text-[11px] tracking-[0.35em] uppercase text-brass mb-4">
            Доставка по городу
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1]">
            Цветы с характером
            <br />
            и тихим блеском
          </h2>
          <div className="mx-auto mt-6 h-px w-16 bg-brass/70" />
          <p className="mt-6 max-w-lg mx-auto text-muted-foreground text-[15px] leading-relaxed">
            Свежий срез, спокойные букеты и композиции без лишнего шума.
          </p>
        </div>
      </section>

      <main className="flex-1 py-10 sm:py-14">
        <FlowerGrid />
      </main>

      <footer className="border-t border-border py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Atelier · свежие цветы каждый день</p>
          {mounted ? (
            <Link
              href="/admin"
              className="text-[10px] tracking-widest uppercase text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Кабинет
            </Link>
          ) : null}
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
