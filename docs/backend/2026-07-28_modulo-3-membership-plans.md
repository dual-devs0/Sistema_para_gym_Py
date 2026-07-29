# Módulo 3: Membership Plans + Assign

**Fecha:** 2026-07-28

## Cambios realizados

### Repository
- `backend/app/repositories/membership_repository.py` — Nuevo: MembershipPlanRepository (CRUD + soft-delete) y MemberMembershipRepository (list, assign, cancel, renew)

### Service
- `backend/app/services/membership_service.py` — Nuevo: MembershipPlanService (CRUD con validación de gym_id) y MemberMembershipService (assign, cancel, renew con cálculo automático de fechas)

### Endpoints
- `backend/app/api/v1/endpoints/plans.py` — Nuevo: CRUD completo de planes (GET list, GET by id, POST create, PUT update, DELETE soft-delete)
- `backend/app/api/v1/endpoints/memberships.py` — Nuevo: asignación de planes a miembros, cancelación, renovación, listado por gym y por miembro
- `backend/app/main.py` — Registrados routers de plans y memberships

### Tests
- `backend/tests/test_api/test_memberships.py` — Tests de integración (401 sin auth)
- `backend/tests/test_services/test_membership_service.py` — Tests unitarios: create, get, list, update, soft-delete, assign, cancel, renew

## Endpoints disponibles
```
GET    /api/v1/plans                           # owner, admin, trainer, receptionist
GET    /api/v1/plans/{id}                       # owner, admin, trainer, receptionist
POST   /api/v1/plans                           # owner, admin
PUT    /api/v1/plans/{id}                       # owner, admin
DELETE /api/v1/plans/{id}                       # owner, admin
GET    /api/v1/memberships?status=              # owner, admin, trainer, receptionist
GET    /api/v1/memberships/member/{member_id}   # owner, admin, trainer, receptionist
POST   /api/v1/memberships/assign/{member_id}   # owner, admin, receptionist
PUT    /api/v1/memberships/{id}/cancel          # owner, admin
PUT    /api/v1/memberships/{id}/renew           # owner, admin, receptionist
```
