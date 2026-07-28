# Módulo 5: Pagos

**Fecha:** 2026-07-28

## Cambios realizados

### Repository
- `backend/app/repositories/payment_repository.py` — Nuevo: PaymentRepository (CRUD + revenue_today/revenue_month) e InvoiceRepository (create)

### Service
- `backend/app/services/payment_service.py` — Nuevo: register (crea pago + invoice automática), refund (solo si está "paid"), list_by_gym, get_invoice

### Endpoints
- `backend/app/api/v1/endpoints/payments.py` — Nuevo: GET list, POST register, PUT refund, GET invoice
- `backend/app/main.py` — Registrado router de payments

### Tests
- `backend/tests/test_api/test_payments.py` — Tests de integración (401 sin auth)
- `backend/tests/test_services/test_payment_service.py` — Tests unitarios: register, refund, doble refund, list

## Endpoints disponibles
```
GET   /api/v1/payments                      # owner, admin, receptionist
POST  /api/v1/payments                      # owner, admin, receptionist
PUT   /api/v1/payments/{id}/refund          # owner, admin
GET   /api/v1/payments/{id}/invoice         # owner, admin, receptionist
```
