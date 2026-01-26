-- ============================================
-- FASE 1: FUNCIONES SQL PARA CÁLCULOS
-- ============================================

-- 1.1 Función: Estadísticas de PIMs
CREATE OR REPLACE FUNCTION public.fn_pim_stats()
RETURNS TABLE (
  total_pims INTEGER,
  pims_activos INTEGER,
  pims_pendientes INTEGER,
  alertas_sla INTEGER,
  monto_total_usd NUMERIC,
  toneladas_mes NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_pims,
    COUNT(*) FILTER (WHERE p.estado NOT IN ('cerrado', 'entregado'))::INTEGER as pims_activos,
    COUNT(*) FILTER (WHERE p.estado IN ('creado', 'en_negociacion', 'contrato_pendiente'))::INTEGER as pims_pendientes,
    COALESCE((SELECT COUNT(*) FROM sla_data WHERE tiempo_total_alerta IN ('amarillo', 'rojo'))::INTEGER, 0) as alertas_sla,
    COALESCE(SUM(p.total_usd), 0) as monto_total_usd,
    COALESCE(SUM(p.total_toneladas), 0) as toneladas_mes
  FROM pims p;
END;
$$;

-- 1.2 Función: Distribución por Estado
CREATE OR REPLACE FUNCTION public.fn_pim_status_distribution()
RETURNS TABLE (
  estado TEXT,
  cantidad INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.estado, COUNT(*)::INTEGER as cantidad
  FROM pims p
  GROUP BY p.estado
  ORDER BY cantidad DESC;
END;
$$;

-- 1.3 Función: Tendencia Mensual
CREATE OR REPLACE FUNCTION public.fn_pim_monthly_trend(months_back INTEGER DEFAULT 4)
RETURNS TABLE (
  mes TEXT,
  anio INTEGER,
  mes_orden TEXT,
  total_pims INTEGER,
  total_toneladas NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(p.fecha_creacion, 'Mon') as mes,
    EXTRACT(YEAR FROM p.fecha_creacion)::INTEGER as anio,
    TO_CHAR(p.fecha_creacion, 'YYYY-MM') as mes_orden,
    COUNT(*)::INTEGER as total_pims,
    COALESCE(SUM(p.total_toneladas), 0) as total_toneladas
  FROM pims p
  WHERE p.fecha_creacion >= (CURRENT_DATE - (months_back || ' months')::INTERVAL)
  GROUP BY TO_CHAR(p.fecha_creacion, 'Mon'), TO_CHAR(p.fecha_creacion, 'YYYY-MM'), EXTRACT(YEAR FROM p.fecha_creacion)
  ORDER BY TO_CHAR(p.fecha_creacion, 'YYYY-MM');
END;
$$;

-- 1.4 Función: Estadísticas SLA Globales
CREATE OR REPLACE FUNCTION public.fn_sla_global_stats()
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  neg_est NUMERIC;
  neg_real NUMERIC;
  cont_est NUMERIC;
  cont_real NUMERIC;
  trans_est NUMERIC;
  trans_real NUMERIC;
  prod_est NUMERIC;
  prod_real NUMERIC;
  aduana_est NUMERIC;
  aduana_real NUMERIC;
  total_est NUMERIC;
  total_real NUMERIC;
BEGIN
  SELECT 
    ROUND(AVG(tiempo_negociacion_dias_estimados)),
    ROUND(AVG(tiempo_negociacion_dias_reales)),
    ROUND(AVG(tiempo_contrato_dias_estimados)),
    ROUND(AVG(tiempo_contrato_dias_reales)),
    ROUND(AVG(tiempo_transito_dias_estimados)),
    ROUND(AVG(tiempo_transito_dias_reales)),
    ROUND(AVG(tiempo_produccion_dias_estimados)),
    ROUND(AVG(tiempo_produccion_dias_reales)),
    ROUND(AVG(tiempo_aduana_dias_estimados)),
    ROUND(AVG(tiempo_aduana_dias_reales)),
    ROUND(AVG(tiempo_total_dias_estimados)),
    ROUND(AVG(tiempo_total_dias_reales))
  INTO neg_est, neg_real, cont_est, cont_real, trans_est, trans_real, 
       prod_est, prod_real, aduana_est, aduana_real, total_est, total_real
  FROM sla_data;

  result := jsonb_build_object(
    'negociacion', jsonb_build_object(
      'estimados', COALESCE(neg_est, 5),
      'reales', neg_real,
      'alerta', CASE 
        WHEN neg_real IS NULL THEN 'verde'
        WHEN neg_real <= COALESCE(neg_est, 5) THEN 'verde'
        WHEN neg_real <= COALESCE(neg_est, 5) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'contrato', jsonb_build_object(
      'estimados', COALESCE(cont_est, 3),
      'reales', cont_real,
      'alerta', CASE 
        WHEN cont_real IS NULL THEN 'verde'
        WHEN cont_real <= COALESCE(cont_est, 3) THEN 'verde'
        WHEN cont_real <= COALESCE(cont_est, 3) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'transito', jsonb_build_object(
      'estimados', COALESCE(trans_est, 30),
      'reales', trans_real,
      'alerta', CASE 
        WHEN trans_real IS NULL THEN 'verde'
        WHEN trans_real <= COALESCE(trans_est, 30) THEN 'verde'
        WHEN trans_real <= COALESCE(trans_est, 30) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'produccion', jsonb_build_object(
      'estimados', COALESCE(prod_est, 15),
      'reales', prod_real,
      'alerta', CASE 
        WHEN prod_real IS NULL THEN 'verde'
        WHEN prod_real <= COALESCE(prod_est, 15) THEN 'verde'
        WHEN prod_real <= COALESCE(prod_est, 15) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'aduana', jsonb_build_object(
      'estimados', COALESCE(aduana_est, 5),
      'reales', aduana_real,
      'alerta', CASE 
        WHEN aduana_real IS NULL THEN 'verde'
        WHEN aduana_real <= COALESCE(aduana_est, 5) THEN 'verde'
        WHEN aduana_real <= COALESCE(aduana_est, 5) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    ),
    'total', jsonb_build_object(
      'estimados', COALESCE(total_est, 60),
      'reales', total_real,
      'alerta', CASE 
        WHEN total_real IS NULL THEN 'verde'
        WHEN total_real <= COALESCE(total_est, 60) THEN 'verde'
        WHEN total_real <= COALESCE(total_est, 60) * 1.2 THEN 'amarillo'
        ELSE 'rojo'
      END
    )
  );
  
  RETURN result;
END;
$$;

-- 1.5 Función: Estadísticas de Work Orders
CREATE OR REPLACE FUNCTION public.fn_work_order_stats()
RETURNS TABLE (
  total INTEGER,
  pendientes INTEGER,
  en_progreso INTEGER,
  completadas INTEGER,
  urgentes INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE w.estado = 'pendiente')::INTEGER as pendientes,
    COUNT(*) FILTER (WHERE w.estado = 'en_progreso')::INTEGER as en_progreso,
    COUNT(*) FILTER (WHERE w.estado = 'completada')::INTEGER as completadas,
    COUNT(*) FILTER (WHERE w.prioridad = 'urgente' AND w.estado != 'completada')::INTEGER as urgentes
  FROM work_orders w;
END;
$$;

-- 1.6 Función: Generar Código de Work Order
CREATE OR REPLACE FUNCTION public.fn_generate_work_order_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 1.7 Función: Calcular Fecha Límite según Prioridad
CREATE OR REPLACE FUNCTION public.fn_calculate_due_date(priority TEXT)
RETURNS TIMESTAMPTZ 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 1.8 Función: Conteo de PIMs por Requerimiento
CREATE OR REPLACE FUNCTION public.fn_requirement_pim_count(requirement_id TEXT)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM pims WHERE requerimiento_id = requirement_id)::INTEGER;
END;
$$;

-- 1.9 Función: Obtener PIM Crítico
CREATE OR REPLACE FUNCTION public.fn_get_critical_pim()
RETURNS TABLE (
  id TEXT,
  codigo TEXT,
  descripcion TEXT,
  estado TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.codigo, p.descripcion, p.estado
  FROM pims p
  WHERE p.estado IN ('en_negociacion', 'contrato_pendiente')
  ORDER BY p.fecha_creacion DESC
  LIMIT 1;
END;
$$;

-- ============================================
-- FASE 3: TRIGGER PARA AUTO-CALCULAR ALERTAS SLA
-- ============================================

CREATE OR REPLACE FUNCTION public.trg_calculate_sla_alerts()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calcular alerta de negociación
  NEW.tiempo_negociacion_alerta := CASE
    WHEN NEW.tiempo_negociacion_dias_reales IS NULL THEN 'verde'
    WHEN NEW.tiempo_negociacion_dias_reales <= NEW.tiempo_negociacion_dias_estimados THEN 'verde'
    WHEN NEW.tiempo_negociacion_dias_reales <= NEW.tiempo_negociacion_dias_estimados * 1.2 THEN 'amarillo'
    ELSE 'rojo'
  END;
  
  -- Calcular alerta de contrato
  NEW.tiempo_contrato_alerta := CASE
    WHEN NEW.tiempo_contrato_dias_reales IS NULL THEN 'verde'
    WHEN NEW.tiempo_contrato_dias_reales <= NEW.tiempo_contrato_dias_estimados THEN 'verde'
    WHEN NEW.tiempo_contrato_dias_reales <= NEW.tiempo_contrato_dias_estimados * 1.2 THEN 'amarillo'
    ELSE 'rojo'
  END;
  
  -- Calcular alerta de producción
  NEW.tiempo_produccion_alerta := CASE
    WHEN NEW.tiempo_produccion_dias_reales IS NULL THEN 'verde'
    WHEN NEW.tiempo_produccion_dias_reales <= NEW.tiempo_produccion_dias_estimados THEN 'verde'
    WHEN NEW.tiempo_produccion_dias_reales <= NEW.tiempo_produccion_dias_estimados * 1.2 THEN 'amarillo'
    ELSE 'rojo'
  END;
  
  -- Calcular alerta de tránsito
  NEW.tiempo_transito_alerta := CASE
    WHEN NEW.tiempo_transito_dias_reales IS NULL THEN 'verde'
    WHEN NEW.tiempo_transito_dias_reales <= NEW.tiempo_transito_dias_estimados THEN 'verde'
    WHEN NEW.tiempo_transito_dias_reales <= NEW.tiempo_transito_dias_estimados * 1.2 THEN 'amarillo'
    ELSE 'rojo'
  END;
  
  -- Calcular alerta de aduana
  NEW.tiempo_aduana_alerta := CASE
    WHEN NEW.tiempo_aduana_dias_reales IS NULL THEN 'verde'
    WHEN NEW.tiempo_aduana_dias_reales <= NEW.tiempo_aduana_dias_estimados THEN 'verde'
    WHEN NEW.tiempo_aduana_dias_reales <= NEW.tiempo_aduana_dias_estimados * 1.2 THEN 'amarillo'
    ELSE 'rojo'
  END;
  
  -- Calcular alerta total
  NEW.tiempo_total_alerta := CASE
    WHEN NEW.tiempo_total_dias_reales IS NULL THEN 'verde'
    WHEN NEW.tiempo_total_dias_reales <= NEW.tiempo_total_dias_estimados THEN 'verde'
    WHEN NEW.tiempo_total_dias_reales <= NEW.tiempo_total_dias_estimados * 1.2 THEN 'amarillo'
    ELSE 'rojo'
  END;
  
  -- Calcular alerta de apertura de pago
  NEW.tiempo_apertura_pago_alerta := CASE
    WHEN NEW.tiempo_apertura_pago_dias_reales IS NULL THEN 'verde'
    WHEN NEW.tiempo_apertura_pago_dias_reales <= NEW.tiempo_apertura_pago_dias_estimados THEN 'verde'
    WHEN NEW.tiempo_apertura_pago_dias_reales <= NEW.tiempo_apertura_pago_dias_estimados * 1.2 THEN 'amarillo'
    ELSE 'rojo'
  END;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_sla_auto_alerts ON sla_data;
CREATE TRIGGER trg_sla_auto_alerts
  BEFORE INSERT OR UPDATE ON sla_data
  FOR EACH ROW
  EXECUTE FUNCTION trg_calculate_sla_alerts();