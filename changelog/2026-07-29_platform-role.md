# 2026-07-29 — Rol de plataforma + CI pipeline

## Cambios

### Modelo
- `User.gym_id` ahora es `nullable=True` (platform staff no pertenece a ningún gym)
- `User.is_platform_staff: bool` agregado (default `False`)
- Migración Alembic `002_platform_staff.py`

### Auth
- `POST /auth/register` reactivado con guard `require_platform_staff()`
- Nueva dependencia `require_platform_staff()` en `deps.py`

### Permisos
- `Perm.PLATFORM_MANAGE_GYMS` agregado
- Rol `"platform"` agregado en `ROLE_PERMISSIONS`

### CI
- `.github/workflows/ci.yml` creado (ruff + pytest con Postgres/Redis services)
- `ruff==0.6.4` agregado a `requirements.txt`
- `backend/pyproject.toml` creado con config de ruff + pytest

### Docs
- `ARQUITECTURA.md` §11 actualizado: marcado como CERRADO
- `README.md` tabla de endpoints actualizada

## Pendiente
- Correr `pytest` en CI (alguien con Python 3.11/3.12 + Docker)
