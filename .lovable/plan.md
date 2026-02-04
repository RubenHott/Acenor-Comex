# Plan: Cambiar Foreign Key de productos.cuadro

## ✅ Completado (Febrero 2026)

Se modificó la restricción de clave foránea en `productos.cuadro` para que referencie `cuadros_importacion.codigo` en lugar de `cuadros_importacion.id`. Esto permite cargar productos usando códigos legibles como "DISCOS", "INOX", etc. directamente en el CSV.

## Cambios Aplicados

### Migración SQL Ejecutada

1. **Constraint UNIQUE agregado a codigo**:
   ```sql
   ALTER TABLE cuadros_importacion 
   ADD CONSTRAINT cuadros_importacion_codigo_unique UNIQUE (codigo);
   ```

2. **Foreign key eliminada y recreada**:
   ```sql
   ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_cuadro_fkey;
   ALTER TABLE productos ADD CONSTRAINT productos_cuadro_fkey 
   FOREIGN KEY (cuadro) REFERENCES cuadros_importacion(codigo);
   ```

## Resultado

| Antes | Después |
|-------|---------|
| `productos.cuadro` → `cuadros_importacion.id` (UUID) | `productos.cuadro` → `cuadros_importacion.codigo` (texto) |
| CSV requería UUIDs: `7b2fcbb5-...` | CSV acepta códigos: `DISCOS`, `INOX` |

## Ejemplo de CSV Válido

```csv
codigo,descripcion,categoria,unidad,cuadro
PROD001,Disco de corte 4",MP,PZA,DISCOS
PROD002,Lámina inoxidable,MP,TON,INOX
PROD003,Producto sin cuadro,PT,KG,
```

## Notas
- El campo `cuadro` sigue siendo nullable
- Los códigos en el CSV deben coincidir exactamente con `cuadros_importacion.codigo`
- No se requirieron cambios en el frontend

