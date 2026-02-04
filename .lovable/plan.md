

# Plan: Corrección de Bugs y Mejoras al Módulo PIM Multi-Cuadro

## Parte 1: Diagnóstico del Problema Principal

### Problema Identificado
La tabla `requerimiento_items` **no tiene política RLS para DELETE**, lo que impide eliminar items al editar un requerimiento. Esto causa:

1. Los items nunca se guardan correctamente (el insert falla después del delete bloqueado)
2. Al editar, no hay líneas que mostrar porque la tabla está vacía
3. En la creación de PIMs, no hay items disponibles para consumir

### Solución: Agregar Política RLS de DELETE

Se debe crear una migración SQL para habilitar DELETE en `requerimiento_items`.

---

## Parte 2: Corrección del Flujo de Edición de Requerimientos

### Problema Actual
El `useEffect` en `RequirementsPage.tsx` (línea 102-118) no carga las líneas correctamente cuando se abre el diálogo de edición.

### Cambios Requeridos

**Archivo**: `src/pages/RequirementsPage.tsx`

- Separar la lógica de carga de items del maestro de productos
- Usar `requirementItemToProductLike()` inmediatamente para mostrar datos del item
- Asegurar que `formLines` se pueble tan pronto como `requirementForEdit` esté disponible

---

## Parte 3: PIM Multi-Cuadro (Consumir de 2+ Requerimientos)

### Cambios de Arquitectura

El diseño actual solo permite seleccionar UN requerimiento por PIM. Para soportar múltiples:

```text
ANTES:
  PIM -> 1 Requerimiento -> N Items

DESPUÉS:
  PIM -> N Requerimientos (de cualquier cuadro) -> Items de cada uno
```

### Cambios en CreatePIMPage.tsx

1. Reemplazar selector único de requerimiento por selector múltiple
2. Agregar tarjetas para cada requerimiento seleccionado
3. Mostrar items agrupados por cuadro/requerimiento
4. Permitir agregar/quitar requerimientos dinámicamente

### Cambios en PIMItemSelector.tsx

1. Recibir items de múltiples requerimientos
2. Agrupar visualmente por cuadro de origen
3. Mantener referencia a qué requerimiento pertenece cada item

### Cambios en usePIMCreation.ts

1. Actualizar la mutación para:
   - Aceptar items de múltiples requerimientos
   - Actualizar `kilos_consumidos` en cada `requerimiento_items` correspondiente
   - Actualizar totales en cada `requerimientos_mensuales` afectado

---

## Parte 4: Productos Extra (Fuera de Requerimiento)

### Nueva Funcionalidad

Permitir agregar productos al PIM que **no provienen de ningún requerimiento**. Estos productos:
- No afectan el saldo de ningún requerimiento
- Se guardan en `pim_items` con un flag o sin referencia a `pim_requirement_items`
- Permiten flexibilidad cuando hay productos adicionales en el cierre de gerencia

### Cambios Requeridos

**Nuevo componente**: `src/components/pim/PIMExtraProductSelector.tsx`

- Buscador de productos del maestro general
- Input para cantidad, precio, unidad
- Lista de productos extra agregados
- Totales separados de los consumidos de requerimiento

**Modificar PIM creation flow**:

1. Agregar sección "Productos Adicionales" bajo el selector de items
2. Calcular totales combinados (requerimiento + extras)
3. Guardar productos extra en `pim_items` sin vincular a `pim_requirement_items`

### Cambios en usePIMCreation.ts

Diferenciar entre:
- `items`: productos que consumen requerimiento (se vinculan a `pim_requirement_items`)
- `extraItems`: productos adicionales (solo van a `pim_items`, sin consumir saldo)

---

## Parte 5: Validación con Alerta (Sin Bloqueo)

### Regla de Negocio
Si un usuario intenta consumir más de lo disponible en un item:
- **NO bloquear** el guardado
- **Mostrar alerta visual** (borde rojo, mensaje de advertencia)
- **Registrar observación** en el PIM creado

### Implementación

1. En `PIMItemSelector`: mostrar alerta visual cuando `cantidadAConsumir > cantidadDisponible`
2. En validaciones de `CreatePIMPage`: no bloquear, solo mostrar warning
3. Al guardar: incluir observación automática indicando el exceso

---

## Resumen de Archivos a Modificar

| Archivo | Tipo | Cambios |
|---------|------|---------|
| Migración SQL | Nuevo | Política RLS DELETE para `requerimiento_items` |
| `src/pages/RequirementsPage.tsx` | Modificar | Fix carga de líneas en edición |
| `src/pages/comex/CreatePIMPage.tsx` | Modificar | Selector múltiple de requerimientos + sección extras |
| `src/components/pim/PIMItemSelector.tsx` | Modificar | Agrupar por cuadro, mostrar origen |
| `src/components/pim/PIMExtraProductSelector.tsx` | Nuevo | Selector de productos extra |
| `src/hooks/usePIMCreation.ts` | Modificar | Soporte multi-requerimiento + extras |

---

## Secuencia de Implementación

### Fase 1: Fix Crítico (Inmediato)
1. Migración SQL para política DELETE en `requerimiento_items`
2. Corregir carga de líneas en edición de requerimientos

### Fase 2: PIM Multi-Cuadro
1. Modificar selector de requerimientos a múltiple
2. Actualizar `PIMItemSelector` para múltiples fuentes
3. Actualizar hook de creación de PIM

### Fase 3: Productos Extra
1. Crear componente `PIMExtraProductSelector`
2. Integrar en `CreatePIMPage`
3. Actualizar lógica de guardado

### Fase 4: Validación con Alerta
1. Implementar warnings visuales sin bloqueo
2. Agregar observaciones automáticas al PIM

