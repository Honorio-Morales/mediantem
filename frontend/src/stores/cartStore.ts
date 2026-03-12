import { create } from 'zustand';
import type { CartItem } from '../types';

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (variantId: number) => void;
    updateQuantity: (variantId: number, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: typeof window !== 'undefined'
        ? JSON.parse(sessionStorage.getItem('mediantem_cart') || '[]')
        : [],

    addItem: (item) => {
        set((state) => {
            const existing = state.items.find((i) => i.variantId === item.variantId);
            let newItems: CartItem[];

            if (existing) {
                newItems = state.items.map((i) =>
                    i.variantId === item.variantId
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                );
            } else {
                newItems = [...state.items, item];
            }

            if (typeof window !== 'undefined') {
                sessionStorage.setItem('mediantem_cart', JSON.stringify(newItems));
            }
            return { items: newItems };
        });
    },

    removeItem: (variantId) => {
        set((state) => {
            const newItems = state.items.filter((i) => i.variantId !== variantId);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('mediantem_cart', JSON.stringify(newItems));
            }
            return { items: newItems };
        });
    },

    updateQuantity: (variantId, quantity) => {
        set((state) => {
            const newItems = quantity <= 0
                ? state.items.filter((i) => i.variantId !== variantId)
                : state.items.map((i) =>
                    i.variantId === variantId ? { ...i, quantity } : i
                );
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('mediantem_cart', JSON.stringify(newItems));
            }
            return { items: newItems };
        });
    },

    clearCart: () => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('mediantem_cart');
        }
        set({ items: [] });
    },

    getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },
}));
