# Módulo 4: Asistencias (Check-in/Check-out)

**Fecha:** 2026-07-28

## Cambios realizados

### Repository
- `backend/app/repositories/attendance_repository.py` — Nuevo: get_by_id, get_today_checkin, list_by_gym (filtro por fecha/miembro), get_today_summary, create, update

### Service
- `backend/app/services/attendance_service.py` — Nuevo: check_in (valida membresía activa, evita doble check-in, descuenta visitas), check_out, list_attendance, get_today

### Endpoints
- `backend/app/api/v1/endpoints/attendance.py` — Nuevo: POST check-in, PUT check-out, GET list (filtro fecha/miembro), GET today
- `backend/app/main.py` — Registrado router de attendance

### Tests
- `backend/tests/test_api/test_attendance.py` — Tests de integración (401 sin auth)
- `backend/tests/test_services/test_attendance_service.py` — Tests unitarios: check-in, doble check-in, check-out inexistente, ciclo completo, list vacío, today summary

## Endpoints disponibles
```
POST  /api/v1/attendance/check-in?member_id=     # owner, admin, trainer, receptionist
PUT   /api/v1/attendance/{id}/check-out           # owner, admin, trainer, receptionist
GET   /api/v1/attendance?log_date=&member_id=     # owner, admin, trainer, receptionist
GET   /api/v1/attendance/today                    # owner, admin, trainer, receptionist
```
