# Conversación: Tracking de último ingreso (last_login)

**Fecha:** 2026-07-29

---

## 1. Lo que se pidió

> _"Necesito agregar tracking de 'último ingreso' (last_login) al modelo de usuario."_

---

## 2. Estado inicial (antes del cambio)

| Componente | Estado |
|---|---|
| `User` model (`models/user.py`) | ✅ Ya tenía `last_login: Mapped[datetime\|None]` (del cherry-pick anterior) |
| Migración (`alembic/versions/002_platform_staff.py`) | ✅ Ya alteraba la columna de `String(50)` → `DateTime(timezone=True)` |
| `UserResponse` schema (`schemas/user.py`) | ✅ Ya tenía `last_login: str \| None = None` |
| `AuthService.login()` (`services/auth_service.py`) | ❌ **NUNCA actualizaba `last_login`** |
| `TokenResponse` (`schemas/auth.py`) | ❌ **No tenía campo `previous_login`** |

En resumen: el modelo y la BD soportaban `last_login`, pero nadie lo escribía ni lo devolvía en el login.

---

## 3. Decisión: opción (a) vs (b)

Se propusieron dos caminos:

- **(a) Simple** — Solo escribir `last_login = now()`, no devolver valor anterior.
- **(b) Más correcta** — Guardar el valor anterior antes de pisarlo y devolverlo como `previous_login` en la respuesta del login.

**Se eligió la opción (b).**

---

## 4. Cambios realizados

### `backend/app/services/auth_service.py`

- `login()` ahora:
  1. Lee `user.last_login` actual (puede ser `None` en primer login)
  2. Lo guarda como `previous_login` (formateado con `.isoformat()`)
  3. Setea `user.last_login = datetime.now(timezone.utc)`
  4. Hace `flush`/`update` vía el repositorio
  5. Devuelve `previous_login` como 4to elemento de la tupla

```python
previous_login = user.last_login.isoformat() if user.last_login else None
user.last_login = datetime.now(timezone.utc)
await self.repo.update(user)
```

**Firma nueva:**
```python
async def login(self, email: str, password: str) -> tuple[str, str, User, str | None]:
```

### `backend/app/schemas/auth.py`

- `TokenResponse` ahora incluye:

```python
previous_login: str | None = None
```

### `backend/app/api/v1/endpoints/auth.py`

- `/auth/login` desestructura el nuevo 4to valor (`previous_login`) y lo pasa al `TokenResponse`.
- `/auth/register` también se actualizó: cambió de `access_token, refresh_token, _ =` a `access_token, refresh_token, _, _ =` para evitar `ValueError` por unpack de 4 valores en 3 variables.

### `docs/backend/2026-07-29_feat-last-login.md`

- Documentación del cambio.

---

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `backend/app/services/auth_service.py` | `login()` ahora persiste `last_login` y devuelve `previous_login` |
| `backend/app/schemas/auth.py` | `TokenResponse` agrega campo `previous_login: str \| None` |
| `backend/app/api/v1/endpoints/auth.py` | Endpoints `login` y `register` adaptados al nuevo return type |

---

## 6. Cómo se comporta

**Request:**
```json
POST /api/v1/auth/login
{ "email": "owner@test.com", "password": "pass123" }
```

**Response (primer login — `last_login` era `null`):**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer",
  "previous_login": null
}
```

**Response (segundo login — ya hay un `last_login` previo):**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer",
  "previous_login": "2026-07-29T12:34:56+00:00"
}
```

El frontend puede mostrar: _"Bienvenido de nuevo, tu último ingreso fue el 2026-07-29 a las 12:34."_

---

## 7. Notas

- `last_login` en `UserResponse` (GET /users/me, etc.) ya se devolvía antes del cambio.
- No se requirió nueva migración Alembic (la migration `002` ya cambió el tipo de columna).
- Los tests existentes no se rompen — el único test que llama a `login()` espera excepción (invalid credentials), no revisa el return type.
- No hay tests específicos para el nuevo comportamiento — se pueden agregar después si se desea.
