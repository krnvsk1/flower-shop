import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  flowerId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (flowerId: string) => void;
  updateQuantity: (flowerId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const flowerId = typeof row.flowerId === 'string' ? row.flowerId : '';
      const name = typeof row.name === 'string' ? row.name : '';
      const price = Number(row.price);
      const quantity = Math.floor(Number(row.quantity));
      if (!flowerId || !name || !Number.isFinite(price) || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }
      return {
        flowerId,
        name,
        price,
        quantity,
        imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : row.imageUrl === null ? null : undefined,
      } satisfies CartItem;
    })
    .filter((item): item is CartItem => item !== null);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        const { items } = get();
        const existing = items.find((i) => i.flowerId === item.flowerId);

        if (existing) {
          set({
            items: items.map((i) =>
              i.flowerId === item.flowerId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      removeItem: (flowerId: string) => {
        set({ items: get().items.filter((i) => i.flowerId !== flowerId) });
      },

      updateQuantity: (flowerId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(flowerId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.flowerId === flowerId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      total: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'atelier-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: sanitizeItems((persisted as { items?: unknown } | undefined)?.items),
      }),
    }
  )
);
