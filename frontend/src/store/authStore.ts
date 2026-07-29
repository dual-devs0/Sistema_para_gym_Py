import { create } from "zustand";
import { isAuthenticated, login, logout, register as registerService, getCurrentUser } from "../services/auth";
import type { User } from "../types/api";

interface AuthState {
  isAuth: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: isAuthenticated(),
  user: null,
  login: async (email, password) => {
    await login({ email, password });
    set({ isAuth: true });
    try {
      const user = await getCurrentUser();
      set({ user });
    } catch {
      set({ user: null });
    }
  },
  register: async (email, password, full_name) => {
    await registerService({ email, password, full_name });
    set({ isAuth: true });
    try {
      const user = await getCurrentUser();
      set({ user });
    } catch {
      set({ user: null });
    }
  },
  logout: () => {
    logout();
    set({ isAuth: false, user: null });
  },
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    try {
      const user = await getCurrentUser();
      set({ user });
    } catch {
      set({ user: null });
    }
  },
}));