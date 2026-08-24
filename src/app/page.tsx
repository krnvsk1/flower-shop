'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { FlowerGrid } from '@/components/store/flower-grid';
import { StoreHeader } from '@/components/store/store-header';
import { StoreHero } from '@/components/store/store-hero';
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
    <div className="storefront min-h-screen flex flex-col text-foreground">
      <StoreHeader onCartClick={() => setCartOpen(true)} />
      <StoreHero />

      <main className="flex-1 pb-24 pt-6 sm:pt-10">
        <FlowerGrid />
      </main>

      <footer className="px-5 sm:px-8 lg:px-12 py-12 border-t border-border/60">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <p className="font-display italic text-5xl sm:text-7xl leading-none text-foreground">Atelier</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Цветочный дом. Свежий срез каждый день.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            <span>Самовывоз и доставка</span>
            {mounted ? (
              <Link href="/admin" className="hover:text-foreground transition-colors">
                Кабинет
              </Link>
            ) : null}
          </div>
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
