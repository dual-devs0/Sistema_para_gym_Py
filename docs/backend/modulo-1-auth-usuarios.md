# Módulo 1 — Auth & Usuarios

**Commit:** `293a1f7`
**Fecha:** 2026-07-28 19:40:49 -0300
**Descripción:** Implementación completa del sistema de autenticación y gestión de usuarios.

## Backend

| Tipo | Archivos |
|------|----------|
| **Core** | `core/security.py` (JWT, hashing), `core/config.py` (settings), `core/database.py` (SQLAlchemy setup), `core/exceptions.py` |
| **Modelos** | `models/user.py`, `models/base.py` |
| **Schemas** | `schemas/auth.py` (login/register/token), `schemas/user.py` (CRUD) |
| **Endpoints** | `api/v1/endpoints/auth.py` (login/register/refresh), `api/v1/endpoints/users.py` (CRUD) |
| **Servicios** | `services/auth_service.py`, `services/user_service.py` |
| **Repositorios** | `repositories/user_repository.py` |
| **Tests** | `tests/test_api/test_auth.py`, `tests/test_api/test_users.py`, `tests/test_services/test_auth_service.py`, `tests/test_services/test_user_service.py`, `tests/test_security.py` |
| **Migración** | `alembic/versions/001_initial_schema.py` |
| **Infra** | `Dockerfile`, `Dockerfile.dev`, `requirements.txt`, `.env.example` |