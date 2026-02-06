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

---

### usePIMCreation

**Ubicación**: `src/hooks/usePIMCreation.ts`

**Propósito**: Crear un nuevo PIM con items y consumo de requerimiento.

**Operaciones**:
- `useCreatePIM()` — Mutation para crear PIM completo (PIM + items + consumo de requerimiento)

---

### usePIMItems

**Ubicación**: `src/hooks/usePIMItems.ts`

**Propósito**: Items de un PIM específico.

**Fuente de datos**: Supabase directo (`from('pim_items')`)

---

### usePIMDocuments

**Ubicación**: `src/hooks/usePIMDocuments.ts`

**Propósito**: Gestión de documentos de un PIM.

**Operaciones**:
- Query para listar documentos por PIM y etapa
- Mutation para subir documentos al Storage
- Mutation para eliminar documentos

---

### usePIMTracking

**Ubicación**: `src/hooks/usePIMTracking.ts`

**Propósito**: Sistema completo de seguimiento por etapas de un PIM.

**Queries**:
- `useTrackingStages(pimId)` — Etapas del PIM con su estado
- `useChecklistItems(pimId, stageKey?)` — Items de checklist (filtrados por etapa o todos)
- `useActivityLog(pimId)` — Timeline de actividad

**Mutations**:
- `useInitializeTracking()` — Inicializa etapas y checklist items para un PIM
- `useToggleChecklistItem()` — Marca/desmarca un item del checklist
- `useUpdateStageStatus()` — Cambia estado de una etapa (pendiente → en_progreso → completado)
- `useAddNote()` — Agrega nota al activity log
- `useSplitPIM()` — Divide un PIM en sub-PIMs

---

### useWorkOrders

**Ubicación**: `src/hooks/useWorkOrders.ts`

**Propósito**: Lista de órdenes de trabajo y operaciones.

**Fuente de datos**: Supabase directo + Edge Function

**Exports**:
- `useWorkOrders()` — Lista de OTs
- `useWorkOrderStats()` — Estadísticas via Edge Function
- `useCreateWorkOrder()` — Mutation para crear OT

---

### useProducts

**Ubicación**: `src/hooks/useProducts.ts`

**Propósito**: Catálogo de productos.

**Fuente de datos**: Supabase directo (`from('productos')`)

---

### useSuppliers

**Ubicación**: `src/hooks/useSuppliers.ts`

**Propósito**: Lista de proveedores.

**Fuente de datos**: Supabase directo (`from('proveedores')`)

---

### useRequirements

**Ubicación**: `src/hooks/useRequirements.ts`

**Propósito**: Requerimientos mensuales con conteo de PIMs.

**Fuente de datos**: Supabase directo + RPC (`fn_requirement_pim_count`)

---

### useCuadros

**Ubicación**: `src/hooks/useCuadros.ts`

**Propósito**: Cuadros de importación (agrupaciones de productos).

**Fuente de datos**: Supabase directo (`from('cuadros_importacion')`)

---

### useNotifications

**Ubicación**: `src/hooks/useNotifications.ts`

**Propósito**: Notificaciones del usuario.

**Fuente de datos**: Supabase directo (`from('notificaciones')`)

---

### useSLAData

**Ubicación**: `src/hooks/useSLAData.ts`

**Propósito**: Datos SLA crudos. **Preferir `useSLAStatsFromDashboard()`** para estadísticas.

**Fuente de datos**: Supabase directo (`from('sla_data')`)

---

## Tabla Resumen

| Hook | Propósito | Fuente | Cache |
|------|-----------|--------|-------|
| `useDashboardStats()` | Dashboard completo | Edge Function | 30s |
| `usePIMs()` | Lista PIMs | Supabase | 5min |
| `usePIMCreation()` | Crear PIM | Supabase (mutation) | - |
| `usePIMItems()` | Items de PIM | Supabase | 5min |
| `usePIMDocuments()` | Documentos de PIM | Supabase + Storage | 5min |
| `usePIMTracking()` | Seguimiento por etapas | Supabase | 5min |
| `useWorkOrders()` | Lista OTs | Supabase | 5min |
| `useWorkOrderStats()` | Stats OTs | Edge Function | 30s |
| `useProducts()` | Productos | Supabase | 5min |
| `useSuppliers()` | Proveedores | Supabase | 5min |
| `useRequirements()` | Requerimientos | Supabase + RPC | 5min |
| `useCuadros()` | Cuadros importación | Supabase | 5min |
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

*Última actualización: Febrero 2026*
