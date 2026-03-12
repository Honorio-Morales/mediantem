import { create } from 'zustand';

interface WishlistState {
    productIds: number[];
    addToWishlist: (productId: number) => void;
    removeFromWishlist: (productId: number) => void;
    isInWishlist: (productId: number) => boolean;
    sync: (ids: number[]) => void;
    clear: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
    productIds: [],

    addToWishlist: (productId) => {
        set((state) => ({
            productIds: state.productIds.includes(productId)
                ? state.productIds
                : [...state.productIds, productId],
        }));
    },

    removeFromWishlist: (productId) => {
        set((state) => ({
            productIds: state.productIds.filter((id) => id !== productId),
        }));
    },

    isInWishlist: (productId) => {
        return get().productIds.includes(productId);
    },

    sync: (ids) => {
        set({ productIds: ids });
    },

    clear: () => {
        set({ productIds: [] });
    },
}));
