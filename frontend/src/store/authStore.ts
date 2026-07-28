import { create } from "zustand";
import { isAuthenticated, login, logout } from "../services/auth";

interface AuthState {
  isAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: isAuthenticated(),
  login: async (email, password) => {
    await login({ email, password });
    set({ isAuth: true });
  },
  logout: () => {
    logout();
    set({ isAuth: false });
  },
}));
