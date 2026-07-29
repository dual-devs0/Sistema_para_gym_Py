# Enterprise-Ready Hardening

**Fecha:** 2026-07-28

## Cambios realizados

### Seguridad
- Reemplazo de `python-jose` por `PyJWT` (CVE-2024-33664)
- JWT ahora incluye `jti`, `iat`, `aud` para trazabilidad y revocación
- Refresh token rotation: al usar un refresh token, el anterior se invalida en Redis
- Logout revoca el token en Redis blacklist por 15 minutos
- Password reset usa token dedicado almacenado en Redis (15 min TTL), no reutiliza access token
- `SECRET_KEY` ahora es obligatorio (mínimo 32 caracteres, validación en startup)
- CORS restringido: métodos y headers configurables, no más `*`
- Mass assignment eliminado con whitelists en `UserService`, `MemberService`, `GymService`
- Rate limiting con Redis: login 5/min, global 60/min
- Acceso token TTL reducido de 60min a 15min

### Bugs corregidos
- Race condition en check-in: actualización atómica de `remaining_visits`
- Race condition en generación de invoice numbers: `MAX()` en vez de `COUNT()+1`
- `price_paid=0` ahora se asigna correctamente (antes usaba precio del plan)
- Endpoint `POST /members/{id}/memberships` ahora valida con Pydantic (`AssignPlanRequest`), no con `body: dict`

### Permisos
- Nuevo sistema de 19 permisos granulares: `members.read`, `payments.create`, etc.
- Mapeados a los 4 roles existentes (owner/admin/trainer/receptionist)
- `require_permission()` usado en todos los endpoints
- `require_role()` se mantiene para compatibilidad

### Auditoría
- Nuevo modelo `AuditLog` (user_id, gym_id, action, table, record_id, changes, ip, user_agent)
- Nuevo `AuditService` para registrar acciones críticas
- Preparado para registrar login, logout, CRUD, pagos, membresías

### Infraestructura
- Logging estructurado con request_id, correlation_id, response time
- `RequestContextMiddleware` para inyectar IDs de trazabilidad
- `TaskQueue` para background jobs vía Redis (enqueue/dequeue/schedule)
- Rate limiter con Redis (check por ventana de tiempo)
- Redis client singleton con init/get/close

### Configuración
- Separación de settings por entorno (development/testing/production)
- Variables de entorno documentadas en `.env.example`
- Docker compose usa `${SECRET_KEY}` y `${DB_PASSWORD}` del entorno, no hardcodeados
- Pool de conexiones configurable (pool_size, max_overflow, pool_timeout)

### Base de datos
- `expire_on_commit=True` para consistencia de datos
- `pool_pre_ping=True` para detectar conexiones muertas
- `User.last_login` migrado de `String` a `DateTime(timezone=True)`
- Nuevo campo `User.password_changed_at`
- `Owner`, `admin`, `trainer`, `receptionist` ahora como `RoleEnum`

### Validaciones
- Pydantic v2: `min_length`, `max_length`, `gt`, `ge` en todos los schemas
- Passwords: mínimo 8 caracteres en schemas de auth y users
- Emails validados con `EmailStr` de `email-validator`
- `AssignPlanRequest.price_paid` con `ge=0`

### Tests
- Actualizados: auth, user, member, attendance, membership, gym services
- Actualizados: auth, members, memberships, payments, gym, attendance API tests
- Nuevo: `test_security.py` con tests de CORS, SQLi, XSS, tokens, roles
- Nuevo: test de mass assignment (role no escalable vía update)
- Nuevo: test de `price_paid=0` en asignación de planes

## Archivos modificados (52)
- 8 nuevos: logging, middleware, permissions, redis, rate_limiter, tasks, audit_log, audit_service
- 44 modificados: config, security, exceptions, database, main, deps, endpoints, schemas, models, services, repositories, tests, requirements, docker-compose, .env.example

## Commit
`065d738` - refactor: enterprise-ready hardening completo
