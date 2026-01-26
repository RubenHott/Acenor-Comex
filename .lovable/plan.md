
# Plan: Migración de Cálculos Frontend a Edge Functions y SQL

## Resumen Ejecutivo

Este plan convierte todos los cálculos que actualmente se ejecutan en el navegador (frontend) a funciones del servidor (Edge Functions) y reglas de base de datos (SQL). Esto mejora el rendimiento, la seguridad y la consistencia de los datos.

---

## Inventario de Cálculos Actuales en Frontend

### 1. Estadísticas de PIMs (`usePIMs.ts` - líneas 109-137)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| `pimsActivos` | Frontend | Cuenta PIMs donde estado no es 'cerrado' ni 'entregado' |
| `pimsPendientes` | Frontend | Cuenta PIMs en estados 'creado', 'en_negociacion', 'contrato_pendiente' |
| `montoTotalUSD` | Frontend | Suma de total_usd de todos los PIMs |
| `toneladasMes` | Frontend | Suma de total_toneladas de todos los PIMs |
| `alertasSLA` | Frontend | Valor hardcodeado (2) |

### 2. Estadísticas de SLA (`useSLAData.ts` - líneas 42-121)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| Promedio días negociación | Frontend | AVG de tiempo_negociacion_dias_reales |
| Promedio días contrato | Frontend | AVG de tiempo_contrato_dias_reales |
| Promedio días tránsito | Frontend | AVG de tiempo_transito_dias_reales |
| Promedio días producción | Frontend | AVG de tiempo_produccion_dias_reales |
| Promedio días aduana | Frontend | AVG de tiempo_aduana_dias_reales |
| Cálculo de alerta | Frontend | Determina verde/amarillo/rojo según días reales vs estimados |

### 3. Distribución por Estado (`DashboardPage.tsx` - líneas 51-64)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| `statusDistribution` | Frontend | Cuenta PIMs agrupados por estado |

### 4. Tendencia Mensual (`DashboardPage.tsx` - líneas 67-92)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| `monthlyData` | Frontend | Agrupa PIMs por mes con conteo y suma de toneladas |

### 5. PIM Crítico (`DashboardPage.tsx` - líneas 104-106)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| `criticalPIM` | Frontend | Encuentra primer PIM en estado crítico |

### 6. Estadísticas de Work Orders (`useWorkOrders.ts` - líneas 90-108)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| `total` | Frontend | Total de órdenes |
| `pendientes` | Frontend | Órdenes en estado 'pendiente' |
| `enProgreso` | Frontend | Órdenes en estado 'en_progreso' |
| `completadas` | Frontend | Órdenes en estado 'completada' |
| `urgentes` | Frontend | Órdenes urgentes no completadas |

### 7. Conteo de PIMs por Requerimiento (`RequirementsPage.tsx` - líneas 51-52)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| `countPIMsForRequirement` | Frontend | Cuenta PIMs asociados a un requerimiento |

### 8. Totales de Requerimientos (`RequirementsPage.tsx` - líneas 76-77)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| `totalToneladas` | Frontend | Suma de toneladas de todos los requerimientos |
| `totalUSD` | Frontend | Suma de USD de todos los requerimientos |

### 9. Generación de Código y Fecha (`CreateWorkOrderPage.tsx` - líneas 14-32)

| Cálculo | Ubicación | Descripción |
|---------|-----------|-------------|
| `generateWorkOrderCode` | Frontend | Genera código OT-YYYY-NNN |
| `calculateDueDate` | Frontend | Calcula fecha límite según prioridad |

---

