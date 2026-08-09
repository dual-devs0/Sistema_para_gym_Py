# Backend GymPro — Explicado como diagramas de flujo

> Documento personal (no subir a GitHub). Explica el backend completo:
> cómo fluye una petición, cómo funciona la seguridad, y qué hace cada módulo.

---

## 0. El mapa mental en 30 segundos

```
Petición HTTP
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. MIDDLEWARE      CORS + RequestContext (IDs, timing)      │
├─────────────────────────────────────────────────────────────┤
│ 2. ROUTER          /api/v1/<modulo>  →  ENDPOINT            │
│    └─ DEPS         auth (JWT) → permisos (rol) → gym_id     │
├─────────────────────────────────────────────────────────────┤
│ 3. ENDPOINT        valida el body (Pydantic), delega todo   │
├─────────────────────────────────────────────────────────────┤
│ 4. SERVICE         la lógica de negocio vive aquí           │
├─────────────────────────────────────────────────────────────┤
│ 5. REPOSITORY      solo SQL (select/insert/update)          │
├─────────────────────────────────────────────────────────────┤
│ 6. DATABASE        PostgreSQL (async)                       │
│    + REDIS         refresh tokens, blacklist, counters      │
└─────────────────────────────────────────────────────────────┘
```

**Regla de oro**: el endpoint NO hace lógica. Solo llama al service. El service NO escribe SQL directo (usa repos). El repo NO decide reglas de negocio. Cada capa tiene UN solo trabajo.

---

## 1. Ciclo de vida completo de una petición (ej. `GET /api/v1/members`)

```
Cliente (frontend con Bearer token)
   │
   ▼
HTTP request
   │
   ▼
[CORS middleware]  ¿el origen está en CORS_ORIGINS? si no → 403
   │
   ▼
[RequestContextMiddleware]  captura X-Request-ID / X-Correlation-ID
   │                         mide latencia → header X-Response-Time-Ms
   │
   ▼
[FastAPI route]  aplica DEPENDENCIAS en orden:

   1) Header: "Authorization: Bearer <jwt>"
   2) get_current_user()  ←──────────┐ (autenticación)
      ├─ decode_token(jwt)           │  HS256 + aud="gympro-api"
      ├─ ¿type == "access"? no → 401 │
      ├─ ¿jti en blacklist de Redis?│  si → 401 (token revocado)
      └─ carga User de la DB         │  si no existe/inactivo → 401
      └─ devuelve user_obj  ─────────┘ (ahora tenemos "quién eres")
               │
               ▼
   3) require_permission("members.read")   ←── (autorización)
      ├─ mira user.role (owner/admin/trainer/receptionist)
      ├─ busca en ROLE_PERMISSIONS[rol]  (conjunto de permisos)
      └─ ¿"members.read" está? no → 403  si → sigue
               │
               ▼
   4) get_current_gym_id()   ←── (aislamiento multi-tenant)
      └─ lee gym_id del JWT / del usuario  (nunca del body!)
               │
               ▼
[ENDPOINT handler]  list_members()
      │
      ▼
[MemberService.list_by_gym(gym_id)]      ← lógica
      │
      ▼
[MemberRepository.list_by_gym(gym_id)]   ← SQL
      └─ SELECT * FROM member
         WHERE gym_id = :gym_id
           AND deleted_at IS NULL
         ORDER BY created_at DESC
      │
      ▼
[get_db dependency]  commit automático al terminar
      │              (rollback si algo lanzó excepción)
      ▼
JSON response  ← Pydantic valida el shape (MemberResponse)
```

**Punto clave de seguridad**: `gym_id` viene del token/usuario, NUNCA de la URL ni del body. Si un socio del Gym A intenta `GET /members/{id_del_gym_B}`, el repo filtra por `gym_id = A` → no encuentra nada → 404. El aislamiento está garantizado a nivel de query, no por "esconder botones".

---

## 2. Autenticación — Login y tokens

### 2.1 Login (`POST /auth/login`)

```
email + password
      │
      ▼
[AuthService.login]
      ├─ buscar User por email
      ├─ ¿existe? ¿is_active? no → 401 "Invalid email or password"
      ├─ verify_password(bcrypt)  no → 401
      │
      ├─ access_token:  JWT {sub: user_id, jti, aud, type: "access", gym_id}
      │                  expira en 15 min          (stateless, firmado)
      │
      ├─ refresh_token: JWT {type: "refresh", jti}
      │                  expira en 7 días
      │
      └─ GUARDAR EN REDIS:  SETEX "refresh:<jti>" = user_id  (TTL 7 días)
      │
      ▼
  {access_token, refresh_token}  →  frontend los guarda en localStorage
```

