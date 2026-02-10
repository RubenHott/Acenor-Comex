
# Corregir Flujo de Precios en PIMs

## Problema Actual
Actualmente, al crear/editar un PIM, el sistema pide ingresar el **Total USD** por linea y calcula el precio unitario dividiendo. El flujo correcto es al reves:

- **Articulos por peso (TON)**: El usuario ingresa el **Precio por Tonelada** y el sistema calcula `Total USD = Precio/TON x Cantidad en TON`
- **Articulos por unidad (UND/PZA)**: El usuario ingresa el **Precio Unitario** y el sistema calcula `Total USD = Precio Unitario x Cantidad`

## Cambios Necesarios

### 1. PIMItemSelector (Crear PIM - Items de requerimientos)
**Archivo:** `src/components/pim/PIMItemSelector.tsx`

- Cambiar la columna "Total USD" (input editable) por "Precio / TON" o "Precio / UND" (input editable)
- La columna "Total USD" pasa a ser calculada automaticamente (solo lectura)
- Modificar `updateTotalUsd` a `updatePrecioUnitario`: el usuario ingresa precio, se calcula `totalUsd = precio * cantidadEnDisplay`
- Ajustar `updateQuantity` para recalcular el total cuando cambia la cantidad (manteniendo el precio unitario)
- Al seleccionar un item, inicializar `precioUnitarioUsd` en 0 y `totalUsd` en 0

### 2. PIMExtraProductSelector (Crear PIM - Productos adicionales)
**Archivo:** `src/components/pim/PIMExtraProductSelector.tsx`

- Mismo cambio: el input editable pasa a ser "Precio / TON" o "Precio / UND"
- "Total USD" se calcula automaticamente
- Modificar `updateTotalUsd` a `updatePrecioUnitario`
- Ajustar `updateQuantity` para recalcular total manteniendo precio

### 3. PIMEditItemsTable (Editar PIM - Items existentes)
**Archivo:** `src/components/pim/PIMEditItemsTable.tsx`

- Cambiar el input de "Total USD" a "Precio / TON" o "Precio / UND"
- "Total USD" pasa a ser columna calculada (solo lectura)
- Ajustar `updateItem` para que al cambiar precio recalcule total, y al cambiar cantidad recalcule total manteniendo precio

### 4. usePIMCreation (Logica de guardado)
**Archivo:** `src/hooks/usePIMCreation.ts`

- Verificar que los calculos de `totalUsd` y `precioUnitarioUsd` se guarden correctamente con el nuevo flujo
- El `precio_unitario_usd` en la BD debe almacenarse como precio por unidad cruda (KG o UND), no por TON display

## Detalle Tecnico

### Flujo de calculo por linea

```text
+-------------------+     +-------------------+     +-------------------+
| Cantidad (TON)    | --> |                   | --> | Total USD         |
| [input editable]  |     |   Multiplicacion  |     | [calculado]       |
+-------------------+     |                   |     +-------------------+
                          |   Total = P x Q   |
+-------------------+     |                   |
| Precio/TON (USD)  | --> |                   |
| [input editable]  |     +-------------------+
+-------------------+
```

### Almacenamiento en BD
- `precio_unitario_usd`: Se guarda como precio por unidad de almacenamiento (por KG si la unidad raw es KG, por UND si es unidad)
- `total_usd`: Precio display x Cantidad display = Precio raw x Cantidad raw
- No hay cambios en el esquema de base de datos, solo en como se calcula

### Orden de columnas en tablas (nuevo)
1. Codigo
2. Descripcion  
3. Cantidad (TON o UND) - editable
4. Precio / TON o Precio / UND - editable
5. Total USD - calculado (solo lectura)
6. Fabrica/Molino
