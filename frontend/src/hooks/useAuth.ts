import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const isAuth = useAuthStore((s) => s.isAuth);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  return { isAuth, login, logout };
}
