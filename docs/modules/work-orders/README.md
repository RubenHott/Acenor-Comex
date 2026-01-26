# Módulo Órdenes de Trabajo

Gestión de órdenes de trabajo para mantenimiento y producción.

## Propósito

- Crear y asignar órdenes de trabajo
- Seguimiento de estado y prioridad
- Control de tiempos y recursos

## Páginas

| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | `/work-orders/dashboard` | ✅ Implementado |
| Lista OTs | `/work-orders/orders` | ✅ Implementado |
| Detalle OT | `/work-orders/orders/:id` | ✅ Implementado |
| Crear OT | `/work-orders/create` | ✅ Implementado |
| Mantenimiento | `/work-orders/maintenance` | ⏳ Coming Soon |

## Tipos de OT

- **Correctivo**: Reparación de fallas
- **Preventivo**: Mantenimiento programado
- **Mejora**: Optimizaciones

## Estados

`pendiente` → `en_progreso` → `completada` | `cancelada`

## Prioridades

| Prioridad | SLA |
|-----------|-----|
| Baja | 7 días |
| Media | 3 días |
| Alta | 24 horas |
| Urgente | 4 horas |
