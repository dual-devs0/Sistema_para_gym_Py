# GymPro SaaS — Arquitectura del Sistema

> SaaS para gestión de gimnasios pequeños y medianos.
> **Backend:** FastAPI (Python 3.11+) · **Frontend:** React 18 + Vite + TypeScript
> **Base de datos:** PostgreSQL 15 · **Cache/Queues:** Redis

---

## 1. Filosofía de Arquitectura

- **Monorepo** con dos proyectos independientes (`backend/` y `frontend/`)
- **API REST** versionada (`/api/v1/`) con OpenAPI docs automáticas
- **Arquitectura en capas** en backend (API → Service → Repository → DB)
- **Componentes atómicos** en frontend (Atomic Design)
- **Multi-tenancy** por `gym_id` (aislamiento lógico, misma DB)
- **Principio KISS**: lo mínimo indispensable para vender. Nada de microservicios, event sourcing ni over-engineering.

---

## 2. Estructura del Proyecto

```
gympro/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/        # Routers por módulo
│   │   │       ├── deps.py           # Dependency Injection (DB, current user, etc.)
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py             # Settings con Pydantic (env vars)
│   │   │   ├── security.py           # JWT, hash, permisos
│   │   │   ├── database.py           # Engine, session factory
│   │   │   └── exceptions.py         # Error handlers globales
│   │   ├── models/                   # SQLAlchemy models
│   │   ├── schemas/                  # Pydantic request/response
│   │   ├── services/                 # Lógica de negocio
│   │   ├── repositories/            # Acceso a datos (opcional pero recomendado)
│   │   ├── utils/                    # Helpers (dates, math, PDFs)
│   │   └── main.py                   # FastAPI app factory
│   ├── alembic/                      # Migraciones
│   │   └── versions/
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_api/
│   │   └── test_services/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Atomos (Button, Input, Card, Modal)
│   │   │   ├── layout/              # Organismos (Sidebar, Header, PageWrapper)
│   │   │   └── feature/             # Moleculas especificas (MemberCard, PaymentRow)
│   │   ├── pages/                    # Páginas completas
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── members/
│   │   │   ├── memberships/
│   │   │   ├── payments/
│   │   │   ├── attendance/
│   │   │   └── settings/
│   │   ├── hooks/                    # Custom hooks (useAuth, useMembers, etc.)
│   │   ├── services/                 # API client (axios instance + endpoints)
│   │   ├── store/                    # Estado global (Zustand)
│   │   ├── types/                    # TypeScript interfaces
│   │   ├── utils/                    # Helpers (formatDate, formatCurrency)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── router.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml                # PostgreSQL + Redis + Backend + Frontend
├── docker-compose.dev.yml            # + PGAdmin, Redis Commander
├── Makefile                          # Comandos comunes
└── README.md
```

---

## 3. Módulos Base (100% necesarios para vender)

### 3.1. Módulo: Auth & Usuarios
**Propósito:** Login, registro de dueños, gestión de roles.
- Roles: `owner`, `admin`, `trainer`, `receptionist`, `member`
- JWT access + refresh tokens
- Invitación por email para staff
- Perfil con foto y datos básicos
- Multi-tenancy: cada usuario pertenece a un `gym_id`

### 3.2. Módulo: Gimnasio (Tenant)
**Propósito:** Configuración del negocio.
- Nombre, logo, dirección, teléfono
- Horarios de operación (JSON: `{lunes: "06:00-22:00", ...}`)
- Moneda, país, zona horaria
- Plan de suscripción contratado (para el SaaS billing)

### 3.3. Módulo: Miembros (Socios)
**Propósito:** CRUD de miembros + historial.
- Datos personales (nombre, email, teléfono, fecha nacimiento)
- Foto, fecha de registro, estado (`active`, `frozen`, `cancelled`)
- Membresía actual (relación con Memberships)
- Historial de membresías anteriores
- Notas internas (alergias, restricciones)
- Documento de identidad

### 3.4. Módulo: Membresías / Planes
**Propósito:** Planes de suscripción que compran los miembros.
- Tipos: `mensual`, `trimestral`, `anual`, `clases_sueltas`, `pase_diario`
- Precio, duración en días, número de visitas incluidas (opcional)
- Renovación automática (bool)
- Período de gracia para pago atrasado
- Planes visibles vs. internos

### 3.5. Módulo: Asistencias (Check-in/Check-out)
**Propósito:** Control de ingreso diario.
- Registro con fingerprint / QR / búsqueda manual
- Timestamp de entrada y salida
- Validación de membresía activa al ingresar
- Límite de visitas diarias (si aplica)
- Reporte de ingresos por hora

