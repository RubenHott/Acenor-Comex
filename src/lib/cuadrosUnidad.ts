/**
 * Cuadros de importación que se visualizan y trabajan en UNIDADES (no en toneladas).
 * El resto se considera en TON (peso), excepto los cuadros por kilo.
 */
export const CUADROS_POR_UNIDAD = ['DISCOS', 'OTROS', 'PARR'] as const;

export function isCuadroPorUnidad(codigo: string | null | undefined): boolean {
  if (!codigo || typeof codigo !== 'string') return false;
  return CUADROS_POR_UNIDAD.includes(codigo.trim().toUpperCase() as (typeof CUADROS_POR_UNIDAD)[number]);
}

/**
 * Cuadros de importación que se visualizan y trabajan en KILOGRAMOS (no en toneladas).
 * A diferencia de CUADROS_POR_UNIDAD, estos son cuadros de peso pero la unidad de display es KG.
 */
export const CUADROS_POR_KILO = ['SOLD'] as const;

export function isCuadroPorKilo(codigo: string | null | undefined): boolean {
  if (!codigo || typeof codigo !== 'string') return false;
  return CUADROS_POR_KILO.includes(codigo.trim().toUpperCase() as (typeof CUADROS_POR_KILO)[number]);
}

/**
 * Detecta si un producto es alambre de soldadura (rollos).
 * Estos productos se precian por KG pero se muestra una columna extra de rollos.
 */
export function isAlambreSoldadura(codigoProducto: string): boolean {
  return codigoProducto.toUpperCase().startsWith('BBOXMIG');
}
