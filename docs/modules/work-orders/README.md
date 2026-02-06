# Módulo Órdenes de Trabajo

Gestión de órdenes de trabajo para mantenimiento y producción.

## Propósito

- Crear y asignar órdenes de trabajo
- Seguimiento de estado y prioridad
- Control de tiempos y recursos
- Código auto-generado y fecha límite calculada

## Páginas

| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | `/work-orders/dashboard` | ✅ Implementado |
| Lista OTs | `/work-orders/orders` | ✅ Implementado |
| Detalle OT | `/work-orders/orders/:id` | ✅ Implementado |
| Crear OT | `/work-orders/create` | ✅ Implementado |
| Mantenimiento | `/work-orders/maintenance` | ⏳ Coming Soon |
| Producción | `/work-orders/production` | ⏳ Coming Soon |
| Calidad | `/work-orders/quality` | ⏳ Coming Soon |
| Reportes | `/work-orders/reports` | ⏳ Coming Soon |

## Tipos de OT

- **Correctivo**: Reparación de fallas
- **Preventivo**: Mantenimiento programado
- **Mejora**: Optimizaciones

## Estados

`pendiente` → `en_progreso` → `completada` | `cancelada`

## Prioridades

| Prioridad | SLA |
|-----------|-----|
| Baja | 14 días |
| Media | 7 días |
| Alta | 3 días |
| Urgente/Crítica | 1 día |

## Edge Functions

- `create-work-order` — Crea OT con código auto-generado (`OT-YYYY-NNN`) y fecha límite calculada
- `get-work-order-stats` — Estadísticas agregadas (total, pendientes, en progreso, completadas, urgentes)

---

*Última actualización: Febrero 2026*
