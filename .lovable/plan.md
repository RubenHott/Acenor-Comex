

# Plan: Mejora del Módulo Maestros con Estructura Clara y Preview de Datos

## Objetivo

Rediseñar el módulo `/comex/maestros` para que el usuario pueda:
1. Ver claramente la estructura requerida de cada tabla para carga masiva
2. Descargar plantillas de ejemplo (CSV/Excel)
3. Ver un preview completo de todos los datos actuales con todas las columnas de la BD

---

## Cambios Propuestos

### 1. Nuevo Componente: Tarjeta de Estructura de Tabla

Para cada pestaña (Cuadros, Productos, Proveedores), agregar una sección colapsable que muestre:

| Elemento | Descripción |
|----------|-------------|
| Tabla de columnas | Nombre, tipo, requerido/opcional, descripción |
| Botón de descarga | Plantilla CSV vacía con encabezados correctos |
| Ejemplo visual | Cómo debe verse el archivo antes de subir |

### 2. Estructura por Tabla (Basado en Supabase)

#### Cuadros de Importación (`cuadros_importacion`)

| Columna | Tipo | Requerido | Descripción |
|---------|------|-----------|-------------|
| codigo | texto | Si | Código único del cuadro |
| nombre | texto | Si | Nombre del cuadro |
| descripcion | texto | No | Descripción adicional |
| activo | boolean | No | Estado activo (default: true) |

#### Productos (`productos`)

| Columna | Tipo | Requerido | Descripción |
|---------|------|-----------|-------------|
| codigo | texto | Si | Código único del producto |
| descripcion | texto | Si | Descripción del producto |
| categoria | texto | Si | Categoría principal |
| unidad | texto | Si | Unidad de medida (TON, KG, etc.) |
| sub_categoria | texto | No | Subcategoría |
| origen | texto | No | Fabricacion/Compra Local/Importacion |
| cuadro | texto | No | ID del cuadro de importación |
| linea | texto | No | Línea de producto |
| clasificacion | texto | No | Clasificación del producto |
| tipo_abc | texto | No | Clasificación ABC (A/B/C) |
| cod_estadistico | texto | No | Código estadístico |
| cod_base_mp | texto | No | Código base materia prima |
| espesor | número | No | Espesor en mm |
| ancho | número | No | Ancho en mm |
| peso | número | No | Peso en kg |
| peso_compra | número | No | Peso de compra |
| ultimo_precio_usd | número | No | Último precio en USD |
| ultima_fecha_importacion | fecha | No | Última fecha de importación |

#### Proveedores (`proveedores`)

| Columna | Tipo | Requerido | Descripción |
|---------|------|-----------|-------------|
| codigo | texto | Si | Código único del proveedor |
| nombre | texto | Si | Nombre/razón social |
| pais | texto | Si | País de origen |
| ciudad | texto | No | Ciudad |
| contacto | texto | No | Nombre del contacto |
| email | texto | No | Correo electrónico |
| telefono | texto | No | Teléfono |
| tipo_proveedor | texto | No | Fabricante/Trader/Distribuidor |
| activo | boolean | No | Estado activo (default: true) |

---

### 3. Preview de Datos Completo

Mostrar tabla con scroll horizontal con **todas las columnas** de la BD:

#### Cuadros
- codigo, nombre, descripcion, activo, created_at

#### Productos (18 columnas visibles)
- codigo, descripcion, categoria, unidad, sub_categoria, origen, cuadro, linea, clasificacion, tipo_abc, cod_estadistico, cod_base_mp, espesor, ancho, peso, peso_compra, ultimo_precio_usd, ultima_fecha_importacion

#### Proveedores (9 columnas visibles)
- codigo, nombre, pais, ciudad, contacto, email, telefono, tipo_proveedor, activo

---

### 4. Diseño de UI Propuesto

```text
┌─────────────────────────────────────────────────────────────────┐
│  MAESTROS                                                       │
├─────────────────────────────────────────────────────────────────┤
│  [Cuadros] [Productos] [Proveedores]                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Estructura requerida para carga masiva ─────────────────┐   │
│  │                                                           │   │
│  │  Columnas obligatorias: codigo, descripcion, categoria,  │   │
│  │                         unidad                            │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │ Columna          │ Tipo   │ Req │ Descripción    │    │   │
│  │  ├──────────────────┼────────┼─────┼────────────────┤    │   │
│  │  │ codigo           │ texto  │ Si  │ Código único   │    │   │
│  │  │ descripcion      │ texto  │ Si  │ Descripción    │    │   │
│  │  │ ...              │ ...    │ ... │ ...            │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  [Descargar Plantilla CSV]  [Ver Ejemplo]                 │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Cargar CSV / Excel]                                           │
│                                                                 │
│  ─── Datos actuales (245 registros) ────────────────────────    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ codigo │ descripcion │ categoria │ ... │ precio │       │◄──┤ Scroll horizontal
│  ├────────┼─────────────┼───────────┼─────┼────────┼───────┤    │
│  │ P001   │ Fleje 0.5mm │ MP        │ ... │ 1,200  │ [🗑️] │    │
│  │ P002   │ Bobina HD   │ MP        │ ... │ 1,450  │ [🗑️] │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/MaestrosPage.tsx` | Agregar sección de estructura, expandir tablas de preview |

## Nuevo Componente

| Archivo | Propósito |
|---------|-----------|
| `src/components/maestros/TableStructureCard.tsx` | Componente reutilizable para mostrar estructura y generar plantilla |

---

## Implementación Detallada

### Fase 1: Componente TableStructureCard

Crear componente que reciba:
- `tableName`: nombre de la tabla
- `columns`: array de columnas con metadata
- `onDownloadTemplate`: función para descargar CSV

Características:
- Sección colapsable (Collapsible de shadcn/ui)
- Tabla con columnas: Nombre, Tipo, Requerido, Descripción
- Botón para descargar plantilla CSV con encabezados
- Badge de color para columnas requeridas vs opcionales

### Fase 2: Actualizar MaestrosPage

1. Agregar definiciones de estructura para cada tabla
2. Integrar TableStructureCard en cada TabsContent
3. Expandir las tablas de preview para mostrar **todas** las columnas
4. Agregar contador de registros
5. Mejorar scroll horizontal para tablas anchas

### Fase 3: Función de Descarga de Plantilla

```typescript
function downloadTemplate(columns: string[], filename: string) {
  const csv = columns.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

---

## Beneficios

1. **Claridad**: El usuario sabe exactamente qué columnas necesita
2. **Prevención de errores**: Las columnas requeridas están claramente marcadas
3. **Facilidad de uso**: Puede descargar plantilla y solo llenarla
4. **Transparencia**: Ve todos los datos actuales, no solo un resumen
5. **Alineación con BD**: La estructura coincide 100% con Supabase

