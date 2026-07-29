# Módulo 3 — Membership Plans (Frontend)

**Fecha:** 2026-07-29
**Descripción:** Pantalla de gestión de planes de membresía con catálogo en cards, tabla completa, editor lateral y empty state.

## Componentes nuevos/actualizados

| Archivo | Cambio |
|---------|--------|
| `src/pages/memberships/MembershipsPage.tsx` | Página completa: header con "+ New Plan", grid de cards, tabla Full Plan Catalog, SidePanel editor, empty state |
| `src/components/feature/PlanCard.tsx` | Card individual con `role="button"`, `tabIndex`, text labels en visibility ("Visible"/"Internal") y auto-renew ("Auto"/"Manual"), ∞ icon en vez de emoji |
| `src/components/feature/PlansTable.tsx` | Tabla con touch targets 44×44px en acciones, text label en columna Public ("Yes"/"Internal"), fix TypeScript errors |
| `src/components/layout/SidePanel.tsx` | Touch targets 44×44px en close button y action buttons (Cancel/Save Plan) |
| `src/components/ui/Button.tsx` | `min-h-[44px]` en tamaño `md` (default) para cumplir touch target mínimo |
| `src/index.css` | Reglas `:focus-visible` globales con `outline: 2px solid #c0c1ff` para navegación por teclado |

## Diseño System (dark-mode-first)

- Fondo `#0c1017`, acento indigo `#c0c1ff`, tipografía Inter + JetBrains Mono (tabular numerals)
- Cards con borde sutil, hover con border-color shift, sin sombras pesadas
- "Recommended" card con borde `#c0c1ff` + badge "Recommended" flotante
- "Internal" plans con opacidad reducida + icono `visibility_off` + label "Internal"
- Tabla con hover row, action buttons visibles solo en hover (group)

## Side Panel (editor)

- Slide-over desde la derecha (`max-w-2xl`)
- Overlay con `bg-black/50 backdrop-blur-sm`
- Formulario: name, price, period, type, duration, max visits, description, active toggle, visible toggle, auto-renew toggle
- Escape key cierra, click overlay cierra, foco atrapado al abrir
- Título dinámico: "Create New Plan" / "Edit {name}"

## Empty State

- Sin ilustración, solo icono `card_membership` en círculo
- Mensaje: "No plans created yet" + descripción funcional
- CTA "Create Your First Plan"

## Accesibilidad

- Touch targets mínimos 44×44px en todos los botones interactivos
- `:focus-visible` con outline indigo en todos los elementos focusables
- `aria-label` en cards y action buttons
- `role="button"` + `tabIndex={0}` + keyboard Enter/Space en cards
- Status no conveyado por color solo: dot + text label ("Active"/"Inactive")
- Visibility no conveyado por color solo: icon + text label ("Visible"/"Internal"/"Yes"/"No")

## HTML Mockup (design prototype)

| Archivo | Descripción |
|---------|-------------|
| `docs/designs/memberships-plans.html` | Prototipo HTML independiente con empty state, side panel, touch targets 44px, focus-visible, text labels. Incluye toggle para previsualizar empty state. |

## Build

```
cd frontend && npm run build  # ✓ (tsc + vite build, sin errores)
```
