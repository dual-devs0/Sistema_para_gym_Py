# Audit Fase 0 — Fixes aplicados (2026-08-09)

Fixes de la auditoría + Fase 0 del plan de desarrollo (`plan-desarrollo-gympro`).
Verificado: `tsc -b` + `vite build` OK en frontend, `py_compile` en backend.

---

## 1. Fixes aplicados

### 1.1 — Refresh token rompe la sesión en la 2ª renovación (plan 0.1)
- **Archivo**: `frontend/src/services/api.ts`
- El interceptor hardcodeaba `axios.post("/api/v1/auth/refresh")` (ignoraba `VITE_API_URL`) y solo guardaba el `access_token` nuevo, descartando el `refresh_token` rotado. El backend revoca el refresh en cada uso → la sesión moría en el 2º refresh.
- **Fix**: la llamada usa ahora la instancia `api` (respeta `baseURL`) y persiste **ambos** tokens.
- **Validación manual pendiente**: login → forzar 2 refreshs → sesión debe seguir viva.

### 1.2 — Campo `registered_at` inexistente (plan 0.2)
- **Archivos**: `frontend/src/types/api.ts`, `frontend/src/pages/members/MembersPage.tsx`
- El backend devuelve `created_at`. El frontend tipaba/usaba `registered_at` → "Registro" siempre "—".
- **Fix**: renombrado a `created_at` en tipo y en la columna.

### 1.3 — Asistencia sin nombre del miembro (plan 0.4)
- **Archivos**: `backend/app/services/attendance_service.py`, `backend/app/schemas/attendance.py`
- `AttendanceResponse.member_name` existía pero nunca se poblaba (la tabla mostraba "—").
- **Fix**: el servicio ahora construye `AttendanceResponse` con `member.full_name` en `check_in`, `check_out` y `list_attendance`.
- **Test adaptado**: `tests/test_services/test_attendance_service.py` (el servicio ahora devuelve schemas, `id` es `str`).

### 1.4 — Contadores de asistencia usan UTC (plan 0.5)
- **Archivos**: `backend/app/repositories/attendance_repository.py`, `backend/app/services/attendance_service.py`, `backend/app/services/dashboard_service.py`, `backend/app/utils/date_helpers.py`, `backend/requirements.txt`
- `get_today_summary` / `count_today_by_gym` calculaban "hoy" con `date.today() + timezone.utc` → desfase con la timezone del gym.
- **Fix**: los rangos de "hoy" se calculan con `day_start_local(tz)` usando `Gym.timezone` (nuevo `ZoneInfo` + `tzdata`). Aplica a KPIs de asistencia y dashboard.

### 1.5 — Expiring del dashboard sin nombres (hallazgo de auditoría)
- **Archivos**: `backend/app/repositories/membership_repository.py`, `backend/app/services/dashboard_service.py`, `frontend/src/pages/dashboard/DashboardPage.tsx`, `frontend/src/types/api.ts`
- `list_expiring_soon` no cargaba relaciones y `get_expiring` no incluía `member_name`/`plan_name`; el frontend hardcodeaba `""`.
- **Fix**: repo con `selectinload(member, plan)`; API devuelve `member_name` + `plan_name`; Dashboard los consume con iniciales reales.

### 1.6 — `create_access_token` ignoraba `gym_id` (plan 1.8)
- **Archivo**: `backend/app/core/security.py`
- El payload del access token no incluía `gym_id` pese a recibirlo.
- **Fix**: `_build_token` acepta `gym_id` y lo inyecta en el payload (firma pública sin cambios).

### 1.7 — Moneda inconsistente (plan 0.7, alcance parcial)
- **Archivos**: `frontend/src/utils/index.ts`, `frontend/src/pages/dashboard/DashboardPage.tsx`, `backend/app/api/v1/endpoints/auth.py`
- **Fix**: nuevo `formatCurrency(amount, currency)` + `currencySymbol(currency)` — PYG sin decimales con `₲`. El endpoint `/auth/me` ahora expone `gym.currency` + `gym.timezone`, y el Dashboard usa la moneda real del gym.
- **Pendiente**: aplicar el mismo helper a Membresías/Pagos cuando esos módulos se implementen (hoy son placeholders).

