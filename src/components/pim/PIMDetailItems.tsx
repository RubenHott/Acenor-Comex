import { useMemo } from 'react';
import { usePIMItems } from '@/hooks/usePIMItems';
import { useMolinos } from '@/hooks/useMolinos';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

const UNIT_ITEMS = ['u', 'und', 'pza', 'pieza', 'unidad'];

function isUnitBased(unidad: string) {
  return UNIT_ITEMS.includes(unidad.toLowerCase());
}

function formatQty(cantidad: number, unidad: string) {
  if (isUnitBased(unidad)) {
    return `${cantidad.toLocaleString('es-CL')} ${unidad.toUpperCase()}`;
  }
  // Weight: show in TON
  const ton = cantidad / 1000;
  return `${ton.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} TON`;
}

function formatUSD(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
}

function formatPricePerUnit(totalUsd: number, cantidad: number, unidad: string) {
  if (!cantidad || cantidad === 0) return '-';
  if (isUnitBased(unidad)) {
    const perUnit = totalUsd / cantidad;
    return `${formatUSD(perUnit)}/u`;
  }
  const ton = cantidad / 1000;
  if (ton === 0) return '-';
  const perTon = totalUsd / ton;
  return `${formatUSD(perTon)}/TON`;
}

interface PIMDetailItemsProps {
  pimId: string;
}

export function PIMDetailItems({ pimId }: PIMDetailItemsProps) {
  const { data: items, isLoading } = usePIMItems(pimId);
  const { data: molinos = [] } = useMolinos();
  const molinoById = useMemo(() => {
    const m: Record<string, string> = {};
    molinos.forEach((mol) => { m[mol.id] = `${mol.codigo} - ${mol.nombre}`; });
    return m;
  }, [molinos]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Este PIM no tiene items registrados</p>
      </div>
    );
  }

  const weightItems = items.filter(i => !isUnitBased(i.unidad));
  const unitItems = items.filter(i => isUnitBased(i.unidad));

  const totalTon = weightItems.reduce((s, i) => s + i.cantidad / 1000, 0);
  const totalUnits = unitItems.reduce((s, i) => s + i.cantidad, 0);
  const totalUsd = items.reduce((s, i) => s + (i.total_usd || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-sm px-3 py-1">
          {items.length} materiales
        </Badge>
        {totalTon > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {totalTon.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} TON
          </Badge>
        )}
        {totalUnits > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {totalUnits.toLocaleString('es-CL')} UND
          </Badge>
        )}
        <Badge className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20">
          {formatUSD(totalUsd)}
        </Badge>
      </div>

      {/* Items table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[160px]">Fábrica/Molino</TableHead>
              <TableHead className="text-right w-[120px]">Cantidad</TableHead>
              <TableHead className="text-right w-[120px]">Total USD</TableHead>
              <TableHead className="text-right w-[130px]">Precio Unit.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.codigo_producto}</TableCell>
                <TableCell className="text-sm">{item.descripcion}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.molino_id ? (molinoById[item.molino_id] ?? '—') : 'General'}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatQty(item.cantidad, item.unidad)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatUSD(item.total_usd)}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatPricePerUnit(item.total_usd, item.cantidad, item.unidad)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