## Arquitectura Propuesta

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│   React Components → React Query Hooks → Edge Functions          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTIONS                              │
│   ┌──────────────────┐  ┌──────────────────┐                    │
│   │  get-dashboard   │  │  get-pim-stats   │                    │
│   │  -stats          │  │                  │                    │
│   └────────┬─────────┘  └────────┬─────────┘                    │
│            │                     │                               │
│   ┌────────┴─────────┐  ┌───────┴──────────┐                    │
│   │ get-work-order   │  │  get-sla-stats   │                    │
│   │ -stats           │  │                  │                    │
│   └────────┬─────────┘  └────────┬─────────┘                    │
│            │                     │                               │
│   ┌────────┴─────────────────────┴─────────┐                    │
│   │        create-work-order                │                    │
│   └────────────────────┬────────────────────┘                   │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (SQL)                              │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                  FUNCIONES SQL                           │   │
│   │                                                          │   │
│   │  fn_pim_stats()           → Estadísticas de PIMs         │   │
│   │  fn_pim_status_distribution() → Distribución por estado  │   │
│   │  fn_pim_monthly_trend()   → Tendencia mensual            │   │
│   │  fn_sla_global_stats()    → Promedios SLA globales       │   │
│   │  fn_work_order_stats()    → Estadísticas de OTs          │   │
│   │  fn_requirement_summary() → Totales de requerimientos    │   │
│   │  fn_generate_wo_code()    → Genera código de OT          │   │
│   │  fn_calculate_due_date()  → Calcula fecha límite         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   TRIGGERS                               │   │
│   │                                                          │   │
│   │  trg_auto_calculate_sla_alert → Auto-calcula alertas SLA │   │
│   │  trg_update_requirement_totals → Actualiza totales req   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    VIEWS                                 │   │
│   │                                                          │   │
│   │  v_pim_dashboard      → Vista consolidada para dashboard │   │
│   │  v_work_order_summary → Vista resumida de OTs            │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Plan de Implementación

### Fase 1: Funciones SQL para Estadísticas

Crear funciones SQL que ejecutan los cálculos directamente en la base de datos.

