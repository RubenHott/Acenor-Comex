
# Plan: Corregir Errores de Build del Módulo Work Orders

## Problema Identificado

El proyecto tiene errores de compilación porque **6 archivos están vacíos** (0 líneas) pero son importados en `App.tsx`:

| Archivo | Estado |
|---------|--------|
| `src/components/layout/WorkOrdersLayout.tsx` | Vacío |
| `src/components/layout/WorkOrdersSidebar.tsx` | Vacío |
| `src/pages/workOrders/WorkOrdersDashboardPage.tsx` | Vacío |
| `src/pages/workOrders/WorkOrdersListPage.tsx` | Vacío |
| `src/pages/workOrders/WorkOrderDetailPage.tsx` | Vacío |
| `src/pages/workOrders/CreateWorkOrderPage.tsx` | Vacío |

Adicionalmente, no existen los archivos de tipos y datos mock:
- `src/types/workOrders.ts` (vacío)
- `src/data/workOrdersMock.ts` (vacío)

## Solución

Crear implementaciones mínimas funcionales para cada archivo, siguiendo el mismo patrón del módulo COMEX.

## Archivos a Crear/Modificar

### 1. Tipos de datos: `src/types/workOrders.ts`
Definir interfaces para:
- `WorkOrder`: estado, prioridad, técnico asignado, fechas, descripción
- `WorkOrderStatus`: pendiente, en_progreso, completada, cancelada
- `WorkOrderPriority`: baja, media, alta, urgente

### 2. Datos mock: `src/data/workOrdersMock.ts`
Datos de ejemplo para 5-6 órdenes de trabajo con diferentes estados.

### 3. Sidebar: `src/components/layout/WorkOrdersSidebar.tsx`
Navegación lateral del módulo con secciones:
- Dashboard
- Listado de OTs
- Crear OT
- Mantenimiento (próximamente)
- Reportes (próximamente)

### 4. Layout: `src/components/layout/WorkOrdersLayout.tsx`
Layout que protege rutas (verifica autenticación) e incluye el sidebar.

### 5. Páginas del módulo:

| Página | Contenido |
|--------|-----------|
| `WorkOrdersDashboardPage.tsx` | KPIs: OTs activas, completadas, pendientes. Lista resumida |
| `WorkOrdersListPage.tsx` | Tabla con filtros de estado y prioridad |
| `WorkOrderDetailPage.tsx` | Vista detalle de una OT específica |
| `CreateWorkOrderPage.tsx` | Formulario para crear nueva OT |

---

## Detalles Técnicos

### Estructura de `WorkOrder`
```text
WorkOrder
├── id: string
├── codigo: string (ej: "OT-2024-001")
├── titulo: string
├── descripcion: string
├── estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
├── prioridad: 'baja' | 'media' | 'alta' | 'urgente'
├── tipoTrabajo: 'correctivo' | 'preventivo' | 'mejora'
├── area: string (ej: "Producción", "Mantenimiento")
├── equipoId?: string
├── tecnicoAsignado?: string
├── solicitante: string
├── fechaCreacion: Date
├── fechaInicio?: Date
├── fechaFin?: Date
├── fechaLimite: Date
└── observaciones?: string
```

### WorkOrdersLayout.tsx
- Verificará `isAuthenticated` del AuthContext
- Redirigirá a `/login` si no está autenticado
- Usará el mismo patrón de flex container que ComexLayout

### WorkOrdersSidebar.tsx
- Icono principal: `ClipboardList`
- Color del gradiente: `from-emerald-600 to-teal-500`
- Botón para volver a módulos (`/`)

### Páginas con contenido mínimo funcional
Cada página exportará un componente por defecto con una estructura básica que muestre:
- Título de la página
- Breadcrumb de navegación
- Contenido placeholder (en las próximas iteraciones se puede expandir)

---

## Orden de Implementación

1. `src/types/workOrders.ts` - Tipos base
2. `src/data/workOrdersMock.ts` - Datos de ejemplo
3. `src/components/layout/WorkOrdersSidebar.tsx` - Navegación
4. `src/components/layout/WorkOrdersLayout.tsx` - Layout protegido
5. `src/pages/workOrders/WorkOrdersDashboardPage.tsx` - Dashboard
6. `src/pages/workOrders/WorkOrdersListPage.tsx` - Listado
7. `src/pages/workOrders/WorkOrderDetailPage.tsx` - Detalle
8. `src/pages/workOrders/CreateWorkOrderPage.tsx` - Formulario

Una vez implementados estos 8 archivos, los errores de build se resolverán y la aplicación funcionará correctamente.
