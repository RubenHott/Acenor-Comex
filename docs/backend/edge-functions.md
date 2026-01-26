# Edge Functions

Funciones serverless ejecutadas en Deno para orquestar lógica de negocio compleja.

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│  Edge Function  │────▶│   PostgreSQL    │
│  (React Query)  │     │     (Deno)      │     │ (SQL Functions) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

Las Edge Functions actúan como capa intermedia que:
- Orquesta múltiples llamadas a funciones SQL
- Consolida respuestas en un solo JSON
- Puede conectar con APIs externas (Stripe, OpenAI, etc.)

## Configuración

**Archivo**: `supabase/config.toml`

```toml
project_id = "ykzeuukqhliuslycjcxc"

[functions.get-dashboard-stats]
verify_jwt = false

[functions.get-work-order-stats]
verify_jwt = false

[functions.create-work-order]
verify_jwt = false
```

> **Nota**: `verify_jwt = false` permite acceso público. En producción con autenticación real, cambiar a `true`.

---

## Funciones Disponibles

### get-dashboard-stats

Consolida todas las estadísticas del dashboard COMEX en una sola llamada.

**Ubicación**: `supabase/functions/get-dashboard-stats/index.ts`

**Invocación**:
```typescript
const { data, error } = await supabase.functions.invoke('get-dashboard-stats');
```

**Respuesta**:
```typescript
interface DashboardStats {
  pimStats: {
    totalPIMs: number;
    pimsActivos: number;
    pimsPendientes: number;
    alertasSLA: number;
    montoTotalUSD: number;
    toneladasMes: number;
  };
  statusDistribution: Array<{
    estado: string;
    cantidad: number;
  }>;
  monthlyTrend: Array<{
    mes: string;
    anio: number;
    mes_orden: string;
    total_pims: number;
    total_toneladas: number;
  }>;
  slaStats: {
    negociacion: { estimados: number; reales: number | null; alerta: string };
    contrato: { estimados: number; reales: number | null; alerta: string };
    transito: { estimados: number; reales: number | null; alerta: string };
    produccion: { estimados: number; reales: number | null; alerta: string };
    aduana: { estimados: number; reales: number | null; alerta: string };
    total: { estimados: number; reales: number | null; alerta: string };
  };
  criticalPim: {
    id: string;
    codigo: string;
    descripcion: string;
    estado: string;
  } | null;
}
```

**Funciones SQL que invoca**:
- `fn_pim_stats()`
- `fn_pim_status_distribution()`
- `fn_pim_monthly_trend()`
- `fn_sla_global_stats()`
- `fn_get_critical_pim()`

---

### get-work-order-stats

Obtiene estadísticas de órdenes de trabajo.

**Ubicación**: `supabase/functions/get-work-order-stats/index.ts`

**Invocación**:
```typescript
const { data, error } = await supabase.functions.invoke('get-work-order-stats');
```

**Respuesta**:
```typescript
interface WorkOrderStats {
  total: number;
  pendientes: number;
  en_progreso: number;
  completadas: number;
  urgentes: number;
}
```

**Funciones SQL que invoca**:
- `fn_work_order_stats()`

---

### create-work-order

Crea una nueva orden de trabajo con código auto-generado y fecha límite calculada.

**Ubicación**: `supabase/functions/create-work-order/index.ts`

**Invocación**:
```typescript
const { data, error } = await supabase.functions.invoke('create-work-order', {
  body: {
    titulo: 'Mantenimiento preventivo',
    descripcion: 'Revisar equipos de producción',
    area: 'Producción',
    tipo_trabajo: 'preventivo',
    prioridad: 'alta',
    solicitante: 'Juan Pérez'
  }
});
```

**Lógica del servidor**:
1. Genera código automático con `fn_generate_work_order_code()` → `OT-2026-001`
2. Calcula fecha límite con `fn_calculate_due_date(prioridad)`:
   - Crítica: +1 día
   - Alta: +3 días
   - Media: +7 días
   - Baja: +14 días
3. Inserta en tabla `work_orders`

---

## Desarrollo

### Estructura de una Edge Function

```
supabase/functions/
└── mi-funcion/
    └── index.ts
```

### Template Básico

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Tu lógica aquí
    const { data, error } = await supabase.rpc('mi_funcion_sql');

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

---

## Despliegue

Las Edge Functions se despliegan automáticamente al hacer push en Lovable. No se requiere configuración adicional.

---

## Debugging

### Ver Logs

1. Ir a [Supabase Dashboard → Functions](https://supabase.com/dashboard/project/ykzeuukqhliuslycjcxc/functions)
2. Seleccionar la función
3. Click en "Logs"

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `FunctionsHttpError` | Error HTTP de la función | Ver logs para detalles |
| `FunctionsRelayError` | Problema de red | Reintentar |
| `FunctionsFetchError` | Función no encontrada | Verificar nombre y despliegue |

---

## Cuándo Usar Edge Functions vs SQL Functions

| Escenario | Usar Edge Function | Usar SQL Function |
|-----------|-------------------|-------------------|
| Orquestar múltiples queries | ✅ | ❌ |
| Llamar APIs externas | ✅ | ❌ |
| Cálculos pesados sobre datos | ❌ | ✅ |
| Triggers automáticos | ❌ | ✅ |
| Lógica de negocio simple | ❌ | ✅ |

---

*Última actualización: Enero 2026*
