# Módulo COMEX

Sistema de gestión de Comercio Exterior para seguimiento de importaciones.

## Propósito

Controlar el ciclo completo de importación de materias primas:
- Requerimientos mensuales de productos
- Creación y seguimiento de PIMs (Procesos de Importación)
- Seguimiento por etapas con checklist detallado
- Validación de contratos
- Gestión documental por etapa
- Tracking DHL de envíos internacionales
- Métricas de SLA por etapa

## Flujo de Trabajo

```
Requerimiento → PIM → Contrato → Financiero → Producción → Embarque → Internación → Entrega
```

## Páginas

| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | `/comex/dashboard` | ✅ Implementado |
| Requerimientos | `/comex/requirements` | ✅ Implementado |
| PIMs (Lista) | `/comex/pims` | ✅ Implementado |
| Crear PIM | `/comex/pim/crear` | ✅ Implementado |
| Editar PIM | `/comex/pim/editar/:id` | ✅ Implementado |
| Seguimiento PIM | `/comex/pim/seguimiento/:id` | ✅ Implementado |
| Productos | `/comex/products` | ✅ Implementado |
| Proveedores | `/comex/suppliers` | ✅ Implementado |
| Maestros | `/comex/maestros` | ✅ Implementado |
| Contratos | `/comex/contracts` | ⏳ Coming Soon |
| Pagos | `/comex/payments` | ⏳ Coming Soon |
| Precios | `/comex/prices` | ⏳ Coming Soon |

## Estados de PIM

`creado` → `en_negociacion` → `contrato_pendiente` → `contrato_validado` → `en_produccion` → `en_transito` → `en_puerto` → `en_aduana` → `liberado` → `entregado` → `cerrado`

## Sistema de Seguimiento por Etapas

El seguimiento de PIMs se organiza en 6 etapas secuenciales, cada una con su propio checklist:

| Etapa | Key | Descripción |
|-------|-----|-------------|
| Contrato | `contrato` | Validación de contrato con fábrica |
| Financiero | `financiero` | Apertura de LC/pago, SWIFT |
| Producción | `produccion` | Seguimiento de fabricación |
| Embarque | `embarque` | Booking, BL, tracking DHL |
| Internación | `internacion` | Aduana, despachante, liberación |
| Entrega | `entrega` | Recepción, control de calidad |

### Checklist por Etapa

Cada etapa tiene items de checklist con:
- **Items críticos** (obligatorios para completar la etapa)
- **Items opcionales** (informativos)
- Registro de quién y cuándo completó cada item
- Avance automático de etapa al completar items críticos

### Gestión Documental

Los documentos se organizan por etapa y categoría:

| Categoría | Etapas Típicas |
|-----------|----------------|
| Contrato de fábrica | Contrato |
| SWIFT / Comprobante de pago | Financiero |
| Factura Proforma | Financiero |
| Packing List | Embarque |
| Bill of Lading (BL) | Embarque |
| Certificado de Calidad | Embarque |
| Certificado de Origen | Embarque |
| DUA / Despacho | Internación |
| Factura Comercial | Internación |

Los documentos se almacenan en el bucket de Storage `pim-documentos` con soporte para versionamiento.

### Requerimientos y PIMs

- **Al eliminar un PIM**: Se liberan automáticamente los kilos consumidos en `requerimiento_items` y `requerimientos_mensuales`.
- **Al eliminar un requerimiento**: Se eliminan primero los vínculos en `pim_requirement_items`, se desvinculan los PIMs (requerimiento_id = null) y luego se eliminan items y requerimiento.

### Tracking DHL

Integración con la API **DHL Shipment Tracking - Unified** para:
- Consultar estado de envíos en tiempo real
- Registrar automáticamente actualizaciones en el PIM
- Mostrar historial de eventos del envío
- Disponible en las etapas de Embarque e Internación

### División de PIMs

Es posible dividir un PIM en sub-PIMs, asignando items específicos al nuevo PIM. Esto permite:
- Embarques parciales
- Diferentes rutas de envío
- Gestión independiente de cada lote
- **Condiciones de contrato**: El sub-PIM hereda las mismas condiciones (condición precio, fecha embarque, origen, fábrica/molino, notas de pago, etc.)

### Maestro de Fábricas/Molinos

Tabla maestra `fabricas_molinos` (código, nombre, país, ciudad, activo) con:
- **CRUD completo** en Maestros
- **Carga CSV** con plantilla
- **Asignación en PIM**: Fábrica/molino general en condiciones de contrato
- **Override por ítem**: Editar fábrica por producto en crear PIM, editar PIM y división
- **Diálogo rápido**: Crear nueva fábrica desde el formulario de PIM (+ Nuevo)

## Componentes Principales

### Tracking
- `TrackingStageBar` — Barra visual de progreso por etapas
- `TrackingChecklist` — Lista interactiva de items por etapa
- `TrackingTimeline` — Historial de actividad cronológico
- `TrackingNoteDialog` — Agregar notas al seguimiento
- `TrackingProgressMini` — Mini indicador de progreso
- `SplitPIMDialog` — Diálogo para dividir PIMs
- `DocumentUploadPanel` — Panel de subida/gestión de documentos
- `DHLTrackingPanel` — Panel de tracking DHL

### PIM
- `PIMForm` — Formulario de creación/edición de PIM
- `PIMEditItemsTable` — Tabla editable de items del PIM (incl. fábrica/molino por ítem)
- `PIMItemSelector` — Selector de items desde requerimientos (con fábrica/molino por ítem)
- `PIMDetailContract` — Detalle de condiciones del contrato
- `PIMDetailItems` — Vista de items del PIM (muestra fábrica por ítem o "General")
- `PIMContractConditions` — Condiciones contractuales (select fábrica/molino + botón Nuevo)
- `PIMExtraProductSelector` — Selector de productos adicionales (con fábrica/molino por ítem)
- `AddFromRequirementDialog` — Agregar items desde requerimiento
- `AddSupplierDialog` — Agregar nuevo proveedor
- `AddFabricaMolinoDialog` — Crear fábrica/molino desde formulario de PIM

### Requerimientos
- `RequirementEntryForm` — Formulario de entrada de requerimiento
- `ProductAutocomplete` — Autocompletado de productos

## Hooks

| Hook | Propósito |
|------|-----------|
| `usePIMs` | Lista de PIMs, crear, actualizar, eliminar (libera kilos en requerimientos) |
| `usePIMCreation` | Crear PIM con items, consumo de requerimiento y molino por ítem |
| `usePIMItems` | Items de un PIM específico |
| `usePIMDocuments` | Documentos de un PIM |
| `usePIMTracking` | Etapas, checklist, timeline, dividir PIM (con condiciones de contrato) |
| `useProducts` | Catálogo de productos |
| `useSuppliers` | Proveedores |
| `useMolinos` | Maestro de fábricas/molinos (CRUD, bulk insert, activos) |
| `useRequirements` | Requerimientos mensuales (eliminar desvincula PIMs y pim_requirement_items) |
| `useCuadros` | Cuadros de importación |
| `useSLAData` | Datos de SLA |
| `useDashboardStats` | Estadísticas del dashboard |

## Métricas SLA

- Negociación: 5 días
- Contrato: 3 días
- Apertura pago: 2 días
- Producción: 25-35 días
- Tránsito: 20-25 días
- Aduana: 5 días

---

*Última actualización: Febrero 2026*
