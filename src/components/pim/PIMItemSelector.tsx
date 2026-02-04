import { useState, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RequirementItem } from '@/hooks/useRequirements';

export interface PIMItemSelection {
  itemId: string;
  productoId: string;
  codigoProducto: string;
  descripcion: string;
  unidad: string;
  precioUnitarioUsd: number | null;
  cantidadDisponible: number;
  cantidadAConsumir: number;
  totalUsd: number;
}

interface PIMItemSelectorProps {
  items: RequirementItem[];
  selections: PIMItemSelection[];
  onSelectionsChange: (selections: PIMItemSelection[]) => void;
}

export function PIMItemSelector({
  items,
  selections,
  onSelectionsChange,
}: PIMItemSelectorProps) {
  const availableItems = items.filter((item) => item.kilos_disponibles > 0);

  const isSelected = (itemId: string) =>
    selections.some((s) => s.itemId === itemId);

  const getSelection = (itemId: string) =>
    selections.find((s) => s.itemId === itemId);

  const toggleSelection = useCallback(
    (item: RequirementItem, checked: boolean) => {
      if (checked) {
        const newSel: PIMItemSelection = {
          itemId: item.id,
          productoId: item.producto_id,
          codigoProducto: item.codigo_producto,
          descripcion: item.descripcion,
          unidad: item.unidad,
          precioUnitarioUsd: item.precio_unitario_usd,
          cantidadDisponible: item.kilos_disponibles,
          cantidadAConsumir: item.kilos_disponibles, // Default to full amount
          totalUsd: (item.precio_unitario_usd ?? 0) * item.kilos_disponibles,
        };
        onSelectionsChange([...selections, newSel]);
      } else {
        onSelectionsChange(selections.filter((s) => s.itemId !== item.id));
      }
    },
    [selections, onSelectionsChange]
  );

  const updateQuantity = useCallback(
    (itemId: string, cantidad: number) => {
      onSelectionsChange(
        selections.map((s) => {
          if (s.itemId !== itemId) return s;
          const validCantidad = Math.max(0, Math.min(cantidad, s.cantidadDisponible));
          return {
            ...s,
            cantidadAConsumir: validCantidad,
            totalUsd: (s.precioUnitarioUsd ?? 0) * validCantidad,
          };
        })
      );
    },
    [selections, onSelectionsChange]
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

  // Totals
  const totalToneladas = selections.reduce((sum, s) => {
    if (s.unidad === 'TON') return sum + s.cantidadAConsumir;
    if (s.unidad === 'KG') return sum + s.cantidadAConsumir / 1000;
    return sum;
  }, 0);

  const totalUsd = selections.reduce((sum, s) => sum + s.totalUsd, 0);

  if (availableItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No hay ítems disponibles para consumir.</p>
        <p className="text-sm">Todos los productos ya han sido asignados a PIMs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12"></TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="text-right">A Consumir</TableHead>
              <TableHead className="text-right">Precio USD</TableHead>
              <TableHead className="text-right">Total USD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availableItems.map((item) => {
              const selected = isSelected(item.id);
              const sel = getSelection(item.id);
              const exceedsLimit =
                sel && sel.cantidadAConsumir > sel.cantidadDisponible;

              return (
                <TableRow
                  key={item.id}
                  className={cn(selected && 'bg-primary/5')}
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
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.unidad}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(item.kilos_disponibles)}
                  </TableCell>
                  <TableCell className="text-right">
                    {selected ? (
                      <Input
                        type="number"
                        min={0}
                        max={item.kilos_disponibles}
                        step={0.01}
                        value={sel?.cantidadAConsumir ?? 0}
                        onChange={(e) =>
                          updateQuantity(item.id, parseFloat(e.target.value) || 0)
                        }
                        className={cn(
                          'w-28 text-right',
                          exceedsLimit && 'border-destructive'
                        )}
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.precio_unitario_usd ?? 0)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {selected ? formatCurrency(sel?.totalUsd ?? 0) : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 min-w-[300px]">
          <div>
            <Label className="text-xs text-muted-foreground">Total Toneladas</Label>
            <p className="text-lg font-bold">{formatNumber(totalToneladas)} t</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Total USD</Label>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalUsd)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
