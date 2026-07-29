# Módulo 1: Auth & Usuarios

**Fecha:** 2026-07-28 19:38

## Cambios realizados

### Repositories
- `backend/app/repositories/user_repository.py` — Nuevo: CRUD completo para User model (get_by_id, get_by_email, list_by_gym, create, update, soft_delete)

### Services
- `backend/app/services/auth_service.py` — Reescribir con lógica real: login, refresh, register_owner, forgot_password, reset_password
- `backend/app/services/user_service.py` — Nuevo: CRUD de usuarios con lógica de negocio (crear, invitar con temp_password, actualizar, eliminar soft-delete)

### Endpoints
- `backend/app/api/v1/endpoints/auth.py` — Refactorizado: login y refresh usan AuthService; se agregaron logout, forgot-password y reset-password
- `backend/app/api/v1/endpoints/users.py` — Nuevo: CRUD completo de usuarios (GET list, GET by id, POST create, POST invite, PUT update, DELETE soft-delete)
- `backend/app/main.py` — Registrado el router de users

### Schemas
- `backend/app/schemas/user.py` — Agregado InviteResponse con temporary_password

### Migración
- `backend/alembic/versions/001_initial_schema.py` — Migración inicial con todas las tablas del core (gym, user, member, membershipplan, membermembership, attendancelog, payment, invoice)

### Tests
- `backend/tests/test_api/test_auth.py` — Tests de integración para auth endpoints
- `backend/tests/test_api/test_users.py` — Tests de integración para users endpoints
- `backend/tests/test_services/test_auth_service.py` — Tests unitarios para AuthService
- `backend/tests/test_services/test_user_service.py` — Tests unitarios para UserService

## Endpoints disponibles

```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/users
GET    /api/v1/users/{id}
POST   /api/v1/users
POST   /api/v1/users/invite
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
```
