import api from "./api";
import type { UserInfo } from "../types/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post("/auth/login", payload);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function fetchMe(): Promise<UserInfo> {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("access_token");
}
