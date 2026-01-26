# React Query Hooks

El sistema utiliza React Query para el manejo de estado del servidor. Todos los hooks están en `src/hooks/`.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Components                            │
│                                                                 │
│  const { data, isLoading } = useDashboardStats();               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Query Hooks                           │
│                                                                 │
│  useDashboardStats → useQuery({ queryFn: invoke('...') })       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                  ┌─────────────┴─────────────┐
                  ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │  Edge Functions │         │ Supabase Direct │
        │  (functions)    │         │  (from/rpc)     │
        └─────────────────┘         └─────────────────┘
```

---

## Hooks Disponibles

### useDashboardStats

**Ubicación**: `src/hooks/useDashboardStats.ts`

**Propósito**: Estadísticas consolidadas del dashboard COMEX.

**Fuente de datos**: Edge Function `get-dashboard-stats`

```typescript
import { useDashboardStats } from '@/hooks/useDashboardStats';

function Dashboard() {
  const { data, isLoading, error } = useDashboardStats();
  
  if (isLoading) return <Skeleton />;
  if (error) return <Alert>{error.message}</Alert>;
  
  return (
    <div>
      <StatCard value={data.pimStats.totalPIMs} />
      <Chart data={data.statusDistribution} />
    </div>
  );
}
```

**Hooks derivados**:
- `usePIMStatsFromDashboard()` - Solo estadísticas de PIMs
- `useStatusDistribution()` - Solo distribución por estado
- `useMonthlyTrend()` - Solo tendencia mensual
- `useSLAStatsFromDashboard()` - Solo estadísticas SLA
- `useCriticalPIM()` - Solo PIM crítico

---

### usePIMs

**Ubicación**: `src/hooks/usePIMs.ts`

**Propósito**: Lista de todos los PIMs con sus relaciones.

**Fuente de datos**: Supabase directo (`from('pims')`)

```typescript
import { usePIMs } from '@/hooks/usePIMs';

function PIMsList() {
  const { data: pims, isLoading } = usePIMs();
  
  return (
    <Table>
      {pims?.map(pim => (
        <TableRow key={pim.id}>
          <TableCell>{pim.codigo}</TableCell>
          <TableCell>{pim.descripcion}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

---

### useWorkOrders

**Ubicación**: `src/hooks/useWorkOrders.ts`

**Propósito**: Lista de órdenes de trabajo y estadísticas.

**Fuente de datos**: Supabase directo + Edge Function

```typescript
import { useWorkOrders, useWorkOrderStats, useCreateWorkOrder } from '@/hooks/useWorkOrders';

function WorkOrdersPage() {
  const { data: orders, isLoading } = useWorkOrders();
  const { data: stats } = useWorkOrderStats();
  const createMutation = useCreateWorkOrder();
  
  const handleCreate = (data) => {
    createMutation.mutate(data, {
      onSuccess: () => toast({ title: 'OT creada' })
    });
  };
  
  return (
    <div>
      <StatsCards stats={stats} />
      <OrdersList orders={orders} />
      <CreateForm onSubmit={handleCreate} />
    </div>
  );
}
```

---

### useProducts

**Ubicación**: `src/hooks/useProducts.ts`

**Propósito**: Catálogo de productos.

**Fuente de datos**: Supabase directo (`from('productos')`)

```typescript
import { useProducts } from '@/hooks/useProducts';

function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  // ...
}
```

---

### useSuppliers

**Ubicación**: `src/hooks/useSuppliers.ts`

**Propósito**: Lista de proveedores.

**Fuente de datos**: Supabase directo (`from('proveedores')`)

```typescript
import { useSuppliers } from '@/hooks/useSuppliers';

function SuppliersPage() {
  const { data: suppliers, isLoading } = useSuppliers();
  // ...
}
```

---

### useRequirements

**Ubicación**: `src/hooks/useRequirements.ts`

**Propósito**: Requerimientos mensuales con conteo de PIMs.

**Fuente de datos**: Supabase directo + RPC (`fn_requirement_pim_count`)

```typescript
import { useRequirements } from '@/hooks/useRequirements';

function RequirementsPage() {
  const { data: requirements, isLoading } = useRequirements();
  // ...
}
```

---

### useNotifications

**Ubicación**: `src/hooks/useNotifications.ts`

**Propósito**: Notificaciones del usuario.

**Fuente de datos**: Supabase directo (`from('notificaciones')`)

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function NotificationsMenu() {
  const { data: notifications, isLoading } = useNotifications();
  // ...
}
```

---

### useSLAData (Deprecado)

**Ubicación**: `src/hooks/useSLAData.ts`

**Propósito**: Datos SLA crudos. **Preferir `useSLAStatsFromDashboard()`** para estadísticas.

**Fuente de datos**: Supabase directo (`from('sla_data')`)

---

## Tabla Resumen

| Hook | Propósito | Fuente | Cache |
|------|-----------|--------|-------|
| `useDashboardStats()` | Dashboard completo | Edge Function | 30s |
| `usePIMs()` | Lista PIMs | Supabase | 5min |
| `useWorkOrders()` | Lista OTs | Supabase | 5min |
| `useWorkOrderStats()` | Stats OTs | Edge Function | 30s |
| `useProducts()` | Productos | Supabase | 5min |
| `useSuppliers()` | Proveedores | Supabase | 5min |
| `useRequirements()` | Requerimientos | Supabase + RPC | 5min |
| `useNotifications()` | Notificaciones | Supabase | 1min |
| `useSLAData()` | SLA crudo | Supabase | 5min |

---

## Patrones de Uso

### Invalidación de Cache

Después de una mutación, invalidar el cache para refrescar datos:

```typescript
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (data) => { /* ... */ },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['pims'] });
  },
});
```

### Loading States

```typescript
const { data, isLoading, isPending, isFetching } = useQuery({...});

// isLoading: true en primera carga
// isFetching: true cuando refetching en background
// isPending: true mientras no hay datos
```

### Error Handling

```typescript
const { data, error, isError } = useQuery({...});

if (isError) {
  return <Alert variant="destructive">{error.message}</Alert>;
}
```

---

*Última actualización: Enero 2026*
