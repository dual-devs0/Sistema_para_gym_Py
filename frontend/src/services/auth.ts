import api from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post("/auth/login", payload);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post("/auth/register", payload);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("access_token");
}

export async function getCurrentUser() {
  const { data } = await api.get("/users/me");
  return data;
}