# Audit Fase 0 — Fixes aplicados (2026-08-09, branch limpia sobre main)

Fixes de la auditoría + Fase 0, reconstruidos sobre `main` (la rama
`fix/audit-phase0` original estaba basada en código pre-rediseño y generaba
conflictos). Solo se portaron los fixes de valor; los rewrite de UI viejos se
descartaron porque `main` ya tiene el dark theme actual.

---

## Backend

### 1.1 — `create_access_token` ignoraba `gym_id`
- **Archivo**: `backend/app/core/security.py`
- El payload del access token no incluía `gym_id` pese a recibirlo.
- **Fix**: `_build_token` acepta `gym_id` y lo inyecta en el payload.

### 1.2 — Asistencia sin nombre del miembro
- **Archivos**: `backend/app/services/attendance_service.py`
- `AttendanceResponse.member_name` existía pero nunca se poblaba.
- **Fix**: el servicio ahora construye `AttendanceResponse` con
  `member.full_name` en `check_in`, `check_out` y `list_attendance`.

### 1.3 — Contadores de asistencia usan UTC
- **Archivos**: `backend/app/repositories/attendance_repository.py`,
  `backend/app/services/attendance_service.py`,
  `backend/app/services/dashboard_service.py`,
  `backend/app/utils/date_helpers.py`, `backend/requirements.txt`
- `get_today_summary` / `count_today_by_gym` calculaban "hoy" con UTC → desfase
  con la timezone del gym.
- **Fix**: rango de "hoy" con `day_start_local(tz)` usando `Gym.timezone`
  (nuevo `ZoneInfo` + `tzdata`).

### 1.4 — Expiring del dashboard con acceso seguro
- **Archivo**: `backend/app/services/dashboard_service.py`
- `member_name`/`plan_name` podían tirar `AttributeError` si la relación no
  estaba cargada.
- **Fix**: acceso condicional `m.member if m.member else None` (el repo ya traía
  `selectinload` en `main`).

### 1.5 — `/auth/me` sin moneda ni timezone
- **Archivo**: `backend/app/api/v1/endpoints/auth.py`
- **Fix**: `gym` ahora expone `name` + `currency` + `timezone` (usado por el
  Dashboard para `formatCurrency`).

---

## Frontend

### 2.1 — Refresh token rompe la sesión en la 2ª renovación
- **Archivo**: `frontend/src/services/api.ts`
- El interceptor hardcodeaba `axios.post("/api/v1/auth/refresh")` (ignoraba
  `VITE_API_URL`) y solo guardaba el `access_token` nuevo, descartando el
  `refresh_token` rotado. El backend revoca el refresh en cada uso → la sesión
  moría en el 2º refresh.
- **Fix**: usamos la instancia `api` (respeta `baseURL`) y persistimos **ambos**
  tokens.

### 2.2 — Campo `registered_at` inexistente
- **Archivos**: `frontend/src/types/api.ts`, `frontend/src/pages/members/MembersPage.tsx`
- El backend devuelve `created_at`; el frontend tipaba/usaba `registered_at` →
  "Registro" siempre "—".
- **Fix**: renombrado a `created_at`.

---

## Sin portar (descartados por conflicto/obsoletos)

- Rewrite de `StatCard.tsx`, `RevenueChart.tsx`, `MemberStatusDonut.tsx` con
  colores Tailwind viejos — `main` ya tiene la versión dark theme.
- Borrado de `MembersTable.tsx` / `StatusBadge.tsx` — en uso en `main`.
- `package-lock.json` viejo — regenerado por el build actual.

## Pendiente

- ~~`backend.zip` (snapshot viejo) — eliminar; Git es la fuente de verdad.~~ Hecho (2026-08-10): eliminado del repo, agregado `*.zip` a `.gitignore`.
- ~~Confirmar pruebas manuales contra la demo en entorno con Docker.~~ Hecho (2026-08-11): Docker Desktop instalado (WSL2 ya estaba disponible), stack completo levantado y validado.

### Bugs encontrados y arreglados al levantar el stack Docker

- `docker-compose.yml` sustituía `${SECRET_KEY}` / `${DB_PASSWORD}` desde un `.env` en la raíz que no existía — el backend crasheaba al levantar (`secret_key` exige `min_length=32`, quedaba vacío). **Fix**: agregado `.env.example` en la raíz + `docs/setup.md` actualizado para copiarlo.
- `make dev` apuntaba a `docker-compose.dev.yml`, archivo inexistente. **Fix**: target simplificado a `docker compose up --build`.
- `backend/alembic/alembic.ini` estaba anidado dentro de `alembic/` en vez de la raíz de `backend/` (layout no estándar) y sin `prepend_sys_path` → `alembic upgrade head` fallaba con `ModuleNotFoundError: No module named 'app'`. **Fix**: movido a `backend/alembic.ini` + `prepend_sys_path = .` agregado.
- `backend/alembic/env.py` usaba `connectable.connect()` en vez de `connectable.begin()` para las migraciones async → la transacción externa (auto-begin de SQLAlchemy 2.0) nunca se commiteaba: `alembic_version` quedaba en `head` pero **ninguna tabla se creaba de verdad** (bug silencioso, sin error). **Fix**: `connectable.begin()` (auto-commit en el `async with`).

### Validación manual end-to-end (Docker, 2026-08-11)

Con el stack completo arriba (`postgres`, `redis`, `backend`, `frontend`) + `scripts/create_demo_user.py`:

- **1.1** `gym_id` presente en el payload del access token (verificado por curl + decode).
- **1.2** `member_name` poblado en `/api/v1/attendance` (ej. "Sarah Jenkins").
- **1.3/1.4** `/api/v1/dashboard/summary` y `/api/v1/dashboard/expiring` responden 200 sin `AttributeError`, `checkins_today` cuadra con la timezone del gym.
- **1.5** `/api/v1/auth/me` expone `gym.currency` (`PYG`) y `gym.timezone` (`America/Asuncion`); el Dashboard del frontend renderiza `₲` correctamente.
- **2.1** Login vía UI funciona, tokens persistidos.
- **2.2** Modal "Detalle del Miembro" muestra `REGISTRADO: 11 ago 2026` (antes quedaba en "—").

### Bug menor sin arreglar (no bloqueante, fuera de alcance fase 0)

- Al cargar el Dashboard, un primer `GET /api/v1/dashboard/summary` sale sin header `Authorization` (422) antes de que el interceptor lo adjunte; un segundo fetch inmediato sí trae el token y responde 200. Parece condición de carrera en el mount inicial — no rompe la UX porque se autocorrige, pero vale la pena revisar el hook que dispara el fetch inicial de auth/dashboard.

### Pendiente real (suite pytest)

- `pytest` dentro del container falla en masa (68 failed / 20 errors) corriendo contra la DB de dev — no relacionado a los fixes de este documento. Requiere revisar `backend/tests/conftest.py` / `DATABASE_URL` de test (el commit `7202db0` ya tocó este tema para CI; falta confirmar que aplica igual en local).