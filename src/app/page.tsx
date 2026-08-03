'use client';

import { useState } from 'react';
import { FlowerGrid } from '@/components/store/flower-grid';
import { StoreHeader } from '@/components/store/store-header';
import { CartDrawer } from '@/components/store/cart-drawer';
import { CheckoutDialog } from '@/components/store/checkout-dialog';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const SESSION_KEY = 'flower_admin_auth';

export default function Home() {
  const [showAdmin, setShowAdmin] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleToggleAdmin = () => {
    const next = !showAdmin;
    setShowAdmin(next);
    if (!next) {
      sessionStorage.removeItem(SESSION_KEY);
    }
  };

  // Admin mode — show admin panel (it has its own auth gate)
  if (showAdmin) {
    return (
      <div className="relative">
        {/* Small toggle to go back to store */}
        <button
          onClick={handleToggleAdmin}
          className="fixed bottom-4 left-4 z-[60] bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          title="Вернуться в магазин"
        >
          🌸 Магазин
        </button>
        <AdminPanel />
      </div>
    );
  }

  // Store (client) mode
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <StoreHeader onCartClick={() => setCartOpen(true)} />

      {/* Admin toggle — subtle link in header area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2">
        <button
          onClick={handleToggleAdmin}
          className="text-[11px] text-slate-300 hover:text-slate-500 transition-colors flex items-center gap-1 cursor-pointer"
          title="Войти в панель администратора"
        >
          <Shield className="w-3 h-3" />
          Админ
        </button>
      </div>

      <main className="flex-1 py-6">
        <FlowerGrid />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">
            Цветочный магазин — Доставка цветов по городу
          </p>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
