# Sistema de Módulos

El sistema está diseñado como una plataforma modular donde cada módulo representa una funcionalidad de negocio independiente.

## Concepto

```
┌─────────────────────────────────────────────────────────────┐
│                     ModulesPage (/)                         │
│                   "Selector de Módulos"                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │    COMEX    │  │   Órdenes   │  │  Producción │        │
│   │  (activo)   │  │  de Trabajo │  │ (pendiente) │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │Mantenimiento│  │  Analytics  │  │  Logística  │        │
│   │ (pendiente) │  │ (pendiente) │  │ (pendiente) │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Módulos Actuales

| ID | Nombre | Ruta Base | Estado |
|----|--------|-----------|--------|
| `comex` | COMEX | `/comex/*` | ✅ Implementado |
| `work-orders` | Órdenes de Trabajo | `/work-orders/*` | ✅ Implementado |
| `production` | Producción | `/production/*` | ⏳ Pendiente |
| `maintenance` | Mantenimiento | `/maintenance/*` | ⏳ Pendiente |
| `analytics` | Analytics | `/analytics/*` | ⏳ Pendiente |
| `logistics` | Logística | `/logistics/*` | ⏳ Pendiente |

## Control de Acceso

El acceso a módulos se controla mediante el `AuthContext`:

```typescript
// src/contexts/AuthContext.tsx

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  modules: string[]; // IDs de módulos permitidos
  // ...
}

// Función para verificar acceso
const hasModuleAccess = (moduleId: string): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin tiene acceso a todo
  return user.modules.includes(moduleId);
};
```

### Asignación de Módulos por Rol

| Rol | Módulos Permitidos |
|-----|-------------------|
| `admin` | Todos |
| `manager` | Configurado por usuario |
| `operator` | Configurado por usuario |
| `viewer` | Solo lectura en módulos asignados |

## Estructura de un Módulo

Cada módulo sigue esta estructura:

```
src/
├── components/
│   └── layout/
│       └── [Modulo]Sidebar.tsx    # Navegación del módulo
│       └── [Modulo]Layout.tsx     # Layout con protección de ruta
├── pages/
│   └── [modulo]/
│       ├── [Modulo]DashboardPage.tsx
│       ├── [Modulo]ListPage.tsx
│       └── ...
├── types/
│   └── [modulo].ts                # Interfaces del módulo
└── data/
    └── [modulo]Mock.ts            # Datos mock (desarrollo)
```

## Componentes de un Módulo

### 1. Layout del Módulo

```typescript
// src/components/layout/[Modulo]Layout.tsx

export function ModuloLayout() {
  const { isAuthenticated, hasModuleAccess } = useAuth();

  // Protección de ruta
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar acceso al módulo
  if (!hasModuleAccess('modulo-id')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      <ModuloSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

### 2. Sidebar del Módulo

```typescript
// src/components/layout/[Modulo]Sidebar.tsx

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/modulo/dashboard', icon: LayoutDashboard },
  { label: 'Lista', href: '/modulo/list', icon: List },
  // ...
];

export function ModuloSidebar() {
  return (
    <aside className="flex flex-col h-screen bg-sidebar w-64">
      {/* Logo */}
      {/* Navigation */}
      {/* User info */}
    </aside>
  );
}
```

### 3. Rutas del Módulo

```typescript
// src/App.tsx

<Route path="/modulo" element={<ModuloLayout />}>
  <Route index element={<Navigate to="/modulo/dashboard" replace />} />
  <Route path="dashboard" element={<ModuloDashboardPage />} />
  <Route path="list" element={<ModuloListPage />} />
  <Route path="detail/:id" element={<ModuloDetailPage />} />
</Route>
```

## Cómo Agregar un Nuevo Módulo

### Paso 1: Definir Tipos

```typescript
// src/types/nuevoModulo.ts

export interface NuevoModuloItem {
  id: string;
  nombre: string;
  // ...propiedades específicas
}
```

### Paso 2: Crear Datos Mock

```typescript
// src/data/nuevoModuloMock.ts

export const mockItems: NuevoModuloItem[] = [
  { id: '1', nombre: 'Item 1' },
  // ...
];
```

### Paso 3: Crear Sidebar

```typescript
// src/components/layout/NuevoModuloSidebar.tsx
// Copiar estructura de ComexSidebar.tsx y adaptar
```

### Paso 4: Crear Layout

```typescript
// src/components/layout/NuevoModuloLayout.tsx

export function NuevoModuloLayout() {
  const { isAuthenticated, hasModuleAccess } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasModuleAccess('nuevo-modulo')) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen bg-background">
      <NuevoModuloSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

### Paso 5: Crear Páginas

```typescript
// src/pages/nuevoModulo/NuevoModuloDashboardPage.tsx
// src/pages/nuevoModulo/NuevoModuloListPage.tsx
```

### Paso 6: Agregar Rutas

```typescript
// src/App.tsx

<Route path="/nuevo-modulo" element={<NuevoModuloLayout />}>
  <Route index element={<Navigate to="/nuevo-modulo/dashboard" replace />} />
  <Route path="dashboard" element={<NuevoModuloDashboardPage />} />
  <Route path="list" element={<NuevoModuloListPage />} />
</Route>
```

### Paso 7: Agregar a ModulesPage

```typescript
// src/pages/ModulesPage.tsx

const modules = [
  // ... módulos existentes
  {
    id: 'nuevo-modulo',
    name: 'Nuevo Módulo',
    description: 'Descripción del módulo',
    icon: IconComponent,
    href: '/nuevo-modulo',
    color: 'bg-[color]',
  },
];
```

### Paso 8: Actualizar AuthContext

```typescript
// src/contexts/AuthContext.tsx

// Agregar el ID del módulo a los permisos de admin
const adminModules = ['comex', 'work-orders', 'nuevo-modulo', ...];
```

## Buenas Prácticas

1. **Independencia**: Cada módulo debe ser lo más independiente posible
2. **Componentes compartidos**: Usar componentes de `src/components/ui/` para UI común
3. **Tipos propios**: Cada módulo define sus propios tipos en `src/types/`
4. **Datos separados**: Mock data en archivos separados por módulo
5. **Navegación consistente**: Sidebar con la misma estructura visual
6. **Protección de rutas**: Siempre verificar autenticación y acceso
