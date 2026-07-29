# Módulo 6: Dashboard & Reportes

**Fecha:** 2026-07-28

## Cambios realizados

### Service
- `backend/app/services/dashboard_service.py` — Nuevo: get_summary (6 métricas clave), get_revenue_chart (historial diario), get_attendance_chart (asistencias por día), get_expiring (membresías por vencer en 3 días)

### Endpoints
- `backend/app/api/v1/endpoints/dashboard.py` — Nuevo: GET summary, GET revenue, GET attendance, GET expiring
- `backend/app/main.py` — Registrado router de dashboard

### Tests
- `backend/tests/test_api/test_dashboard.py` — Tests de integración (401 sin auth)
- `backend/tests/test_services/test_dashboard_service.py` — Tests unitarios: summary vacío, summary con datos, revenue chart, attendance chart, expiring vacío

## Endpoints disponibles
```
GET  /api/v1/dashboard/summary          # owner, admin
GET  /api/v1/dashboard/revenue?days=30  # owner, admin
GET  /api/v1/dashboard/attendance?days=7 # owner, admin
GET  /api/v1/dashboard/expiring         # owner, admin
```
