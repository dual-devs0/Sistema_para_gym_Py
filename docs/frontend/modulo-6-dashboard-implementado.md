# Módulo 6 — Dashboard y Reportes (Frontend)

**Commit:** `62dd6d6` / **Implementación dashboard completa**
**Fecha:** 2026-07-28 (implementación)
**Descripción:** Dashboard completo para owner/admin con métricas, gráficas y tabla de expiraciones.

## Componentes nuevos/actualizados

| Archivo | Descripción |
|---------|-------------|
| `src/components/feature/StatCard.tsx` | Tarjetas de métricas con tendencia (up/down), icono, prefix ($), variante warning |
| `src/components/feature/RevenueChart.tsx` | Gráfico de barras 30d con Recharts, tooltip custom, selector de período (7D/30D/90D) |
| `src/components/feature/MemberStatusDonut.tsx` | Donut chart SVG con breakdown: Active/Frozen/Cancelled, porcentajes y totales |
| `src/components/feature/ExpiringTable.tsx` | Tabla expiraciones: nombre, plan (badge), fecha, botón Renew con estado disabled |
| `src/components/layout/Sidebar.tsx` | Dark mode, colapsible (64px/240px), Material Symbols, logo GymPro, logout |
| `src/components/layout/TopBar.tsx` | Gym selector, search desktop/móvil, notificaciones con badge, user menu con avatar |
| `src/components/layout/PageLayout.tsx` | Wrapper principal con sidebar + topbar + content area scrollable |
| `src/pages/dashboard/DashboardPage.tsx` | Página completa: header welcome, 4 stat cards, revenue chart + donut, expiring table |

## Design System (Tailwind-free)

| Archivo | Cambio |
|---------|--------|
| `tailwind.config.ts` | Design tokens dark-mode-first: `background: #0c1017`, `primary: #c0c1ff` (indigo), escalas de color/surface/typography/spacing |
| `src/index.css` | Componentes CSS nativos con variables: `.stat-card`, `.btn-primary`, `.badge-*`, `.table-*`, `.avatar`, `.scrollbar-thin`, Material Symbols |

## Flujo de datos

```
DashboardPage
  ├─ useQuery["dashboard-summary"] → /api/v1/dashboard/summary → StatCard (4)
  ├─ useQuery["dashboard-revenue"] → /api/v1/dashboard/revenue → RevenueChart
  └─ useQuery["dashboard-expiring"] → /api/v1/dashboard/expiring → ExpiringTable
```

## Mock data (dev)

- `mockSummary`: revenue_today=1240, active_members=842, checkins_today=156, expiring=24
- `mockRevenue`: 30 puntos de datos simulados
- `mockExpiring`: 5 miembros con planes premium/basic/student

## Build

```
cd frontend && npm run build  # ✓ 5.44s
```

**Nota:** Se eliminó PostCSS/Tailwind plugin por conflicto sucrase parser en Vite 7. CSS plano con design tokens funciona nativamente.