# Integración con API (Supabase)

## Configuración del Cliente

**Ubicación**: `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ykzeuukqhliuslycjcxc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## Tipos Auto-Generados

**Ubicación**: `src/integrations/supabase/types.ts`

```typescript
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type PIM = Tables<'pims'>;
type NewPIM = TablesInsert<'pims'>;
type UpdatePIM = TablesUpdate<'pims'>;
```

---

## Edge Functions

### Funciones Disponibles

| Función | Propósito | Método |
|---------|-----------|--------|
| `get-dashboard-stats` | Estadísticas consolidadas del dashboard COMEX | GET |
| `get-work-order-stats` | Estadísticas de órdenes de trabajo | GET |
| `create-work-order` | Crear nueva OT con código auto-generado | POST |
| `dhl-tracking` | Consultar estado de envío DHL y actualizar PIM | POST |

### Invocar Edge Functions

```typescript
// Stats
const { data, error } = await supabase.functions.invoke('get-dashboard-stats');

// Crear OT
const { data, error } = await supabase.functions.invoke('create-work-order', {
  body: { titulo, descripcion, area, tipo_trabajo, prioridad, solicitante }
});

// DHL Tracking
const { data, error } = await supabase.functions.invoke('dhl-tracking', {
  body: { trackingNumber: '1234567890', pimId: 'uuid-del-pim' }
});
```

---

## Funciones SQL (RPC)

| Función | Retorna | Descripción |
|---------|---------|-------------|
| `fn_pim_stats()` | TABLE | Estadísticas agregadas de PIMs |
| `fn_pim_status_distribution()` | TABLE | Distribución por estado |
| `fn_pim_monthly_trend(months_back)` | TABLE | Tendencia mensual |
| `fn_sla_global_stats()` | JSONB | Promedios SLA con alertas |
| `fn_work_order_stats()` | TABLE | Estadísticas de OTs |
| `fn_generate_work_order_code()` | TEXT | Código OT-YYYY-NNN |
| `fn_calculate_due_date(priority)` | TIMESTAMPTZ | Fecha límite según prioridad |
| `fn_requirement_pim_count(id)` | INTEGER | Cuenta PIMs por requerimiento |
| `fn_get_critical_pim()` | TABLE | PIM más crítico |

---

## Operaciones CRUD

### SELECT
```typescript
const { data } = await supabase.from('pims').select('*').eq('estado', 'en_produccion');
```

### INSERT
```typescript
const { data } = await supabase.from('pims').insert({ id: crypto.randomUUID(), ... }).select().single();
```

### UPDATE
```typescript
const { data } = await supabase.from('pims').update({ estado: 'contrato_validado' }).eq('id', pimId);
```

### DELETE
```typescript
const { error } = await supabase.from('pims').delete().eq('id', pimId);
```

---

## Resumen de Métodos de Acceso

| Método | Cuándo Usar | Ejemplo |
|--------|-------------|---------|
| `functions.invoke()` | Lógica compleja, APIs externas | Dashboard stats, DHL tracking |
| `rpc()` | Cálculos pesados en BD | Conteo de PIMs |
| `from().select()` | Queries simples | Lista de productos |
| `from().insert()` | Crear registros | Nuevo PIM, checklist items |
| Storage upload | Archivos | Documentos de PIM |

---

*Última actualización: Febrero 2026*
