import axios, { type AxiosAdapter } from "axios";

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_MOCK_MODE: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Dev-only preview mode. `import.meta.env.DEV` is statically false in a
// production build (Vite replaces it at build time), so this whole branch
// — mockAdapter included — is dead-code-eliminated from `npm run build`
// regardless of how VITE_MOCK_MODE ends up set.
const isMockMode = import.meta.env.DEV && import.meta.env.VITE_MOCK_MODE === "true";

const mockAdapter: AxiosAdapter = async (config) => {
  const { mockRequest } = await import("./mockAdapter");
  return mockRequest(config);
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  adapter: isMockMode ? mockAdapter : undefined,
});

if (isMockMode) {
  // eslint-disable-next-line no-console
  console.info("%c[MOCK_MODE] API calls are served from frontend/src/mocks.ts — no backend involved.", "color:#c0c1ff;font-weight:bold");
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post("/api/v1/auth/refresh", {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;