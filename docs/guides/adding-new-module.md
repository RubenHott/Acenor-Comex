# Agregar Nuevo Módulo

## Pasos

### 1. Definir Tipos
```typescript
// src/types/nuevoModulo.ts
export interface NuevoModuloItem { ... }
```

### 2. Crear Datos Mock
```typescript
// src/data/nuevoModuloMock.ts
export const mockItems = [ ... ];
```

### 3. Crear Sidebar
```typescript
// src/components/layout/NuevoModuloSidebar.tsx
```

### 4. Crear Layout
```typescript
// src/components/layout/NuevoModuloLayout.tsx
export function NuevoModuloLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return (
    <div className="flex h-screen">
      <NuevoModuloSidebar />
      <main><Outlet /></main>
    </div>
  );
}
```

### 5. Crear Páginas
```
src/pages/nuevoModulo/
├── DashboardPage.tsx
└── ListPage.tsx
```

### 6. Agregar Rutas
```typescript
// src/App.tsx
<Route path="/nuevo-modulo" element={<NuevoModuloLayout />}>
  <Route path="dashboard" element={<DashboardPage />} />
</Route>
```

### 7. Agregar a ModulesPage
Agregar tarjeta del módulo en `src/pages/ModulesPage.tsx`

### 8. Actualizar AuthContext
Agregar ID del módulo a permisos de admin.
