import { create } from "zustand";
import { isAuthenticated, login as apiLogin, logout as apiLogout, fetchMe } from "../services/auth";
import type { UserInfo } from "../types/api";

interface AuthState {
  isAuth: boolean;
  user: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: isAuthenticated(),
  user: null,
  login: async (email, password) => {
    await apiLogin({ email, password });
    const user = await fetchMe();
    set({ isAuth: true, user });
  },
  logout: () => {
    apiLogout();
    set({ isAuth: false, user: null });
  },
  loadUser: async () => {
    if (isAuthenticated()) {
      try {
        const user = await fetchMe();
        set({ user, isAuth: true });
      } catch {
        set({ isAuth: false, user: null });
      }
    }
  },
}));
