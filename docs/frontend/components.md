# Componentes Reutilizables

Documentación de los componentes custom del sistema organizados por categoría.

## Componentes de Layout

### ComexSidebar / WorkOrdersSidebar

Sidebars de navegación para cada módulo con soporte para colapsar, badges, secciones y botón de retorno a módulos.

### Header

Encabezado con título, subtítulo, búsqueda y notificaciones.

```typescript
interface HeaderProps {
  title?: string;
  subtitle?: string;
}
```

---

## Componentes de Dashboard

### StatCard

Tarjeta de estadísticas con variantes de color y tendencia.

**Variantes**: `default`, `primary`, `accent`, `success`, `warning`

### PIMStatusBadge

Badge que muestra el estado de un PIM con colores semánticos (13 estados).

### SLAIndicator

Indicador visual del cumplimiento de SLA (verde/amarillo/rojo).

### RecentPIMsTable

Tabla de PIMs recientes con acciones.

---

## Componentes de Tracking (`src/components/tracking/`)

### TrackingStageBar

Barra visual de progreso que muestra las 6 etapas del seguimiento. Cada etapa muestra su icono, nombre y estado (pendiente/en_progreso/completado).

### TrackingChecklist

Lista interactiva de items por etapa. Muestra checkbox, texto, badge de criticidad, y quién/cuándo completó cada item.

### TrackingTimeline

Historial cronológico de actividad del PIM. Muestra notas, cambios de estado, actualizaciones DHL, etc.

### TrackingNoteDialog

Diálogo modal para agregar notas al seguimiento de un PIM.

### TrackingProgressMini

Mini indicador de progreso para mostrar avance en la lista de PIMs.

### SplitPIMDialog

Diálogo para dividir un PIM en sub-PIMs seleccionando items específicos.

### DocumentUploadPanel

Panel completo para gestión de documentos por etapa. Permite subir, ver, eliminar archivos organizados por categoría (BL, SWIFT, Certificados, etc.).

### DHLTrackingPanel

Panel para consultar el estado de envíos DHL. Muestra último estado, permite ingresar tracking number y consultar actualizaciones en tiempo real.

---

## Componentes de PIM (`src/components/pim/`)

### PIMForm

Formulario principal para crear/editar PIMs. Incluye selección de requerimiento, proveedor, cuadro, condiciones de pago.

### PIMEditItemsTable

Tabla editable de items del PIM con cantidades, precios, toneladas.

### PIMItemSelector

Selector de items desde requerimientos disponibles con kilos disponibles.

### PIMDetailContract / PIMContractConditions

Vista de condiciones contractuales del PIM (modalidad de pago, crédito, anticipo, etc.).

### PIMDetailItems

Vista de solo lectura de los items del PIM.

### PIMExtraProductSelector

Selector para agregar productos adicionales que no están en el requerimiento.

### AddFromRequirementDialog

Diálogo para agregar items desde un requerimiento al PIM.

### AddSupplierDialog

Diálogo para crear un nuevo proveedor rápido dentro del flujo de creación de PIM.

---

## Componentes de Requerimientos (`src/components/requirements/`)

### RequirementEntryForm

Formulario de entrada de items de requerimiento con autocompletado de productos.

### ProductAutocomplete

Componente de autocompletado que busca productos por código o descripción.

---

## Componentes de Maestros (`src/components/maestros/`)

### TableStructureCard

Tarjeta que muestra la estructura de una tabla maestra (columnas, tipos, etc.).

---

## Componentes de Work Orders

### PriorityBadge

Badge de prioridad: baja (gris), media (azul), alta (naranja), urgente (rojo).

### WorkOrderStatusBadge

Badge de estado: pendiente (amarillo), en_progreso (azul), completada (verde), cancelada (rojo).

---

## Patrones de Importación

```tsx
// Tracking
import { TrackingStageBar } from '@/components/tracking/TrackingStageBar';
import { DHLTrackingPanel } from '@/components/tracking/DHLTrackingPanel';

// PIM
import { PIMForm } from '@/components/pim/PIMForm';
import { PIMItemSelector } from '@/components/pim/PIMItemSelector';

// Dashboard
import { StatCard } from '@/components/dashboard/StatCard';
import { SLAIndicator } from '@/components/dashboard/SLAIndicator';

// Layout
import { Header } from '@/components/layout/Header';
```

---

*Última actualización: Febrero 2026*
