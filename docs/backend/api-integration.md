# Integración con API (Supabase)

## Configuración del Cliente

**Ubicación**: `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
```

## Variables de Entorno

```env
VITE_SUPABASE_PROJECT_ID="ykzeuukqhliuslycjcxc"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://ykzeuukqhliuslycjcxc.supabase.co"
```

## Tipos Auto-Generados

**Ubicación**: `src/integrations/supabase/types.ts`

Los tipos se generan automáticamente desde el esquema de Supabase:

```typescript
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Tipo para lectura
type PIM = Tables<'pims'>;

// Tipo para inserción
type NewPIM = TablesInsert<'pims'>;

// Tipo para actualización
type UpdatePIM = TablesUpdate<'pims'>;
```

---

## Operaciones CRUD

### SELECT (Lectura)

```typescript
// Obtener todos los registros
const { data, error } = await supabase
  .from('pims')
  .select('*');

// Con filtros
const { data, error } = await supabase
  .from('pims')
  .select('*')
  .eq('estado', 'en_produccion')
  .order('fecha_creacion', { ascending: false });

// Con relaciones (join)
const { data, error } = await supabase
  .from('pims')
  .select(`
    *,
    proveedor:proveedores(*),
    items:pim_items(*)
  `);

// Un solo registro
const { data, error } = await supabase
  .from('pims')
  .select('*')
  .eq('id', pimId)
  .single();
```

### INSERT (Creación)

```typescript
// Insertar uno
const { data, error } = await supabase
  .from('pims')
  .insert({
    id: crypto.randomUUID(),
    codigo: 'PIM-2025-001',
    descripcion: 'Nueva importación',
    estado: 'creado',
    // ... otros campos
  })
  .select()
  .single();

// Insertar múltiples
const { data, error } = await supabase
  .from('pim_items')
  .insert([
    { id: '1', pim_id: 'pim-1', ... },
    { id: '2', pim_id: 'pim-1', ... },
  ])
  .select();
```

### UPDATE (Actualización)

```typescript
const { data, error } = await supabase
  .from('pims')
  .update({ estado: 'contrato_validado' })
  .eq('id', pimId)
  .select()
  .single();
```

### DELETE (Eliminación)

```typescript
const { error } = await supabase
  .from('pims')
  .delete()
  .eq('id', pimId);
```

---

## Integración con React Query

### Configuración

```typescript
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});
```

### Hook de Query

```typescript
// src/hooks/usePIMs.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePIMs() {
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
  
  return (
    <Table>
      {pims.map(pim => (
        <TableRow key={pim.id}>
          <TableCell>{pim.codigo}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

### Hook de Mutation

```typescript
// src/hooks/useCreatePIM.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

export function useCreatePIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPIM: TablesInsert<'pims'>) => {
      const { data, error } = await supabase
        .from('pims')
        .insert(newPIM)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar cache para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['pims'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear PIM',
        description: error.message,
      });
    },
  });
}

// Uso en componente
function CreatePIMForm() {
  const { mutate, isPending } = useCreatePIM();

  const handleSubmit = (data) => {
    mutate({
      id: crypto.randomUUID(),
      ...data,
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* campos */}
      <Button disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear PIM'}
      </Button>
    </Form>
  );
}
```

---

## Manejo de Errores

```typescript
import { PostgrestError } from '@supabase/supabase-js';

async function fetchPIMs() {
  const { data, error } = await supabase
    .from('pims')
    .select('*');

  if (error) {
    // Error de Supabase
    if (error.code === 'PGRST116') {
      throw new Error('No se encontraron resultados');
    }
    if (error.code === '42501') {
      throw new Error('No tienes permisos para esta operación');
    }
    throw new Error(error.message);
  }

  return data;
}
```

---

## Real-time (Tiempo Real)

```typescript
// Suscribirse a cambios
const channel = supabase
  .channel('pims-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'pims' },
    (payload) => {
      console.log('Cambio detectado:', payload);
      // Actualizar UI
      queryClient.invalidateQueries({ queryKey: ['pims'] });
    }
  )
  .subscribe();

// Cancelar suscripción
useEffect(() => {
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Estado Actual vs Ideal

| Aspecto | Estado Actual | Estado Ideal |
|---------|---------------|--------------|
| Datos PIMs | `mockData.ts` | React Query + Supabase |
| Datos Productos | `mockData.ts` | React Query + Supabase |
| Datos Proveedores | `mockData.ts` | React Query + Supabase |
| Auth | Mock local | Supabase Auth |
| Real-time | No implementado | Supabase Channels |
| Cache | No hay | React Query |

---

## Próximos Pasos

1. **Crear hooks para cada entidad**
   - `usePIMs()`, `usePIM(id)`
   - `useProducts()`, `useProduct(id)`
   - `useSuppliers()`, `useSupplier(id)`
   - `useRequirements()`, `useRequirement(id)`

2. **Reemplazar datos mock**
   - Actualizar componentes para usar hooks
   - Mantener loading states
   - Manejar errores

3. **Implementar autenticación real**
   - Ver [Implementar Autenticación](../guides/implementing-auth.md)
