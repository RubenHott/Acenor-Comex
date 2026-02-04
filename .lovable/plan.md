

# Plan: Cambiar Foreign Key de productos.cuadro

## Objetivo
Modificar la restricción de clave foránea en `productos.cuadro` para que referencie `cuadros_importacion.codigo` en lugar de `cuadros_importacion.id`. Esto permitirá cargar productos usando códigos legibles como "DISCOS", "INOX", etc. directamente en el CSV.

## Cambios en Base de Datos

Se ejecutará una migración SQL con los siguientes pasos:

### Paso 1: Agregar constraint UNIQUE a codigo
El campo `cuadros_importacion.codigo` debe tener una restricción UNIQUE para poder ser referenciado por una foreign key.

```text
ALTER TABLE cuadros_importacion 
ADD CONSTRAINT cuadros_importacion_codigo_unique UNIQUE (codigo);
```

### Paso 2: Eliminar la foreign key existente
Remover la restricción actual que apunta al campo `id`.

```text
ALTER TABLE productos 
DROP CONSTRAINT IF EXISTS productos_cuadro_fkey;
```

### Paso 3: Crear nueva foreign key apuntando a codigo
Crear la nueva restricción que referencia el campo `codigo`.

```text
ALTER TABLE productos 
ADD CONSTRAINT productos_cuadro_fkey 
FOREIGN KEY (cuadro) REFERENCES cuadros_importacion(codigo);
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| `productos.cuadro` → `cuadros_importacion.id` (UUID) | `productos.cuadro` → `cuadros_importacion.codigo` (texto) |
| CSV requiere UUIDs: `7b2fcbb5-...` | CSV acepta códigos: `DISCOS`, `INOX` |

## Ejemplo de CSV Válido (después del cambio)

```text
codigo,descripcion,categoria,unidad,cuadro
PROD001,Disco de corte 4",MP,PZA,DISCOS
PROD002,Lámina inoxidable,MP,TON,INOX
PROD003,Producto sin cuadro,PT,KG,
```

## Notas Técnicas
- El campo `cuadro` seguirá siendo nullable, permitiendo productos sin cuadro asignado
- Los códigos de cuadro en el CSV deben coincidir exactamente con los códigos en `cuadros_importacion`
- No se requieren cambios en el código frontend ya que el módulo Maestros ya maneja la carga correctamente

