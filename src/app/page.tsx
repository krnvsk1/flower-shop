'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { FlowerGrid } from '@/components/store/flower-grid';
import { StoreHeader } from '@/components/store/store-header';
import { CartDrawer } from '@/components/store/cart-drawer';
import { CheckoutDialog } from '@/components/store/checkout-dialog';
import { Shield } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <StoreHeader onCartClick={() => setCartOpen(true)} />

      {mounted && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2">
          <Link
            href="/admin"
            className="text-[11px] text-slate-300 hover:text-slate-500 transition-colors inline-flex items-center gap-1"
            title="Войти в панель администратора"
          >
            <Shield className="w-3 h-3" />
            Админ
          </Link>
        </div>
      )}

      <main className="flex-1 py-6">
        <FlowerGrid />
      </main>

      <footer className="border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">
            Цветочный магазин — Доставка цветов по городу
          </p>
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
