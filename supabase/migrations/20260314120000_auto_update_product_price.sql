-- =============================================================================
-- Trigger: actualizar productos.ultimo_precio_usd con el promedio de las
-- últimas 3 importaciones cada vez que se inserta o edita un pim_item.
-- =============================================================================

-- Función: recalcular precio promedio de las últimas 3 importaciones
CREATE OR REPLACE FUNCTION update_product_avg_price()
RETURNS TRIGGER AS $$
DECLARE
  _producto_id text;
  _avg_price numeric;
  _last_date timestamptz;
BEGIN
  _producto_id := COALESCE(NEW.producto_id, OLD.producto_id);

  -- Promedio de las últimas 3 importaciones con precio > 0
  SELECT AVG(sub.precio_unitario_usd), MAX(sub.fecha)
  INTO _avg_price, _last_date
  FROM (
    SELECT pi.precio_unitario_usd, p.fecha_creacion AS fecha
    FROM pim_items pi
    JOIN pims p ON p.id = pi.pim_id
    WHERE pi.producto_id = _producto_id
      AND pi.precio_unitario_usd > 0
    ORDER BY p.fecha_creacion DESC
    LIMIT 3
  ) sub;

  -- Actualizar producto solo si hay datos
  IF _avg_price IS NOT NULL THEN
    UPDATE productos
    SET ultimo_precio_usd = ROUND(_avg_price, 2),
        ultima_fecha_importacion = _last_date,
        updated_at = now()
    WHERE id = _producto_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: se dispara al insertar o actualizar precio de ítems de PIM
CREATE TRIGGER trg_update_product_price
AFTER INSERT OR UPDATE OF precio_unitario_usd ON pim_items
FOR EACH ROW
WHEN (NEW.precio_unitario_usd > 0)
EXECUTE FUNCTION update_product_avg_price();
