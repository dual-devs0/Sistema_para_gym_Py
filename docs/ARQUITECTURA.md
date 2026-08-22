# Arquitectura de GymPro

> **Nota sobre documentación previa**: `docs/backend/`, `docs/frontend/` y
> `docs/auditoria/2026-07-28-auditoria.md` contienen notas de desarrollo de fases muy
> tempranas del proyecto (auth, gym-settings, membership-plans, attendance, payments,
> dashboard — anteriores al roadmap de las 6 fases documentado acá). Siguen existiendo
> como registro histórico, pero **este documento es la fuente de verdad actual sobre
> arquitectura**. No se copió ni resumió su contenido — si buscás el detalle de esas
> fases tempranas, están ahí.

## 1. Resumen ejecutivo

**GymPro** es un sistema de gestión para gimnasios, localizado para el mercado
paraguayo: moneda (PYG), integración fiscal (SIFEN/DNIT), notificaciones por WhatsApp,
y control de caja/cantina con las convenciones de un comercio paraguayo típico.

> **"GymPro" es un nombre de marca temporal/de muestra.** El sistema está diseñado como
> white-label: cada gimnasio (`gym_id`) tiene su propia razón social, RUC, y branding
> — "GymPro" nunca aparece como emisor fiscal de nada (ver [Fase 3](#33-fase-3--sifen-facturación-electrónica)).
> Los tokens de diseño (Fase 6) son igualmente genéricos y no están atados a este nombre.

**Stack backend**: Python 3.12, FastAPI 0.115, SQLAlchemy 2.0 (async, `asyncpg`),
PostgreSQL 15, Redis 7, Alembic (migraciones), Pydantic v2, JWT (`pyjwt` + `passlib`/
`bcrypt`), `httpx` para llamadas salientes, `signxml`/`lxml`/`cryptography` para firma
XML-DSig (SIFEN), `apscheduler` para tareas programadas, `structlog` + Sentry para
logging/observabilidad, `pytest`/`pytest-asyncio`/`ruff` para tests y lint.

**Stack frontend**: React 18 + TypeScript, Vite 7, Tailwind CSS v4 (tokens vía
`@theme` en `index.css`, sin `postcss.config.*` ni `tailwind.config.ts` activo —
ver [§2](#2-arquitectura-técnica)), TanStack Query v5 (con persistencia en
`localStorage`), React Router v6, Zustand, `react-hook-form` + `zod`, `axios`,
`recharts`, `motion` (Framer Motion), ESLint (`react-hooks/rules-of-hooks` +
`exhaustive-deps`, configurado en la limpieza de código de este roadmap).

**Infraestructura local**: Docker Compose (`postgres`, `redis`, `backend`, `frontend`),
con un modo standalone documentado en `docs/setup.md` para correr sin Docker.

## 2. Arquitectura técnica

### Capas (backend)

```
API (FastAPI routers, app/api/v1/endpoints/)
  → Service (lógica de negocio, app/services/)
    → Repository (acceso a datos, app/repositories/)
      → DB (SQLAlchemy models, app/models/, PostgreSQL)
```

- Los **endpoints** validan entrada/salida con schemas Pydantic (`app/schemas/`),
  resuelven permisos vía `require_permission(...)` (`app/core/permissions.py`), y
  delegan toda la lógica al service correspondiente — no contienen lógica de negocio.
- Los **services** orquestan repositorios, aplican reglas de negocio (límites de
  deuda, stock, turnos de caja, etc.) y lanzan excepciones tipadas (`AppException` y
  subclases en `app/core/exceptions.py`) que un handler central traduce a JSON
  consistente (`{"detail": "..."}`) con el status code correcto.
- Los **repositories** son la única capa que arma queries SQLAlchemy — encapsulan
  patrones como "get-by-id filtrado por `gym_id`" o updates atómicos guardados
  (ver stock de cantina y saldo, más abajo).
- El **frontend** replica el mismo espíritu sin una capa de servicios/hooks dedicada
  por feature: cada página (`src/pages/`) trae sus propios `fetchX`/`useQuery`/
  `useMutation` inline. Esto es deuda técnica documentada, no un patrón elegido — ver
  [§4](#4-deuda-técnica).

### Multi-tenancy

Todo el dominio de negocio cuelga de `gym_id` (tabla `Gym`) como límite de aislamiento
entre inquilinos. Casi todas las tablas (`Member`, `Payment`, `Product`,
`CashRegisterShift`, `SifenDocument`, etc.) tienen `gym_id` como FK indexada, y todo
acceso vía repositorio filtra explícitamente por `gym_id` — no hay un esquema de DB
separado por tenant, es aislamiento a nivel de fila (row-level, aplicado en código de
aplicación, no en RLS de Postgres).

### Roles

El modelo define 5 roles (`app/core/permissions.py`):

| Rol | Estado |
|---|---|
| `owner` | **Foco de producto actual.** Acceso total, incluida configuración fiscal y ajuste manual de saldo. |
| `admin` | **Foco de producto actual.** Mismos permisos operativos que `owner` salvo lo estrictamente administrativo de cuenta. |
| `receptionist` | **Foco de producto actual.** Check-in/check-out, pagos, caja, cantina — el uso diario del sistema. |
| `trainer` | Existe en el modelo de permisos, sin UI ni flujo dedicado hoy. No es prioridad de producto. |
| `platform` | Rol de superadmin multi-gym (gestión de gimnasios a nivel plataforma). Existe en el modelo, sin UI ni flujo dedicado hoy. No es prioridad de producto. |

## 3. Las 6 fases implementadas

### 3.1 Fase 1 — PYG (moneda y localización regional)

**Qué hace**: reemplaza los defaults genéricos (USD/MXN) del sistema por guaraní
paraguayo en toda la app — formato de visualización, redondeo, y defaults de gimnasio.

**Decisiones y motivo**:
- El guaraní **no usa decimales** en uso corriente (la unidad más chica de facto es el
  billete/moneda de 50 Gs) — todo el pipeline de dinero trata montos como enteros
  redondeados, no como centavos.
- `round_cash_pyg()` (`backend/app/utils/currency.py`) redondea al múltiplo de 50 más
  cercano — específicamente para montos de efectivo entregado/recibido en caja, donde
  el redondeo importa por la denominación física real de billetes/monedas. No se aplica
  a precios base de planes (esos son el monto exacto configurado).
- `formatPYG()` existe tanto en backend (para texto de plantillas de WhatsApp) como en
  frontend (`frontend/src/utils/index.ts`) con el mismo formato (`₲ 850.000`,
  separador de miles con punto, sin decimales) para que lo que ve el socio por
  WhatsApp coincida exactamente con lo que ve el staff en pantalla.
- Defaults de gimnasio: `currency = "PYG"`, `timezone = "America/Asuncion"`
  (`backend/app/models/gym.py`).

**Estado actual**: completo, aplicado en todos los módulos posteriores.

### 3.2 Fase 2 — WhatsApp (notificaciones)

**Qué hace**: notificaciones automáticas por WhatsApp — confirmación de pago,
recordatorio de vencimiento próximo, resumen de cierre de caja.

**Implementación real de hoy**: **360dialog** (BSP — Business Solution Provider —
sobre Meta Cloud API), no una integración directa con Meta. El cliente
(`backend/app/services/whatsapp_client.py`) habla con `https://waba-v2.360dialog.io`
usando el header propietario `D360-API-KEY`. Deshabilitado por default: si no hay
`WHATSAPP_360DIALOG_API_KEY` configurada, todos los envíos son no-ops que devuelven
`{"status": "disabled"}` — nunca rompen el flujo que los dispara (pago, cierre de
turno), por diseño (fire-and-forget, con `try/except` amplio en el cliente).

**Decisión de proveedor pendiente de ejecutar** — ver
[Pendientes operativos](#5-pendientes-operativos), no es deuda técnica de código.

**Estado actual**: funcional contra 360dialog, sin credenciales de producción
cargadas todavía (deshabilitado por default hasta que se configuren).

### 3.3 Fase 3 — SIFEN (facturación electrónica)

**Qué hace**: generación y (eventualmente) transmisión de Documentos Electrónicos
(Factura Electrónica) al SIFEN de la DNIT paraguaya, siguiendo el Manual Técnico
SIFEN v150.

**Decisión de arquitectura y motivo**: integración **directa** contra los servicios
SOAP de SIFEN, no a través de un integrador/facturador privado tercerizado. El motivo
documentado en el código: el envelope SOAP se arma a mano con `httpx`
(`backend/app/services/sifen_client.py`) en lugar de una librería WSDL-driven (`zeep`,
etc.) específicamente para que los bytes del XML ya firmado lleguen a la red sin
modificar — una librería SOAP que re-parsea/re-serializa el body arriesga invalidar la
canonicalización de la firma enveloped.

**Blanco (white-label) por diseño**: `GymFiscalConfig` (`backend/app/models/invoicing.py`)
no tiene columna de "GymPro" en ningún lado — el emisor fiscal es siempre el RUC y
razón social del gimnasio cliente, nunca la plataforma.

**Sub-entrega 3a (completa)**:
- Modelo de datos: `GymFiscalConfig`, `Timbrado`, `SifenDocument`.
- Construcción del XML del Documento Electrónico (`sifen_xml_builder.py`) — MVP
  acotado explícitamente: Factura Electrónica de un solo ítem, operación al contado,
  IVA 10% (gimnasio = prestación de servicios), receptor "Consumidor Final" sin RUC
  (facturar a un socio con RUC propio es alcance futuro). Notas de crédito,
  multi-ítem y descuentos quedan fuera del MVP.
- Construcción del CDC (Código de Control, 44 caracteres) y firma XML-DSig
  (`sifen_cdc.py`, `sifen_signer.py`).
- Endpoints de configuración fiscal y consulta de estado de documentos
  (`backend/app/api/v1/endpoints/invoicing.py`), UI en Configuración (pestaña Fiscal).
- Estados de documento: `pending_stamping`, `signed`, `transmitted`, `approved`,
  `rejected`, `error`.

**Sub-entrega 3b (bloqueada explícitamente)**: transmisión real a SIFEN. Bloqueada
hasta contar con un **certificado digital real emitido por un PSC paraguayo**
(Prestador de Servicios de Certificación) — necesario tanto para firmar el XML como
para el mTLS mutuo que exige el manual técnico (sec. 7.9/7.10: el certificado del
gimnasio es también el certificado cliente TLS, no solo el firmante). Sin certificado,
`is_fiscal_ready()` siempre devuelve `False` por diseño explícito (comentario en
`invoicing_service.py:29-33`), para que el sistema nunca intente timbrar sin
certificado real. `SIFEN_ENVIRONMENT` debe permanecer en `"test"` hasta entonces.

**Verificado contra fuente oficial vs. asumido — distinción explícita dejada en el
código**:

| Pieza | Estado |
|---|---|
| Layout del CDC (44 campos, offsets) | **Verificado**: decodificado empíricamente contra el ejemplo resuelto del Manual Técnico v150 sec. 10.1 — el layout produce una fecha sintácticamente válida en la posición esperada. |
| Dígito verificador del CDC (módulo 11) | **Verificado** contra la función PL/SQL oficial de la DNIT. |
| Firma XML-DSig (enveloped, exc-c14n, RSA-SHA256, `<Signature>` hermano de `<DE>`) | **Verificado** contra el ejemplo resuelto de firma del manual, sec. 7.6/7.7. |
| SOAP 1.2, Document/Literal, TLS mutuo | **Verificado** contra manual sec. 7.9/7.10. |
| Estructura/anidamiento de tags del XML del DE (`sifen_xml_builder.py`) | **Asumido**: los nombres de tag salen de las tablas de campos del manual (secciones C, D, E7, E8, F), pero el anidamiento **no fue cruzado contra el XSD real** (`siRecepDE_v150.xsd`) — ese archivo no se descargó en la sesión donde se escribió. Pendiente de validar contra el XSD real o contra una respuesta real (aceptación/rechazo) de `sifen-test.set.gov.py`. |
| Formato del certificado del PSC (`.p12`/PFX) | **Asumido** por consenso de fuentes secundarias, no verificado contra un certificado real de un PSC paraguayo — pendiente hasta Sub-entrega 3b. |

**Estado actual**: 3a completa y testeada (con transporte HTTP mockeado); 3b
bloqueada, sin fecha, dependiente de un trámite externo (ver
[Pendientes operativos](#5-pendientes-operativos)).

### 3.4 Fase 4 — Saldo / Deuda

**Qué hace**: cuenta corriente por socio — saldo a favor o deudor, con bloqueo de
check-in cuando la deuda supera un límite configurable por gimnasio.

**Modelo**: `MemberBalanceMovement` es la fuente de verdad (ledger append-only, un
registro firmado por movimiento: positivo = crédito/a favor, negativo = débito/deudor).
`Member.balance` es una caché del saldo acumulado, actualizada en la misma transacción
que cada movimiento (nunca puede desincronizarse de la suma de movimientos salvo por
un fallo a mitad de transacción, que revierte ambos). El campo es **`Decimal`** (no
`float`) tanto en el modelo como en la aritmética del service — corregido durante la
limpieza de código de este roadmap para eliminar drift de precisión de punto flotante
acumulable a través de sucesivos ajustes.

**Bloqueo de check-in**: `attendance_service.check_in()` calcula la deuda
(`-balance`) y, si el gimnasio tiene `debt_limit` configurado y la deuda lo supera,
rechaza el check-in con un 409 y un mensaje específico (`"Saldo deudor de ₲X, supera
el límite de ₲Y configurado"`). Sin `debt_limit` configurado (`NULL` por default), el
bloqueo está desactivado — es opt-in por gimnasio.

**Permisos**: el ajuste manual de saldo (`MEMBER_BALANCE_ADJUST`) está restringido a
`owner`/`admin` únicamente — `receptionist` puede ver el saldo pero no ajustarlo
directamente (los movimientos de `receptionist` llegan indirectamente, vía cobros de
Pagos).

**Estado actual**: completo.

### 3.5 Fase 5 — Caja + Cantina

**Qué hace**: turnos de caja (apertura/cierre con efectivo inicial, retiros
registrados, consolidado automático al cierre) y venta de productos de cantina
integrada al flujo de Pagos, con control de stock.

**Turnos de caja**: un turno abierto por gimnasio a la vez, garantizado con un índice
único parcial en Postgres (`cashregistershift` con `WHERE status='open'`) — el
chequeo a nivel de aplicación tiene una ventana de carrera real (dos requests
concurrentes pueden ver "no hay turno abierto" y ambos intentar crear uno), pero el
índice de DB es la garantía real; el service traduce el `IntegrityError` del perdedor
de la carrera en el mismo 409 limpio que el chequeo previo, en vez de un 500.

**Consolidado automático**: al cerrar turno, se suman los pagos del período agrupados
por método de pago (efectivo/tarjeta/transferencia/otro) más los retiros registrados,
y se calcula el efectivo esperado en caja (`efectivo inicial + cobros en efectivo -
retiros`). Opcionalmente dispara un resumen por WhatsApp al owner (mismo mecanismo de
Fase 2, incluido el no-op silencioso si WhatsApp está deshabilitado).

**Cantina y stock**: `Product.stock` se decrementa con un `UPDATE` atómico
guardado por condición (`WHERE stock >= quantity`) al momento de la venta — si la
condición no se cumple (stock insuficiente), la fila no se toca, `rowcount` es 0, y el
service aborta la venta completa con 409 antes de escribir nada — no hay ventana
donde el stock pueda quedar negativo por una condición de carrera entre dos ventas
simultáneas del mismo producto.

**Estado actual**: completo.

### 3.6 Fase 6 — Diseño visual

**Qué hace**: reemplazo integral de la paleta placeholder (violeta/índigo genérico)
por la identidad visual definitiva para el mercado paraguayo, sin tocar lógica de
negocio ni estructura de layout.

**Tokens** (`frontend/src/index.css`, bloque `@theme` de Tailwind v4 — única fuente de
verdad de diseño, `tailwind.config.ts` es un archivo inerte sin `@config` en ningún
lado):
- Fondo `#0B0D12`, superficie de card `#151821`, superficie elevada (modales/dropdowns)
  `#1C202B`, borde sutil `#2A2F3B`.
- `primary`/`secondary` colapsados al mismo esmeralda `#0E9F6E` (botones primarios,
  estados activos/éxito).
- `tertiary` dorado `#D4A64A` — reservado para CTAs de alto contraste que avanzan
  dinero/estado (ej. "Cobrar", "Abrir turno") y el estado "por vencer".
- `error` terracota `#C4483A` — reemplaza el rojo puro (vencido/cancelado/reembolsado/
  rechazado SIFEN).
- Token nuevo `frozen` azul grisáceo `#6B7A99` — "congelado" no encajaba en ningún slot
  Material de 4 posiciones una vez que dorado pasó a ser color de CTA.
- Tipografía: Inter (base), JetBrains Mono (`--font-mono`) aplicado específicamente a
  todos los montos en guaraníes en toda la app.
- Cards con borde sólido de 1px en vez de sombra difusa.
- Micro-interacción de éxito (flash esmeralda + ícono check) en "Registrar Ingreso" de
  Recepción, vía `motion` (Framer Motion).

**Estado actual**: completo, verificado en las pantallas de las 6 fases con ambas
cuentas (owner/admin y receptionist).

## 4. Deuda técnica

Ítems que dependen de escribir más código — no de trámites ni decisiones externas.

- **Cero tests automatizados de frontend.** No hay `vitest`/`jest` configurado en
  `frontend/package.json` — toda la verificación de frontend hasta ahora fue manual
  (`tsc --noEmit`, ESLint, y verificación en browser). `npm run lint` sí funciona
  (ESLint configurado con `react-hooks/rules-of-hooks` + `exhaustive-deps` durante la
  limpieza de código de este roadmap), pero no reemplaza tests de comportamiento.
- **Boilerplate repetido entre repositorios.** El patrón `create()`
  (add→flush→refresh), `update()` (flush→refresh), y "get-by-id filtrado por
  `gym_id` o `None`" se repite casi textual en `balance_repository.py`,
  `cash_register_repository.py`, `product_repository.py`, `notification_repository.py`
  e `invoicing_repository.py`. Candidato claro a una clase `BaseRepository` genérica,
  no aplicado todavía por no introducir un cambio transversal a 5+ archivos sin que el
  equipo lo priorice explícitamente.
- **Estructura plana en las 4 fases más nuevas.** WhatsApp, SIFEN, Saldo, y Caja+Cantina
  no tienen módulo/hook dedicado en el frontend — están insertadas directamente dentro
  de páginas existentes (`ReceptionPage.tsx`, `PaymentsPage.tsx`,
  `SettingsPage.tsx`, `MembersPage.tsx`, `ProductsPage.tsx`), cada una con su propio
  `fetchX`/`useQuery`/`useMutation` inline en vez de un hook compartido. Consistente
  en todo el código (viejo y nuevo usan el mismo patrón), pero arquitectónicamente
  plano — no hay una capa de servicios/hooks por feature en absoluto, ni en las
  páginas originales.

## 5. Pendientes operativos

Ítems que dependen de trámites o decisiones externas al código — no se resuelven
escribiendo más software.

- **Certificado SIFEN real pendiente.** Bloquea toda la Sub-entrega 3b (transmisión
  real de documentos). Requiere gestionar un certificado digital con un PSC paraguayo
  habilitado por la DNIT.
- **Migración a Meta Cloud API directa — decisión tomada, no ejecutada.** Existe una
  decisión tomada de migrar de 360dialog a Meta Cloud API directa, para eliminar el
  costo fijo mensual de 360dialog (~€49/mes independiente del volumen de mensajes). La
  migración no se ejecutó — quedó pausada por un problema no resuelto en el portal de
  Meta for Developers al solicitar el número de prueba ("Solicitar número de prueba"
  no cargaba). Se priorizó avanzar con las fases siguientes del roadmap en vez de
  resolver ese trámite primero. El swap es de alcance acotado cuando se retome: el
  código real de hoy (360dialog) ya deja `notifications/` desacoplado del proveedor
  específico detrás de `whatsapp_client.py` — cambiar de proveedor no debería tocar
  ningún caller.
- **Verificación de negocio de Meta pendiente**, en la medida en que se retome la
  migración de arriba — Meta exige verificación de negocio antes de habilitar envío de
  plantillas de producción vía Cloud API directa.
- **Sincronización de dependencias con el colega backend.** `signxml`, `lxml`,
  `cryptography`, `apscheduler` (agregadas en Fase 3) y `eslint` + plugins (agregados
  en la limpieza de código de este roadmap) están en `requirements.txt`/`package.json`
  pero pendientes de que el resto del equipo corra `pip install -r requirements.txt` /
  `npm install` en sus entornos locales — mencionado explícitamente porque un
  entorno desactualizado produce errores de "módulo no encontrado" en el editor
  (falsos positivos de linter, no bugs de código) hasta que se sincronice.

## 6. Guía rápida de desarrollo

Guía completa en [`docs/setup.md`](./setup.md). Resumen:

```bash
# Backend + frontend vía Docker (recomendado)
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build
make migrate     # alembic upgrade head
make test        # suite completa de backend
```

Backend queda en `http://localhost:8000`, frontend en `http://localhost:5173`.

**Standalone sin Docker** (requiere Postgres + Redis locales):

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

**Tests backend**: `pytest` usa una base separada (`gympro_test` por default, o
`TEST_DATABASE_URL`/`DATABASE_URL` si están seteadas) — requiere Postgres arriba.
`ruff check app/` para lint.

**Tests frontend**: no hay suite automatizada (ver [§4](#4-deuda-técnica)).
`npx tsc --noEmit` para chequeo de tipos, `npm run lint` para ESLint.

**Convención de branches**: prefijo por tipo + descripción corta en kebab-case —
`feat/...` (funcionalidad nueva), `fix/...` (corrección de bug), `chore/...`
(mantenimiento/limpieza sin cambio funcional). Ej.: `feat/cash-register-and-canteen`,
`fix/pyg-currency-formatting`, `chore/codebase-cleanup`. Se mergean a `main` por
fast-forward cuando es posible; las branches ya fusionadas se borran tras confirmar
que son ancestro de `main`.

## 7. Glosario

| Término | Significado |
|---|---|
| **SIFEN** | Sistema Integrado de Facturación Electrónica Nacional — el sistema de la DNIT que recibe y valida los Documentos Electrónicos (facturas). |
| **DNIT** | Dirección Nacional de Ingresos Tributarios — la autoridad fiscal paraguaya (equivalente a un SAT/AFIP local). |
| **CDC** | Código de Control — identificador único de 44 caracteres de cada Documento Electrónico, embebido en el XML y en el código de barras/QR de la factura impresa. |
| **Timbrado** | Autorización numerada que habilita a un contribuyente a emitir comprobantes fiscales dentro de un rango de números y una fecha de vencimiento. |
| **e-Kuatia** | Nombre del sistema de facturación electrónica de la DNIT en general (marca del sistema SIFEN). |
| **e-Kuatia'i** | Modalidad simplificada de facturación electrónica (para contribuyentes de menor volumen) — distinta del régimen general que implementa este proyecto. |
| **PSC** | Prestador de Servicios de Certificación — entidad habilitada para emitir certificados digitales válidos para firmar Documentos Electrónicos ante SIFEN. |
| **PYG** | Guaraní paraguayo — código ISO 4217 de la moneda, sin decimales en uso corriente. |
