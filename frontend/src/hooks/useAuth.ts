import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const isAuth = useAuthStore((s) => s.isAuth);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const loadUser = useAuthStore((s) => s.loadUser);

  return { isAuth, user, login, logout, loadUser };
}