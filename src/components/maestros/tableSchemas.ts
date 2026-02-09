import type { ColumnDefinition } from './TableStructureCard';

export const cuadrosColumns: ColumnDefinition[] = [
  { name: 'codigo', type: 'texto', required: true, description: 'Código único del cuadro de importación' },
  { name: 'nombre', type: 'texto', required: true, description: 'Nombre descriptivo del cuadro' },
  { name: 'descripcion', type: 'texto', required: false, description: 'Descripción adicional' },
  { name: 'activo', type: 'boolean', required: false, description: 'Estado activo (true/false, default: true)' },
];

export const productosColumns: ColumnDefinition[] = [
  { name: 'codigo', type: 'texto', required: true, description: 'Código único del producto' },
  { name: 'descripcion', type: 'texto', required: true, description: 'Descripción del producto' },
  { name: 'categoria', type: 'texto', required: true, description: 'Categoría principal (ej: MP, PT)' },
  { name: 'unidad', type: 'texto', required: true, description: 'Unidad de medida (TON, KG, PZA, etc.)' },
  { name: 'sub_categoria', type: 'texto', required: false, description: 'Subcategoría del producto' },
  { name: 'origen', type: 'texto', required: false, description: 'Origen: Fabricacion/Compra Local/Importacion' },
  { name: 'cuadro', type: 'texto', required: false, description: 'ID del cuadro de importación asociado' },
  { name: 'linea', type: 'texto', required: false, description: 'Línea de producto' },
  { name: 'clasificacion', type: 'texto', required: false, description: 'Clasificación del producto' },
  { name: 'tipo_abc', type: 'texto', required: false, description: 'Clasificación ABC (A/B/C)' },
  { name: 'cod_estadistico', type: 'texto', required: false, description: 'Código estadístico aduanero' },
  { name: 'cod_base_mp', type: 'texto', required: false, description: 'Código base de materia prima' },
  { name: 'espesor', type: 'número', required: false, description: 'Espesor en mm' },
  { name: 'ancho', type: 'número', required: false, description: 'Ancho en mm' },
  { name: 'peso', type: 'número', required: false, description: 'Peso en kg' },
  { name: 'peso_compra', type: 'número', required: false, description: 'Peso de compra en kg' },
  { name: 'ultimo_precio_usd', type: 'número', required: false, description: 'Último precio en USD' },
  { name: 'ultima_fecha_importacion', type: 'fecha', required: false, description: 'Última fecha de importación (YYYY-MM-DD)' },
];

export const proveedoresColumns: ColumnDefinition[] = [
  { name: 'codigo', type: 'texto', required: true, description: 'Código único del proveedor' },
  { name: 'nombre', type: 'texto', required: true, description: 'Nombre o razón social' },
  { name: 'pais', type: 'texto', required: true, description: 'País de origen' },
  { name: 'ciudad', type: 'texto', required: false, description: 'Ciudad' },
  { name: 'contacto', type: 'texto', required: false, description: 'Nombre del contacto principal' },
  { name: 'email', type: 'texto', required: false, description: 'Correo electrónico' },
  { name: 'telefono', type: 'texto', required: false, description: 'Teléfono de contacto' },
  { name: 'tipo_proveedor', type: 'texto', required: false, description: 'Tipo: Fabricante/Trader/Distribuidor' },
  { name: 'activo', type: 'boolean', required: false, description: 'Estado activo (true/false, default: true)' },
];

export const fabricasMolinosColumns: ColumnDefinition[] = [
  { name: 'codigo', type: 'texto', required: true, description: 'Código único (ej: RNAV, PGR)' },
  { name: 'nombre', type: 'texto', required: true, description: 'Nombre o razón social' },
  { name: 'pais', type: 'texto', required: true, description: 'País' },
  { name: 'ciudad', type: 'texto', required: false, description: 'Ciudad' },
  { name: 'activo', type: 'boolean', required: false, description: 'Estado activo (true/false, default: true)' },
];
