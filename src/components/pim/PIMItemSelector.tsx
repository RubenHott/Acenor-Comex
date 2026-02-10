import { useState, useCallback, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMolinos } from '@/hooks/useMolinos';
import { isCuadroPorUnidad } from '@/lib/cuadrosUnidad';
import type { RequirementItem } from '@/hooks/useRequirements';

export interface PIMItemSelection {
  itemId: string;
  requerimientoId: string;
  cuadroId: string;
  cuadroCodigo: string;
  productoId: string;
  codigoProducto: string;
  descripcion: string;
  unidad: string;
  precioUnitarioUsd: number | null;
  cantidadDisponible: number;
  cantidadAConsumir: number;
  totalUsd: number;
  exceedsLimit: boolean;
  molinoId?: string | null;
}

export interface RequirementItemWithContext extends RequirementItem {
  requerimientoId: string;
  cuadroId: string;
  cuadroCodigo: string;
  requerimientoMes: string;
}

interface PIMItemSelectorProps {
  items: RequirementItemWithContext[];
  selections: PIMItemSelection[];
  onSelectionsChange: (selections: PIMItemSelection[]) => void;
  /** Molino por defecto del PIM; si el ítem no tiene molinoId, se usa este */
  molinoId?: string;
}

/**
 * Returns the display unit and converts a raw quantity (stored in KG or original unit)
 * to the display unit. Weight-based cuadros always display in TON.
 */
function toDisplayUnit(
  cuadroCodigo: string,
  rawUnit: string,
  rawQty: number
): { displayUnit: string; displayQty: number } {
  const porUnidad = isCuadroPorUnidad(cuadroCodigo);
  if (porUnidad) {
    // Unit-based cuadros keep their original unit (UND, PZA, etc.)
    return { displayUnit: rawUnit, displayQty: rawQty };
  }
  // Weight-based: always show in TON
  if (rawUnit === 'KG') {
    return { displayUnit: 'TON', displayQty: rawQty / 1000 };
  }
  return { displayUnit: 'TON', displayQty: rawQty };
}

/** Convert display quantity back to storage quantity (KG for weight cuadros stored in KG). */
function fromDisplayQty(
  cuadroCodigo: string,
  rawUnit: string,
  displayQty: number
): number {
  const porUnidad = isCuadroPorUnidad(cuadroCodigo);
  if (porUnidad) return displayQty;
  if (rawUnit === 'KG') return displayQty * 1000;
  return displayQty;
}

/**
 * Convert display price (per TON or per UND) to raw storage price (per KG or per UND).
 * In the DB we store precio_unitario_usd per raw unit (KG or UND).
 */
function displayPriceToRawPrice(
  cuadroCodigo: string,
  rawUnit: string,
  displayPrice: number
): number {
  const porUnidad = isCuadroPorUnidad(cuadroCodigo);
  if (porUnidad) return displayPrice; // price per UND stays as-is
  if (rawUnit === 'KG') return displayPrice / 1000; // price/TON → price/KG
  return displayPrice; // already per TON
}

/**
 * Convert raw storage price (per KG or per UND) to display price (per TON or per UND).
 */
function rawPriceToDisplayPrice(
  cuadroCodigo: string,
  rawUnit: string,
  rawPrice: number
): number {
  const porUnidad = isCuadroPorUnidad(cuadroCodigo);
  if (porUnidad) return rawPrice;
  if (rawUnit === 'KG') return rawPrice * 1000; // price/KG → price/TON
  return rawPrice;
}

