# Integración con API (Supabase)

## Configuración del Cliente

**Ubicación**: `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ykzeuukqhliuslycjcxc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
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

## Edge Functions

Las Edge Functions se ejecutan en Deno y orquestan lógica de negocio compleja.

### Invocar Edge Functions

```typescript
const { data, error } = await supabase.functions.invoke('get-dashboard-stats');
```

### Edge Functions Disponibles

| Función | Propósito | Método |
|---------|-----------|--------|
| `get-dashboard-stats` | Estadísticas consolidadas del dashboard COMEX | GET |
| `get-work-order-stats` | Estadísticas de órdenes de trabajo | GET |
| `create-work-order` | Crear nueva orden de trabajo con código auto-generado | POST |

### Ejemplo: Dashboard Stats

```typescript
import { useDashboardStats } from '@/hooks/useDashboardStats';

function Dashboard() {
  const { data, isLoading, error } = useDashboardStats();
  
  if (isLoading) return <Skeleton />;
  if (error) return <Alert>{error.message}</Alert>;
  
  return (
    <div>
      <StatCard title="PIMs Activos" value={data.pimStats.pimsActivos} />
    </div>
  );
}
```

### Ejemplo: Crear Orden de Trabajo

```typescript
import { useCreateWorkOrder } from '@/hooks/useWorkOrders';

function CreateOrderForm() {
  const { mutate, isPending } = useCreateWorkOrder();
  
  const handleSubmit = (formData) => {
    mutate(formData, {
      onSuccess: () => toast({ title: 'OT creada exitosamente' })
    });
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      {/* campos */}
      <Button disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear OT'}
      </Button>
    </Form>
  );
}
```

---

## Funciones SQL (RPC)

Las funciones SQL ejecutan cálculos pesados directamente en PostgreSQL.

### Invocar Funciones SQL

```typescript
const { data, error } = await supabase.rpc('fn_pim_stats');
```

### Funciones Disponibles

| Función | Retorna | Descripción |
|---------|---------|-------------|
| `fn_pim_stats()` | TABLE | Estadísticas agregadas de PIMs |
| `fn_pim_status_distribution()` | TABLE | Distribución por estado |
| `fn_pim_monthly_trend(months_back)` | TABLE | Tendencia mensual de PIMs |
| `fn_sla_global_stats()` | JSONB | Promedios SLA con alertas |
| `fn_work_order_stats()` | TABLE | Estadísticas de OTs |
| `fn_generate_work_order_code()` | TEXT | Genera código OT-YYYY-NNN |
| `fn_calculate_due_date(priority)` | TIMESTAMPTZ | Calcula fecha límite según prioridad |
| `fn_requirement_pim_count(id)` | INTEGER | Cuenta PIMs por requerimiento |
| `fn_get_critical_pim()` | TABLE | Obtiene el PIM más crítico |

### Ejemplo: Conteo de PIMs

```typescript
const { data, error } = await supabase.rpc('fn_requirement_pim_count', {
  requirement_id: 'req-123'
});

console.log(`PIMs asociados: ${data}`);
```

---

## Operaciones CRUD (Queries Directas)

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
    codigo: 'PIM-2026-001',
    descripcion: 'Nueva importación',
    estado: 'creado',
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

### Hook de Query (Ejemplo Real)

```typescript
// src/hooks/useDashboardStats.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-dashboard-stats');
      if (error) throw error;
      return data;
    },
    staleTime: 30000, // Cache 30 segundos
  });
}
```

### Hook de Mutation (Ejemplo Real)

```typescript
// src/hooks/useWorkOrders.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder) => {
      const { data, error } = await supabase.functions.invoke('create-work-order', {
        body: newOrder
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-order-stats'] });
    },
  });
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

## Resumen de Métodos de Acceso

| Método | Cuándo Usar | Ejemplo |
|--------|-------------|---------|
| `functions.invoke()` | Lógica compleja, orquestación | Dashboard stats |
| `rpc()` | Cálculos pesados en BD | Conteo de PIMs |
| `from().select()` | Queries simples | Lista de productos |
| `from().insert()` | Crear registros simples | Nuevo proveedor |

---

*Última actualización: Enero 2026*
