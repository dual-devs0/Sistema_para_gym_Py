# Módulo 5 — Payments (Frontend)

**Fecha:** 2026-07-29
**Descripción:** Pantalla de historial de pagos y panel lateral para registrar pagos de membresías. Enfocado en precisión financiera con validación field-level, estados de carga y confirmación inline.

## Componentes nuevos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/payments/PaymentsPage.tsx` | Página completa: tabla de transacciones con método, monto, fecha; botón "Register Payment" que abre panel |
| `src/components/feature/RegisterPaymentPanel.tsx` | Panel lateral con formulario completo: member selector con búsqueda, plan dropdown, amount con prefijo currency, segmented control de método de pago (Cash/Card/Transfer/QR/MP), fecha, referencia, summary strip. Estados: form, loading, success |

## Archivos actualizados

| Archivo | Cambio |
|---------|--------|
| `src/components/layout/SidePanel.tsx` | Nuevas props: `submitLabel`, `submitDisabled`, `submitLoading`. Botón submit ya no fuerza `onClose()`, muestra spinner cuando `submitLoading` |
| `src/index.css` | Clase `.spinner` con animación `spin-loader` para estados de carga |

## Formulario Register Payment

| Campo | Tipo | Validación |
|-------|------|------------|
| Member Selection | Search input + member card con foto/plan/precio | — |
| Membership/Plan | Dropdown select | — |
| Amount | Input numérico con prefijo `$`, tabular-numeral | Debe ser > 0 |
| Payment Method | Segmented control 4 opciones: Cash, Card, Transfer, QR/MP | Debe seleccionar uno |
| Payment Date | Input texto con icono calendario | — |
| Reference / Note | Textarea opcional | — |

## Estados

| Estado | Descripción |
|--------|-------------|
| **Form** | Campos editables con validación field-level. Errores aparecen debajo del campo con icono `error` + texto (no solo color) |
| **Loading** | Botón submit muestra spinner + "Processing...", deshabilitado para evitar doble envío |
| **Success** | Confirmación inline con check + resumen del pago. Botones "Register Another Payment" para resetear formulario |

## Summary Strip

- Muestra Price, Adjustment, Total en la parte inferior del panel
- Valores en `font-data-mono` (JetBrains Mono) para escaneabilidad financiera
- Total resaltado en primary

## Accesibilidad

- Touch targets mínimos 44×44px en todos los botones e inputs
- `:focus-visible` en todos los interactivos
- Errores con icono + texto, no color solo
- Payment method buttons con `aria-pressed`
- Spinner accesible en botón submit

## Flujo de datos

```
PaymentsPage
  ├─ payments[] (local state, mock inicial)
  ├─ RegisterPaymentPanel
  │   ├─ onRegister → simula async (1.5s) → nuevo payment al inicio del array
  │   └─ onClose → resetea formulario
  └─ Tabla payments con método/icono, monto, fecha
```

## HTML Mockup (design prototype)

| Archivo | Descripción |
|---------|-------------|
| `docs/designs/register-payment.html` | Prototipo HTML con side panel, validación field-level, loading spinner, success state, summary strip, payment method selector |

## Build

```
cd frontend && npm run build  # ✓ (tsc + vite build, sin errores)
```
