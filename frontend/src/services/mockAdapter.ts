import type { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  MOCK_CREDENTIALS,
  mockUser,
  mockTokenResponse,
  mockSummary,
  mockRevenue,
  mockExpiring,
  mockMembers,
} from "../mocks";

// Dev-only preview transport. Wired in as a custom axios adapter from
// api.ts, only when VITE_MOCK_MODE=true in a dev server (see api.ts for
// the production-safety guard). Never touches the network.

function ok<T>(config: AxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return { data, status, statusText: "OK", headers: {}, config: config as any, request: {} };
}

function fail(config: AxiosRequestConfig, status: number, detail: string): Promise<never> {
  const error: any = new Error(detail);
  error.isAxiosError = true;
  error.config = config;
  error.response = { data: { detail }, status, statusText: "Error", headers: {}, config };
  return Promise.reject(error);
}

export async function mockRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
  await new Promise((r) => setTimeout(r, 250)); // feel like a real request

  const method = (config.method || "get").toLowerCase();
  const url = (config.url || "").replace(/^\/+/, "");
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;

  if (method === "post" && url === "auth/login") {
    if (body?.email === MOCK_CREDENTIALS.email && body?.password === MOCK_CREDENTIALS.password) {
      return ok(config, mockTokenResponse);
    }
    return fail(config, 401, "Email o contraseña inválidos");
  }

  if (method === "post" && url === "auth/logout") {
    return ok(config, null, 204);
  }

  if (method === "get" && url === "users/me") {
    return ok(config, mockUser);
  }

  if (method === "get" && url === "dashboard/summary") {
    return ok(config, mockSummary);
  }

  if (method === "get" && url === "dashboard/revenue") {
    return ok(config, mockRevenue);
  }

  if (method === "get" && url === "dashboard/expiring") {
    return ok(config, mockExpiring);
  }

  if (method === "get" && url === "members") {
    return ok(config, mockMembers);
  }

  // Unmapped route in preview mode: return a harmless empty response
  // instead of hitting a network that doesn't exist, so other pages
  // don't hang mid-request while browsing.
  return ok(config, method === "get" ? [] : null);
}