**Por qué el refresh vive en Redis y no "solo" en el JWT**: así el backend puede revocarlo y detectar reuso (mira 2.2).

### 2.2 Refresh (`POST /auth/refresh`) — la rotación con anti-reuso

```
refresh_token (viejo)      ← el frontend lo manda cuando el access expiró
      │
      ▼
[AuthService.refresh]
      ├─ decode jti + type=="refresh"  no → 401
      │
      ├─ REDIS: GETDEL "refresh:<jti>"
      │         ├─ existe  → OK  (lo ELIMINA del Redis = un solo uso)
      │         └─ NO existe → el token ya se usó o se canceló
      │                        → guardar "token:blacklist:<jti>" (reuso!)
      │                        → 401 "revoked or reused"
      │
      ▼
  genera NUEVO par (access + refresh)
  guarda nuevo refresh en Redis   ← rotación
      │
      ▼
  devuelve AMBOS tokens  →  el frontend DEBE perseguir el refresh nuevo
```

Si un atacante roba el refresh y lo usa antes que el dueño: el dueño reenvía el viejo → `getdel` falla → blacklist → 401 → el atacante también queda fuera. El sistema revoca sesiones comprometidas.

### 2.3 Logout y blacklist del access

```
access_token + logout
      │
      ▼
[AuthService.logout]
      └─ Redis: SETEX "token:blacklist:<jti>" = "revoked"  (TTL 15 min)
              │
              ▼
  los próximos get_current_user() consultan ese jti → 401
```

El access token es stateless (firmado), por eso la revocación se implementa con una blacklist corta (15 min = su vida útil). El refresh se elimina de Redis (irrevocable).

### 2.4 Registro (`POST /auth/register`)

```
Solo lo puede llamar PLATFORM STAFF (require_platform_staff, is_platform_staff=True)
      │
      ▼
  crea Gym ({nombre}'s Gym) + User con rol "owner"
  → el gimnasio nace con su dueño
```

**No hay auto-registro público** (decisión de producto): los dueños son provisionados por el equipo de la plataforma.

### 2.5 Password reset

```
forgot-password (email)                     reset-password (token + pwd)
      │                                          │
      ▼                                          ▼
  ¿usuario existe?                       decode type=="password_reset"
  si no → 204 silencioso (no revelar)    Redis GETDEL "password_reset:<jti>"
      │                                    └─ hay que usarlo en 15 min
  crea token JWT type=password_reset     hash_password(nuevo)
  Redis SETEX exp 15 min                  update user + password_changed_at
```

**Detalle**: `password_changed_at` se actualiza. (Ojo: aún no se fuerza re-login con él, pero queda registrado.)

---

## 3. Autorización — la matriz de roles

```
ROLE_PERMISSIONS (diccionario en core/permissions.py)
      │
      ├─ "owner"        → TODO (members, payments+refund, plans, memberships,
      │                    attendance, users+delete, gym settings, dashboard,
      │                    audit view)
      │
      ├─ "admin"        → casi todo menos USER_DELETE, sin AUDIT_VIEW... 
      │                    (en realidad: todo lo de owner excepto user delete)
      │
      ├─ "trainer"      → members read/create/update, plans read,
      │                    memberships read, attendance, users read
      │                    (NO pagos, NO planes edit, NO config, NO dashboard)
      │
      ├─ "receptionist" → members CRUD(no delete), payments create/read,
      │                    plans read, memberships read/assign/renew,
      │                    attendance, users read
      │                    (NO refunds, NO plans edit, NO gym settings)
      │
      └─ "platform"     → manage gyms, users CRUD (staff global, sin gym)
```

**Cómo fluye un 403**:

```
endpoint protegido con require_permission(Perm.PAYMENT_REFUND)
      │
      ▼
user.role="receptionist"
      │
      ▼
¿"payments.refund" ∈ ROLE_PERMISSIONS["receptionist"]?  → NO
      │
      ▼
ForbiddenException → 403 {"detail": "Missing permission: payments.refund"}
```

El frontend solo oculta el botón; el backend SIEMPRE valida. Un request directo a `DELETE /payments/{id}/refund` como receptionist recibe 403.

---

## 4. Módulos — flujos por módulo

### 4.1 Miembros (members)

