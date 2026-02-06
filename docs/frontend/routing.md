# Sistema de Enrutamiento

El enrutamiento utiliza React Router v6 con layouts anidados y protección de rutas.

## Configuración Principal

```typescript
// src/App.tsx

<BrowserRouter>
  <Routes>
    {/* Rutas públicas */}
    <Route path="/login" element={<LoginPage />} />
    
    {/* Ruta raíz - requiere autenticación */}
    <Route path="/" element={<ModulesPage />} />
    
    {/* Módulo COMEX */}
    <Route path="/comex" element={<ComexLayout />}>
      <Route index element={<Navigate to="/comex/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="requirements" element={<RequirementsPage />} />
      <Route path="pims" element={<PIMsPage />} />
      <Route path="pim/crear" element={<CreatePIMPage />} />
      <Route path="pim/editar/:id" element={<EditPIMPage />} />
      <Route path="pim/seguimiento/:id" element={<PIMTrackingPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="suppliers" element={<SuppliersPage />} />
      <Route path="maestros" element={<MaestrosPage />} />
      <Route path="contracts" element={<ComingSoonPage />} />
      <Route path="payments" element={<ComingSoonPage />} />
      <Route path="prices" element={<ComingSoonPage />} />
      <Route path="users" element={<ComingSoonPage />} />
      <Route path="notifications" element={<ComingSoonPage />} />
      <Route path="settings" element={<ComingSoonPage />} />
    </Route>

    {/* Módulo Órdenes de Trabajo */}
    <Route path="/work-orders" element={<WorkOrdersLayout />}>
      <Route index element={<Navigate to="/work-orders/dashboard" replace />} />
      <Route path="dashboard" element={<WorkOrdersDashboardPage />} />
      <Route path="orders" element={<WorkOrdersListPage />} />
      <Route path="orders/:id" element={<WorkOrderDetailPage />} />
      <Route path="create" element={<CreateWorkOrderPage />} />
      <Route path="maintenance" element={<ComingSoonPage />} />
      <Route path="production" element={<ComingSoonPage />} />
      <Route path="quality" element={<ComingSoonPage />} />
      <Route path="reports" element={<ComingSoonPage />} />
      <Route path="templates" element={<ComingSoonPage />} />
      <Route path="notifications" element={<ComingSoonPage />} />
      <Route path="users" element={<ComingSoonPage />} />
      <Route path="settings" element={<ComingSoonPage />} />
    </Route>

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

## Mapa de Rutas

### Rutas Globales

| Ruta | Componente | Descripción | Protegida |
|------|------------|-------------|-----------|
| `/login` | `LoginPage` | Inicio de sesión | ❌ |
| `/` | `ModulesPage` | Selector de módulos | ✅ |
| `*` | `NotFound` | Página 404 | ❌ |

### Módulo COMEX (`/comex/*`)

| Ruta | Componente | Descripción | Estado |
|------|------------|-------------|--------|
| `/comex` | Redirect | → `/comex/dashboard` | - |
| `/comex/dashboard` | `DashboardPage` | KPIs y resumen | ✅ Implementado |
| `/comex/requirements` | `RequirementsPage` | Requerimientos mensuales | ✅ Implementado |
| `/comex/pims` | `PIMsPage` | Lista de PIMs | ✅ Implementado |
| `/comex/pim/crear` | `CreatePIMPage` | Crear nuevo PIM | ✅ Implementado |
| `/comex/pim/editar/:id` | `EditPIMPage` | Editar PIM existente | ✅ Implementado |
| `/comex/pim/seguimiento/:id` | `PIMTrackingPage` | Seguimiento por etapas | ✅ Implementado |
| `/comex/products` | `ProductsPage` | Catálogo de productos | ✅ Implementado |
| `/comex/suppliers` | `SuppliersPage` | Gestión de proveedores | ✅ Implementado |
| `/comex/maestros` | `MaestrosPage` | Tablas maestras | ✅ Implementado |
| `/comex/contracts` | `ComingSoonPage` | Validación de contratos | ⏳ Pendiente |
| `/comex/payments` | `ComingSoonPage` | Control de pagos | ⏳ Pendiente |
| `/comex/prices` | `ComingSoonPage` | Histórico de precios | ⏳ Pendiente |

### Módulo Órdenes de Trabajo (`/work-orders/*`)

| Ruta | Componente | Descripción | Estado |
|------|------------|-------------|--------|
| `/work-orders` | Redirect | → `/work-orders/dashboard` | - |
| `/work-orders/dashboard` | `WorkOrdersDashboardPage` | KPIs de OTs | ✅ Implementado |
| `/work-orders/orders` | `WorkOrdersListPage` | Lista de OTs | ✅ Implementado |
| `/work-orders/orders/:id` | `WorkOrderDetailPage` | Detalle de OT | ✅ Implementado |
| `/work-orders/create` | `CreateWorkOrderPage` | Crear nueva OT | ✅ Implementado |
| `/work-orders/maintenance` | `ComingSoonPage` | Mantenimiento programado | ⏳ Pendiente |
| `/work-orders/production` | `ComingSoonPage` | OTs de producción | ⏳ Pendiente |
| `/work-orders/quality` | `ComingSoonPage` | Control de calidad | ⏳ Pendiente |
| `/work-orders/reports` | `ComingSoonPage` | Reportes | ⏳ Pendiente |

## Layouts Anidados

```
┌─────────────────────────────────────────────────────┐
│                    ComexLayout                       │
├────────────┬────────────────────────────────────────┤
│            │                                         │
│   Sidebar  │              <Outlet />                 │
│            │                                         │
│            │  ┌─────────────────────────────────┐   │
│ Dashboard  │  │     DashboardPage               │   │
│ PIMs       │  │     PIMsPage                    │   │
│ Crear PIM  │  │     CreatePIMPage               │   │
│ Seguimiento│  │     PIMTrackingPage             │   │
│ Products   │  │     etc.                        │   │
│ Suppliers  │  │                                 │   │
│ Maestros   │  └─────────────────────────────────┘   │
│            │                                         │
└────────────┴────────────────────────────────────────┘
```

## Navegación Programática

```typescript
import { useNavigate } from 'react-router-dom';

function Component() {
  const navigate = useNavigate();

  navigate('/comex/pims');                      // Navegar a lista
  navigate('/comex/pim/seguimiento/uuid-123');  // Tracking de PIM
  navigate('/comex/pim/crear');                 // Crear nuevo PIM
  navigate(-1);                                 // Ir atrás
}
```

## Parámetros de Ruta

```typescript
import { useParams } from 'react-router-dom';

function PIMTrackingPage() {
  const { id } = useParams<{ id: string }>();
  // id = UUID del PIM para seguimiento
}
```

---

*Última actualización: Febrero 2026*