### 3.6. Módulo: Pagos
**Propósito:** Registrar cobros, generar comprobantes.
- Métodos: `efectivo`, `tarjeta`, `transferencia`, `qr_mercadopago`
- Monto, fecha, referencia, membresía asociada
- Factura / recibo simple (PDF descargable)
- Estado: `pending`, `paid`, `refunded`, `cancelled`
- Historial de pagos por miembro

### 3.7. Módulo: Dashboard & Reportes
**Propósito:** Métricas clave para el dueño.
- Ingresos del día / semana / mes (gráfica de línea)
- Miembros activos / nuevos / cancelados
- Asistencias hoy vs. ayer vs. promedio
- Tasa de retención
- Próximos vencimientos (membresías por expirar en 3 días)
- Exportar a CSV/PDF

---

## 4. Base de Datos — Diseño Relacional (Core Tables)

```
gyms
├── id, name, slug, logo_url, address, phone, email
├── currency, timezone, business_hours (JSON), is_active
├── created_at, updated_at

users
├── id, gym_id (FK), email, password_hash, full_name, role (enum)
├── phone, avatar_url, is_active, last_login
├── created_at, updated_at

members
├── id, gym_id (FK), user_id (FK, nullable for members without app access)
├── first_name, last_name, email, phone, document_number
├── birth_date, gender, photo_url, notes, status (enum)
├── registered_at, updated_at

membership_plans
├── id, gym_id (FK), name, description, price, duration_days
├── max_visits (nullable), type (enum), is_active
├── created_at, updated_at

member_memberships
├── id, member_id (FK), plan_id (FK), start_date, end_date
├── remaining_visits (nullable), price_paid, status (enum)
├── auto_renew, renewed_from_id (nullable, FK self)
├── created_at, updated_at

attendance_logs
├── id, member_id (FK), member_membership_id (FK)
├── check_in, check_out (nullable)
├── created_at

payments
├── id, gym_id (FK), member_id (FK), member_membership_id (FK, nullable)
├── amount, payment_method (enum), reference, status (enum)
├── paid_at, notes
├── created_at, updated_at

invoices
├── id, payment_id (FK), invoice_number, pdf_url
├── created_at

audit_logs
├── id, gym_id (FK), user_id (FK), action, entity_type, entity_id
├── old_values (JSON), new_values (JSON)
├── created_at
```

**Índices clave:** `members.gym_id`, `members.status`, `attendance_logs.check_in`, `payments.paid_at`, `member_memberships.end_date`

---

## 5. Decisiones Técnicas (Por Qué)

| Decisión | Alternativa | Motivo |
|---|---|---|
| **SQLAlchemy** vs SQLModel | SQLModel es más nuevo pero SQLAlchemy 2.0 tiene más ecosistema | Preferimos madurez y documentación |
| **Alembic** para migraciones | - | Estándar en Python + FastAPI |
| **PostgreSQL** vs MySQL | Postgres tiene JSONB, mejor full-text search, tipos enum nativos | Más potente sin costo adicional |
| **Zustand** para estado global | Redux, Context | Simple, sin boilerplate, TypeScript-friendly |
| **React Query (TanStack Query)** | SWR, RTK Query | Cache, re-fetch, mutations, devtools maduros |
| **Tailwind CSS** vs CSS Modules, styled-components | - | Prototipado rápido, diseño consistente, producción |
| **Vite** vs CRA, Next.js | - | Dev server instantáneo, build rápido. No necesitamos SSR |
| **Pydantic v2** | - | Validación ultrarrápida (Rust-based), schemas automáticos OpenAPI |
| **Docker Compose** para dev | - | Entorno reproducible, fácil onboarding |

---

## 6. Reglas Esenciales del Proyecto

### Código y Estilo

1. **TypeScript estricto** en frontend — `strict: true` en tsconfig, sin `any`
2. **Pydantic v2** para todos los schemas de request/response — no exponer modelos de DB
3. **Type hints obligatorios** en todas las funciones Python
4. **Nombres en inglés** para código (variables, funciones, modelos, endpoints)
5. **Nombres en español** para datos del negocio si aplica (ej. campos de factura)
6. **Un archivo = una responsabilidad** — máximo 200 líneas por archivo. Si excede, dividir.
7. **Commits atómicos** — un cambio por commit, mensajes en inglés (conventional commits)
8. **No comentarios inline** — el código debe ser auto-documentado. Usar docstrings solo en funciones públicas de servicios.

### Backend

