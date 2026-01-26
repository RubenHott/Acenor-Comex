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

### Lógica de Login (Mock)

```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  // Mock: cualquier password de 4+ caracteres es válido
  if (email && password.length >= 4) {
    const isAdmin = email.includes('admin');
    
    setUser({
      id: 'user-1',
      email,
      name: email.split('@')[0].replace(/\./g, ' '),
      role: isAdmin ? 'admin' : 'operator',
      modules: isAdmin 
        ? ['comex', 'work-orders', 'production', 'maintenance', 'analytics', 'logistics']
        : ['comex'],
      createdAt: new Date(),
    });
    
    return true;
  }
  return false;
};
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

### Patrones de Uso (Pendiente de Implementar)

#### Query para Leer Datos

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function usePIMs() {
  return useQuery({
    queryKey: ['pims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pims')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Uso en componente
function PIMsList() {
  const { data: pims, isLoading, error } = usePIMs();

  if (isLoading) return <Skeleton />;
  if (error) return <Alert variant="destructive">{error.message}</Alert>;
  
  return <Table>{/* ... */}</Table>;
}
```

#### Mutation para Escribir Datos

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCreatePIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPIM: CreatePIMInput) => {
      const { data, error } = await supabase
        .from('pims')
        .insert(newPIM)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar cache para recargar datos
      queryClient.invalidateQueries({ queryKey: ['pims'] });
    },
  });
}

// Uso en componente
function CreatePIMForm() {
  const { mutate, isPending } = useCreatePIM();

  const handleSubmit = (data) => {
    mutate(data);
  };
}
```

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

## Estado Actual vs Ideal

| Aspecto | Estado Actual | Estado Ideal |
|---------|---------------|--------------|
| Auth | Mock local | Supabase Auth |
| Datos PIMs | mockData.ts | React Query + Supabase |
| Datos OTs | workOrdersMock.ts | React Query + Supabase |
| Persistencia | Ninguna (se pierde al refrescar) | Local storage / Supabase |

---

## Hooks Personalizados

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
2. **React Query**: Para datos del servidor (Supabase)
3. **useState**: Para UI local (modals, filtros, selección)
4. **Evitar prop drilling**: Usar Context cuando datos se necesitan en múltiples niveles
5. **Invalidar cache**: Después de mutaciones para mantener datos actualizados