#### 1.1 Función: Estadísticas de PIMs
```sql
CREATE OR REPLACE FUNCTION fn_pim_stats()
RETURNS TABLE (
  total_pims INTEGER,
  pims_activos INTEGER,
  pims_pendientes INTEGER,
  alertas_sla INTEGER,
  monto_total_usd NUMERIC,
  toneladas_mes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_pims,
    COUNT(*) FILTER (WHERE estado NOT IN ('cerrado', 'entregado'))::INTEGER as pims_activos,
    COUNT(*) FILTER (WHERE estado IN ('creado', 'en_negociacion', 'contrato_pendiente'))::INTEGER as pims_pendientes,
    (SELECT COUNT(*) FROM sla_data WHERE tiempo_total_alerta IN ('amarillo', 'rojo'))::INTEGER as alertas_sla,
    COALESCE(SUM(total_usd), 0) as monto_total_usd,
    COALESCE(SUM(total_toneladas), 0) as toneladas_mes
  FROM pims;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.2 Función: Distribución por Estado
```sql
CREATE OR REPLACE FUNCTION fn_pim_status_distribution()
RETURNS TABLE (
  estado TEXT,
  cantidad INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.estado, COUNT(*)::INTEGER as cantidad
  FROM pims p
  GROUP BY p.estado
  ORDER BY cantidad DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.3 Función: Tendencia Mensual
```sql
CREATE OR REPLACE FUNCTION fn_pim_monthly_trend(months_back INTEGER DEFAULT 4)
RETURNS TABLE (
  mes TEXT,
  anio INTEGER,
  total_pims INTEGER,
  total_toneladas NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(fecha_creacion, 'Mon') as mes,
    EXTRACT(YEAR FROM fecha_creacion)::INTEGER as anio,
    COUNT(*)::INTEGER as total_pims,
    COALESCE(SUM(total_toneladas), 0) as total_toneladas
  FROM pims
  WHERE fecha_creacion >= (CURRENT_DATE - (months_back || ' months')::INTERVAL)
  GROUP BY TO_CHAR(fecha_creacion, 'Mon'), TO_CHAR(fecha_creacion, 'YYYY-MM'), EXTRACT(YEAR FROM fecha_creacion)
  ORDER BY TO_CHAR(fecha_creacion, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.4 Función: Estadísticas SLA Globales
```sql
CREATE OR REPLACE FUNCTION fn_sla_global_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'negociacion', jsonb_build_object(
      'estimados', ROUND(AVG(tiempo_negociacion_dias_estimados)),
      'reales', ROUND(AVG(tiempo_negociacion_dias_reales)),
      'alerta', CASE 
        WHEN AVG(tiempo_negociacion_dias_reales) IS NULL THEN 'verde'
        WHEN AVG(tiempo_negociacion_dias_reales) <= AVG(tiempo_negociacion_dias_estimados) THEN 'verde'
        WHEN AVG(tiempo_negociacion_dias_reales) <= AVG(tiempo_negociacion_dias_estimados) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'contrato', jsonb_build_object(
      'estimados', ROUND(AVG(tiempo_contrato_dias_estimados)),
      'reales', ROUND(AVG(tiempo_contrato_dias_reales)),
      'alerta', CASE 
        WHEN AVG(tiempo_contrato_dias_reales) IS NULL THEN 'verde'
        WHEN AVG(tiempo_contrato_dias_reales) <= AVG(tiempo_contrato_dias_estimados) THEN 'verde'
        WHEN AVG(tiempo_contrato_dias_reales) <= AVG(tiempo_contrato_dias_estimados) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'transito', jsonb_build_object(
      'estimados', ROUND(AVG(tiempo_transito_dias_estimados)),
      'reales', ROUND(AVG(tiempo_transito_dias_reales)),
      'alerta', CASE 
        WHEN AVG(tiempo_transito_dias_reales) IS NULL THEN 'verde'
        WHEN AVG(tiempo_transito_dias_reales) <= AVG(tiempo_transito_dias_estimados) THEN 'verde'
        WHEN AVG(tiempo_transito_dias_reales) <= AVG(tiempo_transito_dias_estimados) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'produccion', jsonb_build_object(
      'estimados', ROUND(AVG(tiempo_produccion_dias_estimados)),
      'reales', ROUND(AVG(tiempo_produccion_dias_reales)),
      'alerta', CASE 
        WHEN AVG(tiempo_produccion_dias_reales) IS NULL THEN 'verde'
        WHEN AVG(tiempo_produccion_dias_reales) <= AVG(tiempo_produccion_dias_estimados) THEN 'verde'
        WHEN AVG(tiempo_produccion_dias_reales) <= AVG(tiempo_produccion_dias_estimados) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'aduana', jsonb_build_object(
      'estimados', ROUND(AVG(tiempo_aduana_dias_estimados)),
      'reales', ROUND(AVG(tiempo_aduana_dias_reales)),
      'alerta', CASE 
        WHEN AVG(tiempo_aduana_dias_reales) IS NULL THEN 'verde'
        WHEN AVG(tiempo_aduana_dias_reales) <= AVG(tiempo_aduana_dias_estimados) THEN 'verde'
        WHEN AVG(tiempo_aduana_dias_reales) <= AVG(tiempo_aduana_dias_estimados) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'total', jsonb_build_object(
      'estimados', ROUND(AVG(tiempo_total_dias_estimados)),
      'reales', ROUND(AVG(tiempo_total_dias_reales)),
      'alerta', CASE 
        WHEN AVG(tiempo_total_dias_reales) IS NULL THEN 'verde'
        WHEN AVG(tiempo_total_dias_reales) <= AVG(tiempo_total_dias_estimados) THEN 'verde'
        WHEN AVG(tiempo_total_dias_reales) <= AVG(tiempo_total_dias_estimados) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    )
  ) INTO result
  FROM sla_data;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.5 Función: Estadísticas de Work Orders
```sql
CREATE OR REPLACE FUNCTION fn_work_order_stats()
RETURNS TABLE (
  total INTEGER,
  pendientes INTEGER,
  en_progreso INTEGER,
  completadas INTEGER,
  urgentes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE estado = 'pendiente')::INTEGER as pendientes,
    COUNT(*) FILTER (WHERE estado = 'en_progreso')::INTEGER as en_progreso,
    COUNT(*) FILTER (WHERE estado = 'completada')::INTEGER as completadas,
    COUNT(*) FILTER (WHERE prioridad = 'urgente' AND estado != 'completada')::INTEGER as urgentes
  FROM work_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.6 Función: Generar Código de Work Order
```sql
CREATE OR REPLACE FUNCTION fn_generate_work_order_code()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_sequence INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN codigo ~ ('^OT-' || current_year || '-[0-9]+$')
      THEN CAST(SUBSTRING(codigo FROM 'OT-[0-9]+-([0-9]+)$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 INTO next_sequence
  FROM work_orders;
  
  RETURN 'OT-' || current_year || '-' || LPAD(next_sequence::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.7 Función: Calcular Fecha Límite
```sql
CREATE OR REPLACE FUNCTION fn_calculate_due_date(priority TEXT)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  days_to_add INTEGER;
BEGIN
  days_to_add := CASE priority
    WHEN 'urgente' THEN 1
    WHEN 'alta' THEN 3
    WHEN 'media' THEN 7
    WHEN 'baja' THEN 14
    ELSE 7
  END;
  
  RETURN NOW() + (days_to_add || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.8 Función: Resumen de Requerimientos
```sql
CREATE OR REPLACE FUNCTION fn_requirement_pim_count(requirement_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM pims WHERE requerimiento_id = requirement_id)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Fase 2: Edge Functions

Crear edge functions que invocan las funciones SQL y retornan JSON.

#### 2.1 Edge Function: `get-dashboard-stats`

Consolidar todas las estadísticas del dashboard en una sola llamada.

Archivo: `supabase/functions/get-dashboard-stats/index.ts`

```typescript
// Devuelve:
// - pimStats (de fn_pim_stats)
// - statusDistribution (de fn_pim_status_distribution)
// - monthlyTrend (de fn_pim_monthly_trend)
// - slaStats (de fn_sla_global_stats)
// - criticalPIM (primer PIM en estado crítico)
```

#### 2.2 Edge Function: `get-work-order-stats`

Archivo: `supabase/functions/get-work-order-stats/index.ts`

```typescript
// Devuelve:
// - total, pendientes, enProgreso, completadas, urgentes
```

#### 2.3 Edge Function: `create-work-order`

Archivo: `supabase/functions/create-work-order/index.ts`

```typescript
// Recibe: titulo, descripcion, prioridad, tipo_trabajo, area, solicitante
// Genera: codigo (usando fn_generate_work_order_code)
// Calcula: fecha_limite (usando fn_calculate_due_date)
// Inserta la orden y retorna el resultado
```

---

### Fase 3: Triggers para Cálculos Automáticos

#### 3.1 Trigger: Auto-calcular Alertas SLA

```sql
CREATE OR REPLACE FUNCTION trg_calculate_sla_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular alerta de negociación
  NEW.tiempo_negociacion_alerta := CASE
    WHEN NEW.tiempo_negociacion_dias_reales IS NULL THEN 'verde'
    WHEN NEW.tiempo_negociacion_dias_reales <= NEW.tiempo_negociacion_dias_estimados THEN 'verde'
    WHEN NEW.tiempo_negociacion_dias_reales <= NEW.tiempo_negociacion_dias_estimados * 1.2 THEN 'amarillo'
    ELSE 'rojo'
  END;
  
  -- (Repetir para contrato, producción, tránsito, aduana, total)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sla_auto_alerts
  BEFORE INSERT OR UPDATE ON sla_data
  FOR EACH ROW
  EXECUTE FUNCTION trg_calculate_sla_alerts();
```

---

### Fase 4: Actualizar Hooks del Frontend

Modificar los hooks para llamar a las edge functions en lugar de calcular localmente.

| Hook Actual | Cambio |
|-------------|--------|
| `usePIMStats()` | Llamar a `get-dashboard-stats` edge function |
| `useSLAStats()` | Usar datos de `get-dashboard-stats` |
| `useWorkOrderStats()` | Llamar a `get-work-order-stats` edge function |
| `useCreateWorkOrder()` | Llamar a `create-work-order` edge function |

---

## Resumen de Archivos a Crear/Modificar

### Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/xxx_add_sql_functions.sql` | Todas las funciones SQL |
| `supabase/functions/get-dashboard-stats/index.ts` | Edge function dashboard |
| `supabase/functions/get-work-order-stats/index.ts` | Edge function work orders |
| `supabase/functions/create-work-order/index.ts` | Edge function crear OT |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/usePIMs.ts` | Reemplazar `usePIMStats` para usar edge function |
| `src/hooks/useSLAData.ts` | Simplificar `useSLAStats` |
| `src/hooks/useWorkOrders.ts` | Reemplazar stats y create |
| `src/pages/DashboardPage.tsx` | Remover cálculos useMemo |
| `src/pages/RequirementsPage.tsx` | Usar función SQL para conteo |
| `supabase/config.toml` | Agregar configuración de edge functions |

---

## Beneficios de Esta Migración

1. **Rendimiento**: Los cálculos se ejecutan en el servidor, no en el navegador
2. **Consistencia**: Una sola fuente de verdad para todos los cálculos
3. **Seguridad**: La lógica de negocio está protegida en el backend
4. **Escalabilidad**: Los cálculos SQL son más eficientes que JavaScript
5. **Mantenibilidad**: Lógica centralizada y fácil de modificar
6. **Menos datos transferidos**: El frontend solo recibe los resultados

---

## Orden de Ejecución

1. Crear migración SQL con todas las funciones
2. Crear edge function `get-dashboard-stats`
3. Crear edge function `get-work-order-stats`
4. Crear edge function `create-work-order`
5. Actualizar `supabase/config.toml`
6. Actualizar hooks del frontend
7. Actualizar componentes para usar nuevos hooks
8. Probar todas las funcionalidades
9. Eliminar código de cálculo obsoleto del frontend
