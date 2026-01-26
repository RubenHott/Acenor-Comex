
# Plan: Eliminacion Completa de Datos Hardcodeados

## Resumen del Analisis

Se realizo una revision exhaustiva del codigo y se encontraron **multiples instancias de datos hardcodeados** que deben ser reemplazados por datos reales de Supabase.

---

## Hallazgos Detallados

### 1. Archivos de Datos Mock (a eliminar)

| Archivo | Contenido | Estado |
|---------|-----------|--------|
| `src/data/mockData.ts` | mockProducts, mockSuppliers, mockPIMs, mockRequirements, mockNotifications, mockDashboardStats | **OBSOLETO** - Ya no se usa para productos, proveedores, PIMs, requerimientos |
| `src/data/workOrdersMock.ts` | mockWorkOrders | **OBSOLETO** - La tabla work_orders ya existe en Supabase |

---

### 2. Componentes con Datos Hardcodeados

#### 2.1 `src/components/layout/Header.tsx` (Lineas 12, 21, 60)
**Problema**: Usa `mockNotifications` directamente
```typescript
import { mockNotifications } from '@/data/mockData';
const unreadCount = mockNotifications.filter(n => !n.leido).length;
{mockNotifications.slice(0, 5).map(...)}
```
**Solucion**: Crear tabla `notificaciones` en Supabase y hook `useNotifications`

---

#### 2.2 `src/contexts/AuthContext.tsx` (Lineas 15-23, 37)
**Problema**: Autenticacion completamente simulada
```typescript
const mockUser: User = {
  id: 'user-1',
  email: 'admin@planta.com',
  name: 'Carlos Mendoza',
  role: 'admin',
  modules: [...],
};
```
**Solucion**: Implementar Supabase Auth (fuera del alcance de este plan, pero documentado)

---

#### 2.3 `src/pages/DashboardPage.tsx` (Lineas 19-32, 215-232)
**Problema #1**: Graficos con datos estaticos
```typescript
const statusDistribution = [
  { name: 'En Negociación', value: 3, color: '...' },
  { name: 'Contrato', value: 2, color: '...' },
  // ...
];

const monthlyData = [
  { month: 'Oct', pims: 8, toneladas: 320 },
  // ...
];
```
**Solucion**: Calcular desde datos reales de PIMs usando el hook `usePIMs`

**Problema #2**: SLA Global hardcodeado
```typescript
<SLAIndicator label="Negociación" diasEstimados={5} diasReales={4} alerta="verde" />
<SLAIndicator label="Contratos" diasEstimados={3} diasReales={3} alerta="amarillo" />
```
**Solucion**: Usar tabla `sla_data` existente y calcular promedios

---

#### 2.4 `src/pages/PIMsPage.tsx` (Lineas 299-304)
**Problema**: Tab de SLA con valores estaticos
```typescript
<SLAIndicator label="Negociación" diasEstimados={5} diasReales={4} alerta="verde" />
<SLAIndicator label="Contrato" diasEstimados={3} diasReales={3} alerta="amarillo" />
```
**Solucion**: Obtener datos de `sla_data` para el PIM seleccionado

---

#### 2.5 `src/pages/RequirementsPage.tsx` (Linea 131)
**Problema**: Contador de PIMs generados hardcodeado
```typescript
<p className="text-2xl font-bold">5</p>
```
**Solucion**: Contar PIMs asociados al requerimiento seleccionado

---

#### 2.6 `src/pages/workOrders/CreateWorkOrderPage.tsx` (Lineas 28-32)
**Problema**: Guardado simulado (no persiste en base de datos)
```typescript
// Mock save
toast({
  title: 'Orden de trabajo creada',
  description: 'La OT se ha creado exitosamente.',
});
navigate('/work-orders/orders');
```
**Solucion**: Usar mutation `useCreateWorkOrder` existente

---

## Plan de Implementacion

### Fase 1: Crear Tabla de Notificaciones
1. Crear migracion SQL para tabla `notificaciones`
2. Crear hook `useNotifications` con React Query
3. Actualizar `Header.tsx` para usar datos reales