9. **Toda la lógica de negocio en `services/`** — los endpoints SOLO llaman servicios, no hacen lógica
10. **Los endpoints devuelven schemas Pydantic** — nunca devolver modelos SQLAlchemy directamente
11. **Manejo de errores centralizado** — excepciones personalizadas en `core/exceptions.py`, handlers globales
12. **Validación de permisos por decorator o dependency** — no esparcir `if user.role != "admin"` por todos lados
13. **Toda interacción con DB pasa por `repositories/`** — no hay queries SQL en services
14. **Test por capa**: unit tests para services, integration tests para API endpoints
15. **Usar UUIDs como PKs** — no exponer IDs secuenciales al cliente
16. **Soft-delete** para miembros y usuarios (columna `deleted_at`)
17. **Todas las fechas en UTC** dentro del backend, convertir a timezone del gym en frontend

### Frontend

18. **Un solo patrón de fetching:** TanStack Query para datos asíncronos, Zustand solo para UI state (sidebar, modales)
19. **Rutas protegidas por layout** — `ProtectedRoute` wrapper que verifica auth + rol
20. **Componentes de UI atómicos reutilizables** — no repetir estilos ni lógica
21. **Manejo de errores global** — interceptor de axios que redirige a login si 401, muestra toast si 4xx/5xx
22. **Responsive design** — mobile-first, Tailwind breakpoints
23. **Caching estratégico** — React Query con `staleTime` según el módulo (dashboard: 5min, miembros: 30s)
24. **Formularios con React Hook Form + Zod** — validación client-side consistente con backend

### DevOps y Entrega

25. **Variables de entorno** para toda configuración sensible — `.env` ignorado por git
26. **Docker multi-stage** para producción — imagen final liviana (slim / nginx static)
27. **CI/CD desde el día 1** — GitHub Actions: lint + test + build en cada PR
28. **Base de datos: migraciones automáticas** al deployar (alembic upgrade head)
29. **Logs estructurados** — JSON logs para backend (structlog), captura de errores con Sentry desde el día 1

---

## 7. API Endpoints — Versión 1 (v1)

```
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

# Users (staff)
GET    /api/v1/users              # Listar staff (solo owner/admin)
POST   /api/v1/users/invite       # Invitar por email
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}

# Members
GET    /api/v1/members
GET    /api/v1/members/{id}
POST   /api/v1/members
PUT    /api/v1/members/{id}
DELETE /api/v1/members/{id}
GET    /api/v1/members/{id}/attendance
GET    /api/v1/members/{id}/payments
GET    /api/v1/members/{id}/memberships

# Membership Plans
GET    /api/v1/plans
POST   /api/v1/plans
PUT    /api/v1/plans/{id}
DELETE /api/v1/plans/{id}

# Member-Memberships (asignaciones)
GET    /api/v1/memberships                # Todas las asignaciones activas
POST   /api/v1/members/{id}/memberships   # Asignar plan a miembro
PUT    /api/v1/memberships/{id}/cancel    # Cancelar membresía
PUT    /api/v1/memberships/{id}/renew     # Renovar

# Attendance
POST   /api/v1/attendance/check-in
PUT    /api/v1/attendance/{id}/check-out
GET    /api/v1/attendance                 # Filtro por fecha / miembro
GET    /api/v1/attendance/today           # Resumen de hoy

# Payments
GET    /api/v1/payments
POST   /api/v1/payments                   # Registrar pago manual
PUT    /api/v1/payments/{id}/refund
GET    /api/v1/payments/{id}/invoice      # Descargar PDF

# Dashboard
GET    /api/v1/dashboard/summary          # Card stats (ingresos hoy, activos, etc.)
GET    /api/v1/dashboard/revenue          # {labels: [], data: []} por período
GET    /api/v1/dashboard/attendance       # Asistencias por día/semana/mes
GET    /api/v1/dashboard/expiring         # Próximos vencimientos

# Gym Settings
GET    /api/v1/gym/settings
PUT    /api/v1/gym/settings
```

---

## 8. Cómo Arrancar el Proyecto (Plan de Ejecución)

### Fase 0 — Setup del proyecto (Día 1-2)

```bash
# Crear estructura del repositorio
git init
# Crear backend/
python -m venv backend/venv
pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary pydantic python-jose passlib python-multipart
pip freeze > backend/requirements.txt

# Crear frontend/
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install react-router-dom @tanstack/react-query zustand axios tailwindcss

# docker-compose.yml con postgres + redis
```

### Fase 1 — MVP Funcional (Semanas 1-3)

