/**
 * Cuadros de importación que se visualizan y trabajan en UNIDADES (no en toneladas).
 * El resto se considera en TON (peso).
 */
export const CUADROS_POR_UNIDAD = ['DISCOS', 'OTROS', 'PARR'] as const;

export function isCuadroPorUnidad(codigo: string | null | undefined): boolean {
  if (!codigo || typeof codigo !== 'string') return false;
  return CUADROS_POR_UNIDAD.includes(codigo.trim().toUpperCase() as (typeof CUADROS_POR_UNIDAD)[number]);
}