### Fase 2: Actualizar Dashboard COMEX
1. Calcular `statusDistribution` desde datos de PIMs
2. Calcular `monthlyData` agrupando PIMs por mes
3. Obtener SLA promedio desde tabla `sla_data`
4. Crear hook `usePIMSLAStats` para metricas

### Fase 3: Actualizar Pagina de PIMs
1. Crear hook `usePIMSLA(pimId)` para obtener SLA de un PIM
2. Reemplazar valores estaticos en tab SLA

### Fase 4: Actualizar Pagina de Requerimientos
1. Contar PIMs por requerimiento usando query
2. Actualizar tarjeta "PIMs Generados" con valor dinamico

### Fase 5: Actualizar Creacion de Work Orders
1. Conectar formulario con mutation `useCreateWorkOrder`
2. Generar codigo automatico (OT-YYYY-NNN)
3. Agregar manejo de errores

### Fase 6: Limpieza
1. Eliminar `src/data/mockData.ts`
2. Eliminar `src/data/workOrdersMock.ts`
3. Remover imports no usados
4. Actualizar documentacion

---

## Cambios en Base de Datos

### Nueva Tabla: `notificaciones`
```text
Columnas:
- id (text, PK)
- tipo (text): alerta_sla, contrato, embarque, sistema
- titulo (text)
- mensaje (text)
- destinatario_id (text)
- pim_id (text, nullable)
- leido (boolean, default false)
- prioridad (text): baja, media, alta, urgente
- fecha_creacion (timestamp)
- created_at, updated_at
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/layout/Header.tsx` | Reemplazar mockNotifications por useNotifications |
| `src/pages/DashboardPage.tsx` | Calcular graficos y SLA desde datos reales |
| `src/pages/PIMsPage.tsx` | Obtener SLA del PIM seleccionado |
| `src/pages/RequirementsPage.tsx` | Contar PIMs asociados dinamicamente |
| `src/pages/workOrders/CreateWorkOrderPage.tsx` | Usar mutation real |

## Archivos a Crear

| Archivo | Proposito |
|---------|-----------|
| `src/hooks/useNotifications.ts` | Hook para notificaciones |
| `src/hooks/useSLAData.ts` | Hook para datos de SLA |

## Archivos a Eliminar

| Archivo | Razon |
|---------|-------|
| `src/data/mockData.ts` | Datos obsoletos |
| `src/data/workOrdersMock.ts` | Datos obsoletos |

---

## Seccion Tecnica

### Hook useNotifications
```typescript
export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ['notificaciones', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('destinatario_id', userId)
        .order('fecha_creacion', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
```

### Calculo de Status Distribution
```typescript
const statusDistribution = useMemo(() => {
  if (!pims) return [];
  const counts = pims.reduce((acc, pim) => {
    acc[pim.estado] = (acc[pim.estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts).map(([name, value]) => ({
    name: statusLabels[name] || name,
    value,
    color: statusColors[name] || 'gray'
  }));
}, [pims]);
```

### Integracion CreateWorkOrder
```typescript
const createMutation = useCreateWorkOrder();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await createMutation.mutateAsync({
      codigo: generateCode(),
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      prioridad: formData.prioridad,
      tipo_trabajo: formData.tipoTrabajo,
      area: formData.area,
      solicitante: formData.solicitante,
      estado: 'pendiente',
      fecha_limite: calculateDueDate(formData.prioridad),
    });
    toast({ title: 'Orden creada exitosamente' });
    navigate('/work-orders/orders');
  } catch (error) {
    toast({ 
      title: 'Error al crear la orden', 
      variant: 'destructive' 
    });
  }
};
```

---

## Orden de Ejecucion

1. Crear tabla `notificaciones` (migracion SQL)
2. Crear hooks nuevos (`useNotifications`, `useSLAData`)
3. Actualizar `Header.tsx`
4. Actualizar `DashboardPage.tsx`
5. Actualizar `PIMsPage.tsx`
6. Actualizar `RequirementsPage.tsx`
7. Actualizar `CreateWorkOrderPage.tsx`
8. Eliminar archivos mock
9. Probar todas las paginas
10. Actualizar documentacion
