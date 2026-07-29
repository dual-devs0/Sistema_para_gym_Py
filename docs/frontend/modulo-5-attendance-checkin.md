# Módulo 5 — Attendance Check-in (Frontend)

**Fecha:** 2026-07-29
**Descripción:** Pantalla de check-in operativo para recepción, optimizada para uso高频 con búsqueda por nombre/ID, estados de membresía y lista de check-ins recientes en vivo.

## Componentes nuevos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/attendance/AttendancePage.tsx` | Página completa: search con auto-focus, member result card, recent check-ins, contador today's check-ins, hint de búsqueda |
| `src/components/feature/CheckInCard.tsx` | Card de resultado con 4 estados: Active, Expiring (warning + check-in permitido), Frozen (bloqueado + "Go to Payments"), Expired (bloqueado + "Go to Payments"). Botón Check In con animación pulse, 44×44px touch targets |
| `src/components/feature/RecentCheckIns.tsx` | Tabla de check-ins recientes con avatar, nombre, status (Verified/Guest), timestamp. Empty state cuando no hay check-ins. Animación slide-in-up para nuevas filas |

## Archivos actualizados

| Archivo | Cambio |
|---------|--------|
| `tailwind.config.ts` | Nuevas keyframes: `pulse-check` (confirmación check-in), `slide-in-up` (nuevas filas). Nuevo spacing `xxl` |
| `src/index.css` | Nueva clase `.custom-scrollbar` para scrollbars consistentes |

## Estados de membresía

| Estado | Badge | Check-in permitido | Acciones |
|--------|-------|--------------------|----------|
| Active | `check_circle` + "Active" (secondary) | Sí | Botón "Check In" primario |
| Expiring | `schedule` + "Expiring Soon" (tertiary) | Sí | Botón "Check In" + warning "expires soon" |
| Frozen | `pause_circle` + "Frozen" (outline) | No | Mensaje "not allowed" + "Go to Payments" |
| Expired | `cancel` + "Expired" (error) | No | Mensaje "must purchase" + "Go to Payments" |

- Todos los estados se distinguen por icono + texto, no por color solo
- El botón Check-In deshabilitado muestra icono `block` + texto "Check-in Not Available"

## Flujo de datos

```
AttendancePage
  ├─ useQuery["attendance-today"] → /api/v1/attendance/today → total_checkins
  ├─ Search input (local state) → filter mockMembers[]
  ├─ selectedMember → CheckInCard
  │   ├─ onCheckIn → increment counter + add to recentCheckIns
  │   └─ onGoToPayments → navigate to /payments
  └─ recentCheckIns (local state, max 15) → RecentCheckIns
```

## Accesibilidad

- Search input auto-focus on page load (para scanner)
- Touch targets mínimos 44×44px (botones, inputs)
- `:focus-visible` en todos los interactivos
- Estados por icono + texto, no color solo
- `prefers-reduced-motion` respetado en animaciones pulse-check y slide-in-up
- `aria-label` en inputs y botones

## Animaciones

- **pulse-check**: anillo de boxShadow que se expande en 0.5s al hacer check-in exitoso
- **slide-in-up**: nueva fila en recent list aparece deslizándose desde abajo (opacity + translateY)
- Ambas se desactivan con `prefers-reduced-motion: reduce`

## Mock data (dev)

- 8 miembros con estados variados (active, expiring, frozen, expired)
- 7 check-ins recientes simulados
- `placeholderData` para today summary (156 check-ins, 42 active now)

## HTML Mockup (design prototype)

| Archivo | Descripción |
|---------|-------------|
| `docs/designs/checkin-screen.html` | Prototipo HTML con search funcional, 4 templates de resultado, recent list dinámica, toggle de estados |

## Build

```
cd frontend && npm run build  # ✓ (tsc + vite build, sin errores)
```
