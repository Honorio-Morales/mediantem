import { create } from 'zustand';
import type { User, AuthState } from '../types';

interface AuthStore extends AuthState {
    login: (user: User, accessToken: string) => void;
    logout: () => void;
    setToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    accessToken: null,

    login: (user, accessToken) => {
        set({ user, accessToken });
    },

    logout: () => {
        set({ user: null, accessToken: null });
    },

    setToken: (accessToken) => {
        set({ accessToken });
    },
}));
