# Edge Functions

Funciones serverless ejecutadas en Deno para orquestar lógica de negocio compleja e integraciones externas.

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│  Edge Function  │────▶│   PostgreSQL    │
│  (React Query)  │     │     (Deno)      │     │ (SQL Functions) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  APIs Externas  │
                        │  (DHL, etc.)    │
                        └─────────────────┘
```

Las Edge Functions actúan como capa intermedia que:
- Orquesta múltiples llamadas a funciones SQL
- Consolida respuestas en un solo JSON
- Conecta con APIs externas (DHL Shipment Tracking)
- Actualiza la base de datos con información externa

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

[functions.dhl-tracking]
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
2. Calcula fecha límite con `fn_calculate_due_date(prioridad)`
3. Inserta en tabla `work_orders`

---

### dhl-tracking

Consulta la API de DHL Shipment Tracking para obtener el estado de un envío y actualiza el PIM correspondiente.

**Ubicación**: `supabase/functions/dhl-tracking/index.ts`

**Secretos requeridos**: `DHL_API_KEY` (desde [DHL Developer Portal](https://developer.dhl.com/))

**Invocación**:
```typescript
const { data, error } = await supabase.functions.invoke('dhl-tracking', {
  body: {
    trackingNumber: '1234567890',
    pimId: 'uuid-del-pim' // opcional
  }
});
```

**Respuesta**:
```typescript
{
  trackingNumber: string;
  status: string;           // Código de estado DHL
  statusDescription: string; // Descripción en texto
  shipment: object | null;   // Datos completos del envío
  events: Array<{            // Historial de eventos
    timestamp: string;
    location: object;
    description: string;
  }>;
}
```

**Lógica del servidor**:
1. Llama a `https://api-eu.dhl.com/track/shipments` con el tracking number
2. Si se proporciona `pimId`:
   - Actualiza `dhl_tracking_code`, `dhl_last_status`, `dhl_last_checked_at` en tabla `pims`
   - Registra actividad en `pim_activity_log`
3. Retorna datos del envío al frontend

**API de DHL utilizada**: [Shipment Tracking - Unified](https://developer.dhl.com/api-reference/shipment-tracking)

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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Tu lógica aquí
    const { data, error } = await supabase.rpc('mi_funcion_sql')
    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
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
| `DHL API 401` | API Key inválida o sin permisos | Verificar key en DHL Developer Portal |

---

## Cuándo Usar Edge Functions vs SQL Functions

| Escenario | Usar Edge Function | Usar SQL Function |
|-----------|-------------------|-------------------|
| Orquestar múltiples queries | ✅ | ❌ |
| Llamar APIs externas (DHL, etc.) | ✅ | ❌ |
| Cálculos pesados sobre datos | ❌ | ✅ |
| Triggers automáticos | ❌ | ✅ |
| Lógica de negocio simple | ❌ | ✅ |

---

*Última actualización: Febrero 2026*
