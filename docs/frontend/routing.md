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
      <Route path="products" element={<ProductsPage />} />
      <Route path="suppliers" element={<SuppliersPage />} />
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
| `/comex/products` | `ProductsPage` | Catálogo de productos | ✅ Implementado |
| `/comex/suppliers` | `SuppliersPage` | Gestión de proveedores | ✅ Implementado |
| `/comex/contracts` | `ComingSoonPage` | Validación de contratos | ⏳ Pendiente |
| `/comex/payments` | `ComingSoonPage` | Control de pagos | ⏳ Pendiente |
| `/comex/prices` | `ComingSoonPage` | Histórico de precios | ⏳ Pendiente |
| `/comex/users` | `ComingSoonPage` | Gestión de usuarios | ⏳ Pendiente |
| `/comex/notifications` | `ComingSoonPage` | Notificaciones | ⏳ Pendiente |
| `/comex/settings` | `ComingSoonPage` | Configuración | ⏳ Pendiente |

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
| `/work-orders/templates` | `ComingSoonPage` | Plantillas de OT | ⏳ Pendiente |
| `/work-orders/notifications` | `ComingSoonPage` | Notificaciones | ⏳ Pendiente |
| `/work-orders/users` | `ComingSoonPage` | Usuarios | ⏳ Pendiente |
| `/work-orders/settings` | `ComingSoonPage` | Configuración | ⏳ Pendiente |

## Layouts Anidados

Los layouts anidados permiten compartir UI común (sidebar, header) entre páginas de un mismo módulo.

```
┌─────────────────────────────────────────────────────┐
│                    ComexLayout                       │
├────────────┬────────────────────────────────────────┤
│            │                                         │
│   Sidebar  │              <Outlet />                 │
│            │                                         │
│            │  ┌─────────────────────────────────┐   │
│ Dashboard  │  │                                 │   │
│ PIMs       │  │     DashboardPage               │   │
│ Products   │  │     RequirementsPage            │   │
│ Suppliers  │  │     PIMsPage                    │   │
│ ...        │  │     etc.                        │   │
│            │  │                                 │   │
│            │  └─────────────────────────────────┘   │
│            │                                         │
└────────────┴────────────────────────────────────────┘
```

### Implementación del Layout

```typescript
// src/components/layout/ComexLayout.tsx

export function ComexLayout() {
  const { isAuthenticated } = useAuth();

  // Protección de ruta
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ComexSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet /> {/* Aquí se renderizan las páginas hijas */}
      </main>
    </div>
  );
}
```

## Protección de Rutas

La protección se implementa directamente en los layouts:

```typescript
function ProtectedLayout() {
  const { isAuthenticated, hasModuleAccess } = useAuth();

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir a home si no tiene acceso al módulo
  if (!hasModuleAccess('module-id')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <Sidebar />
      <Outlet />
    </div>
  );
}
```

## Navegación Programática

```typescript
import { useNavigate } from 'react-router-dom';

function Component() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/comex/pims');           // Navegar a ruta
    navigate(-1);                       // Ir atrás
    navigate('/comex/orders/123');      // Ruta con parámetros
  };
}
```

## Parámetros de Ruta

```typescript
import { useParams } from 'react-router-dom';

function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  // Usar el ID para cargar datos
  return <div>Orden de trabajo: {id}</div>;
}
```

## Flujo de Navegación

```
┌─────────────────────────────────────────────────────────────┐
│                     Usuario Anónimo                          │
│                            │                                 │
│                            ▼                                 │
│                      /login                                  │
│                            │                                 │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                  │
│     Login exitoso               Login fallido               │
│              │                           │                  │
│              ▼                           ▼                  │
│      Redirige a /                Muestra error              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Usuario Autenticado                       │
│                            │                                 │
│                            ▼                                 │
│               / (ModulesPage)                               │
│                            │                                 │
│              Selecciona módulo                               │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│    /comex/*         /work-orders/*      /[otro]/*           │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ComexLayout      WorkOrdersLayout      OtroLayout          │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│   Páginas del       Páginas del       Páginas del          │
│    módulo            módulo            módulo              │
└─────────────────────────────────────────────────────────────┘
```

## Componente ComingSoonPage

Para páginas pendientes de implementación:

```typescript
// src/pages/ComingSoonPage.tsx

function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1>Próximamente</h1>
      <p>Esta funcionalidad está en desarrollo</p>
    </div>
  );
}
```
