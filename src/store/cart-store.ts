import { create } from 'zustand';

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

export const useCartStore = create<CartStore>((set, get) => ({
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
}));