```
POST /members                           DELETE /members/{id}
      │                                       │
      ▼                                       ▼
MemberService.create                     member.deleted_at = now  (SOFT DELETE)
      │                                       │
      ▼                                       ▼
Member(gym_id del token, datos)         ya no aparece en listas/queries
      ▼                                       (pero sus pagos/asistencias
status = "active"                              siguen existiendo en tabs)
```

- `GET /members?status=` → siempre `deleted_at IS NULL` + `gym_id`.
- Listados con search (nombre) si el query lo soporta.

### 4.2 Planes (plans) → catálogo de productos

```
POST /plans:  name, price, duration_days, max_visits?, type
   │
   ▼
MembershipPlan (por gym)          DELETE /plans/{id} → is_active = False
   │                                     (nunca borrar: membresías pasadas
   ▼                                      referencian el plan)
cada MemberMembership apunta a un plan por plan_id
```

### 4.3 Membresías (membermemberships) — la asignación

```
POST /members/{id}/memberships  (asignar plan a miembro)
      │
      ▼
[MemberMembershipService.assign]
      ├─ end_date = start_date + plan.duration_days
      ├─ remaining_visits = plan.max_visits  (si el plan lo define)
      ├─ price_paid = plan.price  (o precio custom si se pasa)
      └─ status = "active"
      │
      ▼
PUT /memberships/{id}/renew
      │
      ▼
   crea NUEVA asignación que continúa tras la actual
   (renewed_from_id = id anterior)  → historial encadenado
      │
      ▼
PUT /memberships/{id}/cancel  →  status = "cancelled"
```

**Reglas de negocio que viven en el service**:
- No se puede asignar una membresía activa al mismo miembro (traba por estado).
- Al check-in, `remaining_visits` se descuenta si el plan es por visitas.

### 4.4 Asistencia (attendance) — el flujo más interesante

```
POST /attendance/check-in?member_id=xxx
      │
      ▼
[AttendanceService.check_in]
      ├─ ¿el miembro existe y pertenece a este gym? no → 404
      │
      ├─ repo.get_today_checkin(member_id)  ← GUARD ANTI-DUPLICADO
      │     └─ ¿ya tiene un log de HOY sin check_out?  si → 409
      │
      ├─ ¿membresía activa?  →  member_membership_id = id (si existe)
      │
      ├─ crear AttendanceLog (check_in = now UTC)
      │
      └─ si la membresía es por visitas (remaining_visits != null y > 0)
            → UPDATE ... SET remaining_visits = remaining_visits - 1
      │
      ▼
  AttendanceResponse {id, member_id, member_name, check_in, check_out}
  (member_name se arma con el join — antes este fix no existía)
```

```
PUT /attendance/{log_id}/check-out
      │
      ▼
  ¿el log tiene check_out ya? si → 409
  check_out = now UTC
```

```
GET /attendance/today
      │
      ▼
  [AttendanceService.get_today]
      ├─ gym_timezone = Gym.timezone (ej. "America/Asuncion")
      └─ repo.get_today_summary(gym_id, tz)
            ├─ day_start_local(tz)  ← medianoche EN LA TZ DEL GYM, no UTC
            ├─ contar logs con check_in >= day_start
            └─ active_now = los que tienen check_out IS NULL
```

**Este fue el bug 0.5**: antes "hoy" era UTC → los contadores no cuadraban con la tabla (porque la tabla lista todo y el conteo usaba otro día).

### 4.5 Pagos (payments)

```
POST /payments   (registro manual del cobro)
      │
      ▼
[PaymentService.create]
      ├─ member existe? no → 404
      ├─ amount, payment_method (efectivo/tarjeta/transferencia/qr)
      ├─ status = "paid", paid_at = now
      └─ si ¡two related? → genera FACTURA:
            invoice_number = secuencia por gym
            Invoice(payment_id, number)   → GET /payments/{id}/invoice
      │
      ▼
POST /payments/{id}/refund
      │
      ▼
  solo con permiso PAYMENT_REFUND (owner/admin, NO receptionist)
  status = "refunded"
```

**Decisión de diseño**: los pagos son INTERNOS (el recepcionista cobra y registra). No hay pasarela externa — pero el modelo permite conectar Stripe/Mercado Pago después sin romper endpoints.

### 4.6 Dashboard

