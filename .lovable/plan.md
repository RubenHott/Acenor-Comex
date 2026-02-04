
# Plan: Corrección de Edición de Requerimientos + Módulo de Creación de PIMs

## Parte 1: Corrección del Bug de Edición de Requerimientos

### Diagnóstico del Problema

En `src/pages/RequirementsPage.tsx`, línea 100, el `useEffect` que carga las líneas al editar tiene esta condición:

```typescript
if (formOpen !== 'edit' || !editRequirementId || !requirementForEdit || 
    requirementForEdit.id !== editRequirementId || !products) return;
```

El problema es la dependencia `!products`. Si el maestro de productos no ha terminado de cargar, las líneas nunca se muestran, incluso aunque `requirementForEdit.items` ya tiene toda la información necesaria (código, descripción, precio, cantidad).

### Solución

Modificar la lógica para:
1. Cargar las líneas inmediatamente usando `requirementItemToProductLike()` que ya crea un objeto "producto" a partir del item
2. Opcionalmente enriquecer con datos del maestro cuando esté disponible

### Cambios en RequirementsPage.tsx

**Archivo**: `src/pages/RequirementsPage.tsx`

Modificar el `useEffect` de líneas 98-114:

```text
// ANTES (línea 100):
if (formOpen !== 'edit' || !editRequirementId || !requirementForEdit || 
    requirementForEdit.id !== editRequirementId || !products) return;

// DESPUÉS:
if (formOpen !== 'edit' || !editRequirementId || !requirementForEdit || 
    requirementForEdit.id !== editRequirementId) return;
```

Y ajustar la creación de líneas para usar `products` opcionalmente:

```text
const lines: RequirementLine[] = items.map((item) => {
  const product = products?.find((p) => p.id === item.producto_id) ?? null;
  const productLike = requirementItemToProductLike(item, product);
  return {
    tempId: item.id,
    product: productLike,
    cantidadRequerida: item.cantidad_requerida,
  };
});
```

---

## Parte 2: Módulo de Creación de PIMs

### Flujo de Negocio

```text
REQUERIMIENTO MENSUAL
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  PIM PRINCIPAL (Cierre de Gerencia con Trader)               │
│  - Consume productos del requerimiento                        │
│  - Proveedor (Trader)                                         │
│  - Productos seleccionados del saldo disponible              │
└───────────────────────┬──────────────────────────────────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  SUB-PIM 1  │  │  SUB-PIM 2  │  │  SUB-PIM N  │
│  Fábrica A  │  │  Fábrica B  │  │  Fábrica N  │
└──────┬──────┘  └─────────────┘  └─────────────┘
       │
       ├──────────────────┐
       ▼                  ▼
┌────────────┐    ┌────────────┐
│ Parcial 1  │    │ Parcial 2  │   (Envíos parcializados)
└────────────┘    └────────────┘
```

### Regla de Reconciliación

La suma de todos los PIMs de un mes debe igualar el requerimiento inicial.

Para esto, cada item del requerimiento tiene:
- `cantidad_requerida`: Lo que se pidió
- `kilos_consumidos`: Lo ya asignado a PIMs
- `kilos_disponibles`: Saldo para nuevos PIMs

### Estructura de Archivos a Crear

```text
src/
├── pages/
│   └── comex/
│       └── CreatePIMPage.tsx       (NUEVA)
├── components/
│   └── pim/
│       ├── PIMItemSelector.tsx     (NUEVO)
│       └── PIMForm.tsx             (NUEVO)
└── hooks/
    └── usePIMs.ts                  (ACTUALIZAR)
```

### Componentes a Implementar

#### 1. Página CreatePIMPage.tsx

Funcionalidad:
- Seleccionar requerimiento(s) del mes con saldo disponible
- Ver ítems disponibles (`kilos_disponibles > 0`)
- Seleccionar ítems a incluir en el PIM
- Ingresar cantidades (validar vs disponible)
- Seleccionar proveedor (trader)
- Ingresar datos del cierre:
  - Descripción
  - Modalidad de pago (carta crédito, anticipo, contado)
  - Días crédito / % anticipo según modalidad
- Generar código automático (PIM-YYYY-NNN)

#### 2. Componente PIMItemSelector.tsx

Tabla interactiva con:
- Items del requerimiento con saldo > 0
- Columnas: Código, Descripción, Disponible, A Consumir
- Checkboxes para selección múltiple
- Input para cantidad a consumir
- Validación: cantidad <= disponible
- Totales: Toneladas y USD

#### 3. Componente PIMForm.tsx

Campos del formulario:
- Descripción (texto)
- Proveedor (select de proveedores activos)
- Modalidad de pago (select: carta_credito, anticipo, contado, mixto)
- Días crédito (si modalidad = carta_credito)
- % Anticipo (si modalidad = anticipo o mixto)

#### 4. Hook useCreatePIMWithItems

Nueva función en `usePIMs.ts`:

```text
useCreatePIMWithItems(): Mutation para:
1. Generar código PIM-{YYYY}-{NNN}
2. Insertar en tabla `pims`
3. Insertar items en `pim_items`
4. Insertar relación en `pim_requirement_items`
5. Actualizar `kilos_consumidos` en `requerimiento_items`
6. Actualizar totales en `requerimientos_mensuales`
```

### Integración con UI Existente

Conectar el botón "Generar PIM" de `RequirementsPage.tsx` (línea 403-405) para:
- Navegar a `/comex/pim/crear?requerimiento={id}`
- Pre-seleccionar el requerimiento en el formulario

Actualizar el botón "Nuevo PIM" de `PIMsPage.tsx` (línea 135-138) para:
- Navegar a `/comex/pim/crear`
- Mostrar selector de requerimientos disponibles

### Rutas a Agregar

```text
Archivo: src/App.tsx

Nueva ruta bajo /comex:
<Route path="pim/crear" element={<CreatePIMPage />} />
```

### Generación de Código PIM

Formato: `PIM-{YYYY}-{NNN}`
Ejemplo: `PIM-2026-001`

Lógica:
1. Obtener año actual
2. Contar PIMs del año actual en la base de datos
3. Incrementar secuencia

### Validaciones de Negocio

Al crear PIM:
- Cada item: `cantidad_a_consumir <= kilos_disponibles`
- Proveedor obligatorio
- Al menos un item seleccionado
- Total > 0

Al guardar:
- Actualizar `kilos_consumidos += cantidad` en `requerimiento_items`
- Recalcular `kilos_disponibles` en `requerimiento_items`
- Actualizar totales en `requerimientos_mensuales`

---

## Secuencia de Implementación

### Fase 1 (Inmediato): Corrección del Bug
1. Modificar `useEffect` en `RequirementsPage.tsx` para no depender de `products`

### Fase 2: Creación Básica de PIMs
1. Crear hook `useCreatePIMWithItems` en `usePIMs.ts`
2. Crear componente `PIMItemSelector.tsx`
3. Crear componente `PIMForm.tsx`
4. Crear página `CreatePIMPage.tsx`
5. Agregar ruta en `App.tsx`
6. Conectar botones existentes

### Fase 3 (Futuro): Sub-PIMs y Fábricas
- División de PIM en sub-PIMs por fábrica
- Gestión de envíos parcializados

### Fase 4 (Futuro): Validación de Contratos
- Comparación cierre vs contrato de fábrica
- Detección de diferencias
- Flujo de aprobación

### Fase 5 (Futuro): Flujo de Pagos
- Apertura de carta de crédito
- Registro de anticipos
- Tracking de pagos
