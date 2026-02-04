
# Plan: Corrección del Bug de Items en Requerimientos

## Diagnóstico

El error en los logs de Postgres es claro:

```
new row for relation "requerimiento_items" violates check constraint "requerimiento_items_tipo_material_check"
```

### Causa Raíz

La función `productTipoFromCategoria()` en `src/components/requirements/ProductAutocomplete.tsx` devuelve valores como:
- `"Materia Prima"` (con espacio y mayúsculas)
- `"Producto Terminado"` (con espacio y mayúsculas)

Pero el CHECK constraint en la base de datos requiere:
- `'materia_prima'` (snake_case)
- `'producto_terminado'` (snake_case)

Este desajuste hace que **todos los inserts en `requerimiento_items` fallen**, dejando la tabla vacía. Por eso al editar un requerimiento no aparecen los códigos de producto.

---

## Solución

### Archivo a Modificar

**`src/components/requirements/ProductAutocomplete.tsx`**

Cambiar la función `productTipoFromCategoria()` para que retorne los valores exactos que espera la base de datos:

```
// ANTES (línea 27-32):
export function productTipoFromCategoria(categoria: string | null): string {
  if (!categoria) return 'Producto Terminado';
  const c = categoria.toLowerCase();
  if (c.includes('mp') || c.includes('materia') || c.includes('materia prima')) return 'Materia Prima';
  return 'Producto Terminado';
}

// DESPUÉS:
export function productTipoFromCategoria(categoria: string | null): string {
  if (!categoria) return 'producto_terminado';
  const c = categoria.toLowerCase();
  if (c.includes('mp') || c.includes('materia') || c.includes('materia prima')) return 'materia_prima';
  return 'producto_terminado';
}
```

### Archivo Secundario

**`src/components/requirements/RequirementEntryForm.tsx`**

Actualizar la visualización del tipo de material para mostrarlo de forma amigable al usuario (la columna "Tipo" en la tabla):

```
// Línea 284 - cambiar la celda de tipo para mostrar etiqueta legible:
<TableCell className="text-sm">
  {line.product 
    ? productTipoFromCategoria(line.product.categoria) === 'materia_prima' 
      ? 'Materia Prima' 
      : 'Producto Terminado' 
    : '—'}
</TableCell>
```

Alternativamente, crear una función auxiliar para visualización:

```typescript
function tipoMaterialLabel(tipo: string): string {
  return tipo === 'materia_prima' ? 'Materia Prima' : 'Producto Terminado';
}
```

---

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/requirements/ProductAutocomplete.tsx` | Corregir retorno de `productTipoFromCategoria()` a snake_case |
| `src/components/requirements/RequirementEntryForm.tsx` | Agregar función de visualización para mostrar etiqueta amigable |

---

## Resultado Esperado

Después de aplicar este fix:

1. Los nuevos requerimientos guardarán sus items correctamente
2. Al editar un requerimiento existente, las líneas se mostrarán con sus códigos
3. La creación de PIMs tendrá items disponibles para consumir

**Nota**: Los requerimientos existentes seguirán sin items porque se crearon cuando la inserción fallaba. Habría que volver a crearlos.