```
GET /dashboard/summary
      │
      ▼
[DashboardService.get_summary]  (4 queries en paralelo conceptualmente)
      ├─ revenue_today  = sum(payments paid hoy, tz del gym)
      ├─ revenue_month  = sum(payments paid este mes)
      ├─ active_members = count(members where status=active)
      ├─ new_members    = count(created_at este mes)
      ├─ checkins_today = count(attendance hoy, tz del gym)
      └─ expiring_soon  = count(membermemberships active,
                                end_date entre hoy y hoy+3)

GET /dashboard/revenue?days=30  → labels [d1..d30] + data [montos]
GET /dashboard/attendance?days=7 → labels + counts
GET /dashboard/expiring         → lista con member_name y plan_name
```

Todos los counts usan la timezone del gym (fix aplicado), así los KPIs cuadran con los módulos.

---

## 5. Base de datos — diagrama ER

```
gyms ─┬─ 1:N users          (rol: owner/admin/trainer/receptionist/platform)
      ├─ 1:N members        (soft-delete)
      ├─ 1:N membership_plans
      ├─ 1:N payments
      └─ (timezone, currency, business_hours JSON)

users ── 1:N audit_logs

members ── 1:N member_memberships ── N:1 membership_plans
  │              │
  │              └─ auto_renew, renewed_from_id (self-FK, historial)
  │
  ├── 1:N attendance_logs   (check_in, check_out, member_membership_id)
  │
  └── 1:N payments ── 1:1 invoices   (invoice_number único por gym)
```

Todo PK = UUID v4 (no enumerable, no secuencial). Timestamps en UTC. Soft-delete en user/member (`deleted_at`).

---

## 6. Redis — qué se guarda

| Clave | Contenido | TTL | Propósito |
|-------|-----------|-----|-----------|
| `refresh:<jti>` | user_id | 7 días | valida + rota refresh tokens |
| `token:blacklist:<jti>` | "revoked"/"reused" | 15 min (access) / 24h (reused) | revocación |
| `password_reset:<jti>` | user_id | 15 min | reset de password one-time |
| `ratelimit:<name>:<ventana>` | contador | 60s | rate limiting (¡existe pero NO está conectado todavía! ver 7) |
| `task:queue:*` / `task:result:*` | JSON | - | TaskQueue (infra reservada, sin consumidores) |

---

## 7. Deuda técnica conocida / huecos

1. **Rate limiter** (`core/rate_limiter.py`) está escrito pero **ningún endpoint lo usa**. El login puede forzarse por brute force. → Conectarlo en auth (login, forgot-password).
2. **TaskQueue** (`core/tasks.py`) no tiene consumidores ni tareas encoladas. Pensado para notificaciones/reportes futuros.
3. **`gym_id` en el JWT**: ahora sí se incluye (fix), pero `get_current_gym_id` lo saca del usuario en DB, no del token. El del token queda solo informativo.
4. **`password_changed_at`** se registra pero no invalida tokens después de cambio de password.
5. **Migraciones**: el repo tiene 001 (schema) y 002 (platform staff); el plan menciona rev. 004 — revisar si hay migraciones sin importar.
6. **Ramas `main` y `master` divergen** — consolidar antes de producción.

---

## 8. Capa de infraestructura (core/)

| Archivo | Responsabilidad |
|---------|-----------------|
| `config.py` | Env vars validados (SECRET_KEY ≥32 chars, ENVIRONMENT whitelist, pool de DB) |
| `database.py` | Engine async + `get_db` (commit/rollback automático) |
| `security.py` | hash bcrypt, JWT (HS256, jti, aud, 3 tipos de token) |
| `exceptions.py` | AppException + subclases → handlers globales a JSON limpio |
| `permissions.py` | Perm (constantes) + ROLE_PERMISSIONS (matriz) |
| `middleware.py` | Request ID / Correlation ID / tiempo de respuesta |
| `logging.py` | structlog estructurado con contextvars |
| `redis.py` | init lazy del cliente async + get_redis |
| `rate_limiter.py` | (sin conectar) ventanas de boom por IP |
| `tasks.py` | (sin usar) cola de tareas sobre Redis |

---

## 9. El flujo de un 401/403/409/404

```
Algo falla en el service (NotFoundException, AppException, ...)
      │
      ▼
  la excepción sube por todas las capas SIN try/catch intermedios
      │
      ▼
  get_db ve la excepción → ROLLBACK de la sesión  (nada a medias)
      │
      ▼
  exception handler global de FastAPI
      │
      ▼
  {"detail": "mensaje claro"}  +  status correcto
```

Nunca un 500 genérico: cada error de negocio tiene su excepción tipada.