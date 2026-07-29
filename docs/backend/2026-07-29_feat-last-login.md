# Tracking de último ingreso (last_login) en login

**Fecha:** 2026-07-29

## Cambios realizados

### Services
- `backend/app/services/auth_service.py` — `login()` ahora guarda el `last_login` anterior antes de sobreescribirlo con `datetime.now(timezone.utc)`, y lo devuelve como `previous_login` en la tupla resultado.

### Schemas
- `backend/app/schemas/auth.py` — `TokenResponse` ahora incluye `previous_login: str | None` para que el frontend pueda mostrar "tu último ingreso fue el [fecha]".

### Endpoints
- `backend/app/api/v1/endpoints/auth.py` — El endpoint `/auth/login` desestructura `previous_login` del service y lo pasa al `TokenResponse`.

## Detalle técnico (opción b)
- Se guarda el valor old de `last_login` antes de pisarlo
- Se devuelve como `previous_login` en la respuesta del login
- El frontend puede mostrar: "Bienvenido de nuevo, tu último ingreso fue el {previous_login}"
- `last_login` ya existía en el modelo (`DateTime(timezone=True)`, agregado en migration `002`), y en `UserResponse` como `str | None`