| Módulo | Prioridad | Tiempo est. |
|--------|-----------|-------------|
| Auth + Users + Multi-tenancy | **Crítico** | 3 días |
| Gym Settings | **Crítico** | 1 día |
| Members CRUD | **Crítico** | 2 días |
| Membership Plans + Assign | **Crítico** | 2 días |
| Attendance (check-in) | **Crítico** | 2 días |
| Payments (manual) | **Crítico** | 2 días |
| Dashboard básico | **Alta** | 2 días |
| Deploy inicial (VPS / Railway) | **Alta** | 1 día |
| **Total MVP** | | **~15 días** |

### Fase 2 — Vender (Semana 4)

- Landing page simple (`/landing` en frontend o repo separado)
- Onboarding: registro de dueño → crear gym → invitar staff
- Stripe/MercadoPago para cobro del SaaS (no confundir con pagos del gym)
- Subida a producción real con dominio

### Fase 3 — Post-Venta (Semanas 5+)

- Check-out con fingerprint
- Reportes exportables (PDF/CSV)
- Notificaciones (recordatorio de pago, cumpleaños)
- App mobile básica (PWA)
- Módulo de clases/entrenamiento grupal

---

## 9. Stack Tecnológico Resumido

| Capa | Tecnología |
|------|-----------|
| Backend Framework | FastAPI |
| ORM | SQLAlchemy 2.0 |
| Migraciones | Alembic |
| Validación | Pydantic v2 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| DB | PostgreSQL 15 |
| Cache | Redis (tasas de cambio, sesiones) |
| Frontend | React 18 + Vite + TypeScript |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| UI State | Zustand |
| CSS | Tailwind CSS 3 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP Client | Axios |
| Containerización | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Monitoreo | Sentry |
| Deploy | Railway / VPS (DigitalOcean) |

---

## 10. Principios Rectores (No Negociables)

1. **MVP primero, features después.** No agregues nada que no sea indispensable para abrir y vender.
2. **El código se lee 10x más de lo que se escribe.** Prioriza legibilidad sobre ingeniosidad.
3. **Un solo source of truth.** No duplicar lógica entre backend y frontend (validaciones core solo en backend).
4. **Fallar rápido.** Si algo puede fallar, que falle con un mensaje claro, no silenciosamente.
5. **El cliente no paga por tu arquitectura, paga por su negocio funcionando.** No sobre-diseñes.
6. **Pruebas no son opcionales.** Sin tests no hay deploy.
7. **Deuda técnica negociable.** Si elegiste entre perfecto y funcional, elige funcional. Pero documenta la deuda.

---

## 11. Registro — Fix Login + Baja de Auto-Registro

**Bug encontrado (no era solo el `relative` faltante):** `index.css` define spacing custom con keys `xs/sm/md/lg/xl` (usadas en `px-md`, `gap-lg`, etc). Tailwind v4 resuelve `max-w-{name}` contra `--spacing-{name}` cuando el nombre coincide, así que `max-w-md` compilaba a `max-width: var(--spacing-md)` = 16px en vez de 448px — confirmado viendo la regla CSS generada en runtime. El intento de fix que ya estaba en el archivo (`--max-w-md`, etc.) usaba el nombre de variable equivocado: la key real de Tailwind v4 para esta escala es `--container-*`, no `--max-w-*`.

**Fix aplicado:**
- Renombrado `--max-w-xs/sm/md/lg/xl/2xl/3xl` → `--container-xs/sm/md/lg/xl/2xl/3xl` en `index.css`. Esto arregla `max-w-2xl`/`max-w-3xl`+ en toda la app (no colisionan con el spacing scale custom).
- `sm`/`md`/`lg` siguen colisionando (esos nombres SÍ están tomados por el spacing scale custom) — **deuda técnica conocida, fuera de scope**. Renombrar el spacing scale para eliminar la colisión de raíz tocaría cientos de usos (`px-md`, `gap-lg`, `py-xl`...) en toda la app.
- Workaround puntual en login/forgot-password: `max-w-[28rem]`/`max-w-[24rem]` (valores arbitrarios) en vez de `max-w-md`/`max-w-sm`, para esquivar la colisión sin tocar el token global.
- Agregado `relative` al wrapper del card (el bug que se había reportado originalmente — real, pero secundario al de arriba).

**Cambio de producto:** GymPro no tiene auto-registro (decisión ya registrada en la sección 11 de la rama `fix/disable-public-register` — no se duplica acá). En el frontend: `RegisterPage.tsx` borrado, ruta `/register` sacada del router, link "Registrate" sacado del login. Se agregó `ForgotPasswordPage.tsx` (placeholder estático, sin flujo de reset real todavía) en `/forgot-password`.
