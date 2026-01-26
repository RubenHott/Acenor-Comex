# Módulo COMEX

Sistema de gestión de Comercio Exterior para seguimiento de importaciones.

## Propósito

Controlar el ciclo completo de importación de materias primas:
- Requerimientos mensuales de productos
- Creación y seguimiento de PIMs (Procesos de Importación)
- Validación de contratos
- Métricas de SLA por etapa

## Flujo de Trabajo

```
Requerimiento → PIM → Contrato → Producción → Tránsito → Aduana → Entrega
```

## Páginas

| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | `/comex/dashboard` | ✅ Implementado (mock) |
| Requerimientos | `/comex/requirements` | ✅ Implementado (mock) |
| PIMs | `/comex/pims` | ✅ Implementado (mock) |
| Productos | `/comex/products` | ✅ Implementado (mock) |
| Proveedores | `/comex/suppliers` | ✅ Implementado (mock) |
| Contratos | `/comex/contracts` | ⏳ Coming Soon |
| Pagos | `/comex/payments` | ⏳ Coming Soon |
| Precios | `/comex/prices` | ⏳ Coming Soon |

## Estados de PIM

`creado` → `en_negociacion` → `contrato_pendiente` → `contrato_validado` → `en_produccion` → `en_transito` → `en_puerto` → `en_aduana` → `liberado` → `entregado` → `cerrado`

## Métricas SLA

- Negociación: 5 días
- Contrato: 3 días
- Apertura pago: 2 días
- Producción: 25-35 días
- Tránsito: 20-25 días
- Aduana: 5 días
