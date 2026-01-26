# Manejo de Estado

El proyecto utiliza tres niveles de manejo de estado.

## 1. AuthContext (Autenticación)

**Ubicación**: `src/contexts/AuthContext.tsx`

> ⚠️ **Nota**: Actualmente la autenticación es mock (simulada). Ver [Implementar Autenticación](../guides/implementing-auth.md) para el plan de migración.

### Interface del Usuario

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  modules: string[];  // IDs de módulos permitidos
  createdAt: Date;
}

type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';
```

### Interface del Contexto

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasModuleAccess: (moduleId: string) => boolean;
}
```

### Uso del Contexto

```tsx
import { useAuth } from '@/contexts/AuthContext';

function Component() {
  const { user, isAuthenticated, login, logout, hasModuleAccess } = useAuth();

  // Verificar autenticación
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verificar acceso a módulo
  if (!hasModuleAccess('comex')) {
    return <Navigate to="/" />;
  }

  // Obtener información del usuario
  return <div>Hola, {user.name}</div>;
}
```

---

## 2. React Query (Estado del Servidor)

**Configuración**: `src/App.tsx`

```typescript
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  );
}
```

### Hooks Implementados

El sistema utiliza hooks personalizados que consumen Edge Functions y queries directas a Supabase.

#### useDashboardStats (Edge Function)

```typescript
import { useDashboardStats } from '@/hooks/useDashboardStats';

function Dashboard() {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) return <Skeleton />;
  if (error) return <Alert variant="destructive">{error.message}</Alert>;
  
  return (
    <div>
      <StatCard value={data.pimStats.totalPIMs} />
      <Chart data={data.statusDistribution} />
    </div>
  );
}
```

#### useWorkOrders con Mutation

```typescript
import { useWorkOrders, useCreateWorkOrder } from '@/hooks/useWorkOrders';

function WorkOrdersPage() {
  const { data: orders, isLoading } = useWorkOrders();
  const createMutation = useCreateWorkOrder();

  const handleCreate = (formData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast({ title: 'OT creada exitosamente' });
      },
      onError: (error) => {
        toast({ 
          variant: 'destructive',
          title: 'Error',
          description: error.message 
        });
      }
    });
  };

  return (
    <div>
      <OrdersList orders={orders} />
      <CreateForm onSubmit={handleCreate} isPending={createMutation.isPending} />
    </div>
  );
}
```

### Hooks Disponibles

| Hook | Propósito | Fuente de Datos |
|------|-----------|-----------------|
| `useDashboardStats()` | Estadísticas consolidadas | Edge Function |
| `usePIMs()` | Lista de PIMs | Supabase directo |
| `useWorkOrders()` | Lista de OTs | Supabase directo |
| `useWorkOrderStats()` | Stats de OTs | Edge Function |
| `useCreateWorkOrder()` | Crear OT | Edge Function (mutation) |
| `useProducts()` | Catálogo de productos | Supabase directo |
| `useSuppliers()` | Lista de proveedores | Supabase directo |
| `useRequirements()` | Requerimientos mensuales | Supabase directo |
| `useNotifications()` | Notificaciones | Supabase directo |

Ver [Hooks](./hooks.md) para documentación completa.

---

## 3. Estado Local (useState)

Para estado que solo necesita un componente.

```typescript
function Component() {
  // Estado simple
  const [isOpen, setIsOpen] = useState(false);
  
  // Estado con tipo
  const [selected, setSelected] = useState<PIM | null>(null);
  
  // Estado del sidebar
  const [collapsed, setCollapsed] = useState(false);
  
  // Estado de filtros
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });
}
```

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     Componente React                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   AuthContext   │  │   React Query   │  │  useState   │ │
│  │                 │  │                 │  │             │ │
│  │  • user         │  │  • data         │  │  • isOpen   │ │
│  │  • isAuth       │  │  • isLoading    │  │  • filters  │ │
│  │  • login()      │  │  • error        │  │  • selected │ │
│  │  • logout()     │  │  • refetch()    │  │             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           │      Estado Global │  Estado Server    │ Local  │
│           ▼                    ▼                   ▼        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Render UI                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Hooks Personalizados Utilitarios

### use-toast

```typescript
import { useToast } from '@/hooks/use-toast';

function Component() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: 'Éxito',
      description: 'Operación completada',
    });
  };
}
```

### use-mobile

```typescript
import { useMobile } from '@/hooks/use-mobile';

function Component() {
  const isMobile = useMobile();

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

---

## Buenas Prácticas

1. **AuthContext**: Solo para datos de sesión del usuario
2. **React Query**: Para datos del servidor (Supabase/Edge Functions)
3. **useState**: Para UI local (modals, filtros, selección)
4. **Evitar prop drilling**: Usar Context cuando datos se necesitan en múltiples niveles
5. **Invalidar cache**: Después de mutaciones para mantener datos actualizados

```typescript
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (data) => { /* ... */ },
  onSuccess: () => {
    // Invalidar queries relacionadas
    queryClient.invalidateQueries({ queryKey: ['pims'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  },
});
```

---

*Última actualización: Enero 2026*
