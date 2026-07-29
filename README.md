# GymPro SaaS

SaaS para gestión de gimnasios pequeños y medianos.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI (Python 3.12) |
| Frontend | React 18 + Vite + TypeScript |
| Base de datos | PostgreSQL 15 |
| Cache | Redis |
| ORM | SQLAlchemy 2.0 asyncio |
| Validación | Pydantic v2 |

## Arquitectura

```
HTTP → FastAPI Router → Service Layer → Repository Layer → PostgreSQL
```

- **Endpoints**: validan auth/roles, delegan a services
- **Services**: lógica de negocio, orquestan repos
- **Repositories**: solo queries SQLAlchemy, sin lógica
- **Models**: SQLAlchemy ORM (soft-delete, UUID PKs, timestamps)

## Módulos

### 1. Auth & Usuarios

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/v1/auth/register` | Registrar owner (crea gym automático) |
| `POST /api/v1/auth/login` | Login → access + refresh token |
| `POST /api/v1/auth/refresh` | Refrescar access token |
| `POST /api/v1/auth/logout` | Cerrar sesión |
| `POST /api/v1/auth/forgot-password` | Solicitar reset de password |
| `POST /api/v1/auth/reset-password` | Cambiar password con token |
| `GET /api/v1/users` | Listar usuarios del gym |
| `POST /api/v1/users` | Crear usuario (admin/trainer/receptionist) |
| `GET /api/v1/users/{id}` | Obtener usuario |
| `PUT /api/v1/users/{id}` | Actualizar usuario |
| `DELETE /api/v1/users/{id}` | Eliminar usuario (soft-delete) |

### 2. Gym (Configuración)

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/v1/gym/settings` | Obtener configuración del gym |
| `PUT /api/v1/gym/settings` | Actualizar configuración |

### 3. Planes y Membresías

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/v1/plans` | Listar planes de membresía |
| `POST /api/v1/plans` | Crear plan |
| `GET /api/v1/plans/{id}` | Obtener plan |
| `PUT /api/v1/plans/{id}` | Actualizar plan |
| `DELETE /api/v1/plans/{id}` | Desactivar plan |
| `GET /api/v1/memberships` | Listar membresías activas |
| `GET /api/v1/members/{id}/memberships` | Membresías de un miembro |
| `POST /api/v1/members/{id}/memberships` | Asignar plan a miembro |
| `PUT /api/v1/memberships/{id}/cancel` | Cancelar membresía |
| `PUT /api/v1/memberships/{id}/renew` | Renovar membresía |

### 4. Attendance (Asistencia)

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/v1/attendance/check-in` | Registrar entrada (evita duplicado diario) |
| `POST /api/v1/attendance/{id}/check-out` | Registrar salida |
| `GET /api/v1/attendance` | Listar asistencias (filtro por fecha) |
| `GET /api/v1/attendance/today` | Resumen del día (check-ins, activos) |
| `GET /api/v1/members/{id}/attendance` | Asistencias de un miembro |

### 5. Payments (Pagos internos)

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/v1/payments` | Listar pagos del gym |
| `POST /api/v1/payments` | Registrar pago (efectivo, transferencia, etc.) |
| `GET /api/v1/payments/{id}` | Detalle del pago |
| `POST /api/v1/payments/{id}/refund` | Reembolsar pago |
| `GET /api/v1/payments/{id}/invoice` | Obtener factura generada |
| `GET /api/v1/members/{id}/payments` | Pagos de un miembro |

> Los pagos son **internos** — el receptionist/owner registra el cobro manual. No hay integración con pasarelas externas. El diseño permite agregar webhooks de Stripe/Mercado Pago sin cambiar endpoints.

### 6. Dashboard

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/v1/dashboard/summary` | KPIs: ingresos, miembros activos, checkins, expiración |
| `GET /api/v1/dashboard/revenue` | Gráfico de ingresos (últimos N días) |
| `GET /api/v1/dashboard/attendance` | Gráfico de asistencias (últimos N días) |
| `GET /api/v1/dashboard/expiring` | Membresías por vencer |

## Seguridad

- **JWT** con access token (15 min) + refresh token (7 días)
- **Roles**: owner, admin, trainer, receptionist — control por endpoint con `require_role()`
- **Gym isolation**: cada usuario/grupo de datos pertenece a un gym, los queries siempre filtran por `gym_id` del token
- **Soft-delete** en User y Member (`deleted_at`)
- **CORS** configurable por `CORS_ORIGINS` en `.env`
- **Passwords** hasheadas con bcrypt
- **UUID v4** como PKs (sin enumeración de IDs)

## Estructura del proyecto

```
backend/
├── app/
│   ├── api/v1/endpoints/  ← Routers y handlers HTTP
│   ├── core/              ← Config, seguridad, DB, excepciones
│   ├── models/            ← SQLAlchemy ORM (6 tablas)
│   ├── repositories/      ← Capa de acceso a datos
│   ├── schemas/           ← Pydantic v2 request/response
│   └── services/          ← Lógica de negocio
├── migrations/            ← Alembic (pendiente de ejecutar)
├── tests/
│   ├── test_api/          ← Tests de endpoints (10 archivos)
│   └── test_services/     ← Tests unitarios de servicios (7 archivos)
├── .env.example
├── requirements.txt
└── docker-compose.yml

frontend/                  ← React + Vite + TypeScript
```

## Desarrollo local

```bash
# Backend
docker compose up -d db
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # editar según entorno
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd backend
pytest -v                      # Todos los tests
pytest tests/test_api/ -v      # Solo API
pytest tests/test_services/ -v # Solo servicios
```

Requiere PostgreSQL corriendo con la base `gympro_test` (ver `conftest.py`).
