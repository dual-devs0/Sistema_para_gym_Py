# Módulo 2: Gym Settings

**Fecha:** 2026-07-28

## Cambios realizados

### Repository
- `backend/app/repositories/gym_repository.py` — Nuevo: get_by_id, update para Gym model

### Service
- `backend/app/services/gym_service.py` — Nuevo: get_settings, update_settings con validación de existencia

### Endpoints
- `backend/app/api/v1/endpoints/gym.py` — Nuevo: GET /api/v1/gym/settings (owner/admin), PUT /api/v1/gym/settings (solo owner)
- `backend/app/main.py` — Registrado el router de gym

### Tests
- `backend/tests/test_api/test_gym.py` — Tests de integración (401 sin auth)
- `backend/tests/test_services/test_gym_service.py` — Tests unitarios (not found, update fields)

## Endpoints disponibles
```
GET    /api/v1/gym/settings           # owner, admin
PUT    /api/v1/gym/settings           # solo owner
```