export function PIMItemSelector({
  items,
  selections,
  onSelectionsChange,
  molinoId,
}: PIMItemSelectorProps) {
  const { data: molinos = [] } = useActiveMolinos();
  const availableItems = items.filter((item) => item.kilos_disponibles > 0);

  const isSelected = (itemId: string) =>
    selections.some((s) => s.itemId === itemId);

  const getSelection = (itemId: string) =>
    selections.find((s) => s.itemId === itemId);

  const toggleSelection = useCallback(
    (item: RequirementItemWithContext, checked: boolean) => {
      if (checked) {
        const newSel: PIMItemSelection = {
          itemId: item.id,
          requerimientoId: item.requerimientoId,
          cuadroId: item.cuadroId,
          cuadroCodigo: item.cuadroCodigo,
          productoId: item.producto_id,
          codigoProducto: item.codigo_producto,
          descripcion: item.descripcion,
          unidad: item.unidad,
          precioUnitarioUsd: null,
          cantidadDisponible: item.kilos_disponibles,
          cantidadAConsumir: item.kilos_disponibles,
          totalUsd: 0,
          exceedsLimit: false,
          molinoId: molinoId || null,
        };
        onSelectionsChange([...selections, newSel]);
      } else {
        onSelectionsChange(selections.filter((s) => s.itemId !== item.id));
      }
    },
    [selections, onSelectionsChange, molinoId]
  );

  /** User changes quantity; recalculate totalUsd keeping the display price constant. */
  const updateQuantity = useCallback(
    (itemId: string, displayQty: number, cuadroCodigo: string, rawUnit: string) => {
      const storedQty = fromDisplayQty(cuadroCodigo, rawUnit, displayQty);
      onSelectionsChange(
        selections.map((s) => {
          if (s.itemId !== itemId) return s;
          const validCantidad = Math.max(0, storedQty);
          const exceedsLimit = validCantidad > s.cantidadDisponible;
          // Keep display price constant, recalculate total
          const currentDisplayPrice = s.precioUnitarioUsd != null
            ? rawPriceToDisplayPrice(cuadroCodigo, rawUnit, s.precioUnitarioUsd)
            : 0;
          const newDisplayQty = toDisplayUnit(cuadroCodigo, rawUnit, validCantidad).displayQty;
          const totalUsd = currentDisplayPrice * newDisplayQty;
          return {
            ...s,
            cantidadAConsumir: validCantidad,
            totalUsd,
            exceedsLimit,
          };
        })
      );
    },
    [selections, onSelectionsChange]
  );

  /** User enters the display price (per TON or per UND); we derive totalUsd and raw precioUnitarioUsd. */
  const updatePrecioUnitario = useCallback(
    (itemId: string, displayPrice: number, cuadroCodigo: string, rawUnit: string) => {
      onSelectionsChange(
        selections.map((s) => {
          if (s.itemId !== itemId) return s;
          const price = Math.max(0, displayPrice);
          const rawPrice = displayPriceToRawPrice(cuadroCodigo, rawUnit, price);
          const displayQty = toDisplayUnit(cuadroCodigo, rawUnit, s.cantidadAConsumir).displayQty;
          const totalUsd = price * displayQty;
          return {
            ...s,
            precioUnitarioUsd: rawPrice,
            totalUsd,
          };
        })
      );
    },
    [selections, onSelectionsChange]
  );

  const updateMolino = useCallback(
    (itemId: string, value: string) => {
      const storeNull = value === '__sin_asignar__' || value === molinoId;
      onSelectionsChange(
        selections.map((s) => {
          if (s.itemId !== itemId) return s;
          return { ...s, molinoId: storeNull ? null : value };
        })
      );
    },
    [selections, onSelectionsChange, molinoId]
  );

  const formatNumber = (n: number, decimals = 2) =>
    new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(n);

  // Group items by cuadro
  const groupedItems = useMemo(() => {
    const groups: Record<string, RequirementItemWithContext[]> = {};
    availableItems.forEach((item) => {
      const key = `${item.cuadroCodigo}|${item.requerimientoMes}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [availableItems]);

  // Totals
  const totalToneladas = selections.reduce((sum, s) => {
    const { displayQty } = toDisplayUnit(s.cuadroCodigo, s.unidad, s.cantidadAConsumir);
    if (isCuadroPorUnidad(s.cuadroCodigo)) return sum; // don't add units to toneladas
    return sum + displayQty;
  }, 0);

  const totalUnidades = selections.reduce((sum, s) => {
    if (!isCuadroPorUnidad(s.cuadroCodigo)) return sum;
    return sum + s.cantidadAConsumir;
  }, 0);

  const totalUsd = selections.reduce((sum, s) => sum + s.totalUsd, 0);
  const hasExceedingItems = selections.some((s) => s.exceedsLimit);

  if (availableItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No hay ítems disponibles para consumir.</p>
        <p className="text-sm">Seleccione requerimientos con saldo disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasExceedingItems && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Advertencia:</strong> Hay ítems con cantidad mayor a la disponible. 
            Se guardará con observación de alerta.
          </AlertDescription>
        </Alert>
      )}

      {Object.entries(groupedItems).map(([groupKey, groupItems]) => {
        const [cuadroCodigo, mes] = groupKey.split('|');
        const porUnidad = isCuadroPorUnidad(cuadroCodigo);

        return (
          <div key={groupKey} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {cuadroCodigo}
              </Badge>
              <span className="text-sm text-muted-foreground">{mes}</span>
              <Badge variant="outline" className="text-xs">
                {porUnidad ? 'Unidades' : 'Toneladas'}
              </Badge>
            </div>
            
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">
                      Disponible ({porUnidad ? 'UND' : 'TON'})
                    </TableHead>
                    <TableHead className="text-right">
                      A Consumir ({porUnidad ? 'UND' : 'TON'})
                    </TableHead>
                    <TableHead className="text-right">
                      Precio / {porUnidad ? 'UND' : 'TON'}
                    </TableHead>
                    <TableHead className="text-right">Total USD</TableHead>
                    <TableHead>Fábrica/Molino</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupItems.map((item) => {
                    const selected = isSelected(item.id);
                    const sel = getSelection(item.id);
                    const exceedsLimit = sel?.exceedsLimit ?? false;

                    const { displayUnit, displayQty: dispDisponible } = toDisplayUnit(
                      item.cuadroCodigo,
                      item.unidad,
                      item.kilos_disponibles
                    );

                    const dispConsumir = sel
                      ? toDisplayUnit(item.cuadroCodigo, item.unidad, sel.cantidadAConsumir).displayQty
                      : 0;

                    // Display price (per TON or per UND)
                    const displayPrice =
                      sel && sel.precioUnitarioUsd != null
                        ? rawPriceToDisplayPrice(item.cuadroCodigo, item.unidad, sel.precioUnitarioUsd)
                        : 0;

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          selected && 'bg-primary/5',
                          exceedsLimit && 'bg-destructive/5'
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(checked) =>
                              toggleSelection(item, !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.codigo_producto}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="truncate text-sm">{item.descripcion}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(dispDisponible)}
                        </TableCell>
                        <TableCell className="text-right">
                          {selected ? (
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={dispConsumir}
                              onChange={(e) =>
                                updateQuantity(
                                  item.id,
                                  parseFloat(e.target.value) || 0,
                                  item.cuadroCodigo,
                                  item.unidad
                                )
                              }
                              className={cn(
                                'w-28 text-right',
                                exceedsLimit && 'border-destructive bg-destructive/10'
                              )}
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {selected ? (
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={displayPrice}
                              onChange={(e) =>
                                updatePrecioUnitario(
                                  item.id,
                                  parseFloat(e.target.value) || 0,
                                  item.cuadroCodigo,
                                  item.unidad
                                )
                              }
                              className="w-32 text-right"
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {selected && sel
                            ? formatCurrency(sel.totalUsd)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {selected && sel ? (
                            <Select
                              value={sel.molinoId ?? (molinoId || '__sin_asignar__')}
                              onValueChange={(v) => updateMolino(item.id, v)}
                            >
                              <SelectTrigger className="h-9 min-w-[140px]">
                                <SelectValue placeholder="Sin asignar" />
                              </SelectTrigger>
                              <SelectContent>
                                {molinoId ? (
                                  (() => {
                                    const defaultMolino = molinos.find((m) => m.id === molinoId);
                                    return (
                                      <SelectItem value={molinoId} key={molinoId}>
                                        {defaultMolino
                                          ? `${defaultMolino.codigo} - ${defaultMolino.nombre} (por defecto del PIM)`
                                          : 'Por defecto del PIM'}
                                      </SelectItem>
                                    );
                                  })()
                                ) : (
                                  <SelectItem value="__sin_asignar__">Sin asignar</SelectItem>
                                )}
                                {molinos
                                  .filter((m) => m.id !== molinoId)
                                  .map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      {m.codigo} - {m.nombre}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}

      {/* Totals */}
      <div className="flex justify-end">
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 min-w-[300px]">
          {totalToneladas > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Total Toneladas</Label>
              <p className="text-lg font-bold">{formatNumber(totalToneladas)} t</p>
            </div>
          )}
          {totalUnidades > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Total Unidades</Label>
              <p className="text-lg font-bold">{formatNumber(totalUnidades, 0)}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Total USD</Label>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalUsd)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