### 1.8 — Limpieza: dos sistemas de UI paralelos
- **Archivos**: `frontend/src/components/feature/StatCard.tsx`, `RevenueChart.tsx`, `MemberStatusDonut.tsx`
- Usaban design tokens inexistentes (`bg-surface-container`, `font-headline-sm`, `var(--color-...)`) — clases sin efecto.
- **Fix**: reescritos con Tailwind estándar (la misma línea visual de Miembros/Asistencia).
- **Borrados** (sin uso): `MembersTable.tsx`, `StatusBadge.tsx`.
- `ExpiringTable.tsx` ya usaba la UI estándar; se mantuvo.

### 1.9 — Dashboard: renew real + labels en español (plan 1.3/1.5)
- **Archivo**: `frontend/src/pages/dashboard/DashboardPage.tsx`
- `handleRenew` era un `console.log` stub. Ahora usa `PUT /memberships/{id}/renew` con invalidación de `dashboard-summary`, `dashboard-expiring`, `members`, `memberships`.
- Labels de tarjetas traducidos y sin duplicados.

---

## 2. Siguientes fases (del plan, actualizado)

El plan original describe un estado anterior del repo: ítems ya resueltos o sin
aplicar se descartan. Orden de ejecución recomendado:

### FASE 1 — Bugs medios remanentes
| # | Tarea | Estado actual |
|---|-------|---------------|
| 1.4 | Invalidar `dashboard-summary`/`memberships` tras pago/reembolso | Pendiente (módulo Pagos es placeholder — se hace al implementarlo) |
| 1.7 | `formatCurrency` en Membresías y Pagos | Pendiente (mismos módulos) |
| — | Code-split del bundle (warning: chunk 670 kB por Recharts) | Opcional |

### FASE 2 — Roles: Admin + Recepción (backend + frontend)
- Agregar rol `reception` a `ROLE_PERMISSIONS` (`backend/app/core/permissions.py`).
  - Permitido: check-in/check-out, alta de miembro, registrar pago.
  - Denegado (403 en backend, ocultar en frontend): reembolsos, edición de planes,
    configuración del gym, dashboard financiero completo.
- Migración Alembic para el nuevo valor de rol.
- Frontend: TopNav/acciones según rol; ruta restringida → mensaje claro, no error crudo.
- Seed: usuario demo `recepcion@gympro.dev`.

### FASE 3 — Historial unificado por miembro
- Vista `/members/{id}` con: datos + plan actual, historial de pagos (filtrado por `member_id`),
  historial de asistencias. Endpoints reutilizan los existentes
  (`GET /members/{id}/memberships`, `/payments`, `/attendance`).

### FASE 4 — Notificaciones y reportes
- Vencimiento próximo → email/WhatsApp (fuente: `dashboard/expiring`).
- Exportes PDF/Excel: ingresos, asistencias, churn mensual (reutilizar queries del dashboard).
- Auditoría de cambios: quién canceló/congeló/renovó y cuándo (modelo `AuditLog` ya existe).

### FASE 5 — Check-in por QR/carnet
- Definir si lo usa Recepción (escanea carnet) o autoservicio (totem). Requiere Fase 0
  de asistencia cerrada (ya aplicada).
- Pasar por la misma lógica anti-doble-check-in (`get_today_checkin` + descuento de `remaining_visits`).

### Pendientes transversales (fuera de fases)
- Definir unidad de moneda/números entre GitLab repo y este repo (2 ramas divergentes).
- `backend.zip` (snapshot viejo) — eliminar; Git es la fuente de verdad.
- Confirmar pruebas manuales contra la demo (`demo@gympro.dev`) en entorno con Docker.