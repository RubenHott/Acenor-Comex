import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isCuadroPorUnidad } from '@/lib/cuadrosUnidad';

interface EditableItem {
  id: string;
  codigo_producto: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario_usd: number;
  total_usd: number;
  toneladas: number;
}

interface PIMEditItemsTableProps {
  items: EditableItem[];
  onItemsChange: (items: EditableItem[]) => void;
}

function toDisplayUnit(rawUnit: string, rawQty: number): { unit: string; qty: number } {
  if (rawUnit === 'KG') return { unit: 'TON', qty: rawQty / 1000 };
  return { unit: rawUnit, qty: rawQty };
}

function fromDisplayQty(rawUnit: string, displayQty: number): number {
  if (rawUnit === 'KG') return displayQty * 1000;
  return displayQty;
}

export function PIMEditItemsTable({ items, onItemsChange }: PIMEditItemsTableProps) {
  const updateItem = useCallback(
    (id: string, field: 'displayQty' | 'total_usd', value: number) => {
      onItemsChange(
        items.map((item) => {
          if (item.id !== id) return item;

          if (field === 'displayQty') {
            const rawQty = fromDisplayQty(item.unidad, value);
            const precio = rawQty > 0 ? item.total_usd / rawQty : 0;
            const toneladas = item.unidad === 'KG' ? rawQty / 1000 : item.unidad === 'TON' ? rawQty : 0;
            return { ...item, cantidad: rawQty, precio_unitario_usd: precio, toneladas };
          }

          // total_usd changed
          const total = Math.max(0, value);
          const precio = item.cantidad > 0 ? total / item.cantidad : 0;
          return { ...item, total_usd: total, precio_unitario_usd: precio };
        })
      );
    },
    [items, onItemsChange]
  );

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay ítems registrados en este PIM.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Código</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-center">Cantidad</TableHead>
            <TableHead className="text-right">Total USD</TableHead>
            <TableHead className="text-right">Precio / Unidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const { unit: displayUnit, qty: displayQty } = toDisplayUnit(item.unidad, item.cantidad);
            const calcUnitPrice = displayQty > 0 ? item.total_usd / displayQty : 0;

            return (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.codigo_producto}</TableCell>
                <TableCell>
                  <div className="max-w-[250px]">
                    <p className="truncate text-sm">{item.descripcion}</p>
                    <Badge variant="outline" className="text-xs mt-1">{displayUnit}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={displayQty}
                    onChange={(e) => updateItem(item.id, 'displayQty', parseFloat(e.target.value) || 0)}
                    className="w-28 text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.total_usd}
                    onChange={(e) => updateItem(item.id, 'total_usd', parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                  />
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {calcUnitPrice > 0 ? `${formatCurrency(calcUnitPrice)} / ${displayUnit}` : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
