# Módulo 1 — Auth & Usuarios

**Commit:** `293a1f7`
**Fecha:** 2026-07-28 19:40:49 -0300
**Descripción:** Implementación completa del sistema de autenticación y gestión de usuarios.

## Frontend

| Tipo | Archivos |
|------|----------|
| **Layout** | `components/layout/Sidebar.tsx` (navegación), `components/layout/ProtectedRoute.tsx` (ruta protegida), `components/layout/PageWrapper.tsx` (wrapper) |
| **Auth** | `pages/auth/LoginPage.tsx` (pantalla de login) |
| **UI** | `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/Input.tsx`, `components/ui/Modal.tsx` |
| **Estado** | `store/authStore.ts` (Zustand store de auth) |
| **Hooks** | `hooks/useAuth.ts` |
| **Router** | `router.tsx` (configuración de rutas protegidas) |
| **Servicios** | `services/auth.ts` (cliente HTTP auth), `services/api.ts` (cliente HTTP base) |
| **Types** | `types/api.ts` (tipos compartidos) |
| **App** | `App.tsx` (root component), `main.tsx` (entry point), `index.css` (estilos globales) |
| **Infra** | `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`, `tailwind.config.ts`, `postcss.config.js`, `.env.example`, `Dockerfile`, `Dockerfile.dev`, `nginx.conf` |