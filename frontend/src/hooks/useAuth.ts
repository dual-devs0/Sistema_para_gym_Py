import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { isAuth, user, login, register, logout, setUser, fetchUser } = useAuthStore();

  return { isAuth, user, login, register, logout, setUser, fetchUser };
}