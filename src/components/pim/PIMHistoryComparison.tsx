import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, ArrowRight, Plus, Minus, Equal } from 'lucide-react';
import { usePIMSnapshot, type PIMSnapshotItem } from '@/hooks/usePIMSnapshots';
import { usePIMItems } from '@/hooks/usePIMItems';
import { cn } from '@/lib/utils';

interface Props {
  pimId: string;
  pim: any;
}

function formatUSD(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
}

function formatTon(v: number) {
  return `${v.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} t`;
}

type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

interface DiffItem {
  codigo: string;
  descripcion: string;
  status: DiffStatus;
  original?: PIMSnapshotItem;
  current?: {
    cantidad: number;
    unidad: string;
    precio_unitario_usd: number;
    total_usd: number;
    toneladas: number;
  };
}

export function PIMHistoryComparison({ pimId, pim }: Props) {
  const { data: snapshot, isLoading: isLoadingSnapshot } = usePIMSnapshot(pimId);
  const { data: currentItems, isLoading: isLoadingItems } = usePIMItems(pimId);

  if (isLoadingSnapshot || isLoadingItems) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Cargando historial...
        </CardContent>
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          <History className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p>No hay snapshot de creacion disponible para este PIM.</p>
          <p className="text-xs mt-1">Los snapshots se guardan automaticamente al crear PIMs nuevos.</p>
        </CardContent>
      </Card>
    );
  }

  const originalItems = snapshot.datos.items || [];
  const originalPim = snapshot.datos.pim;

  // Build diff
  const diffItems: DiffItem[] = [];
  const matchedCurrentIds = new Set<string>();

  for (const orig of originalItems) {
    const match = (currentItems || []).find(
      (c) => c.codigo_producto === orig.codigo_producto && !matchedCurrentIds.has(c.id)
    );

    if (match) {
      matchedCurrentIds.add(match.id);
      const isModified =
        match.cantidad !== orig.cantidad ||
        Math.abs(match.precio_unitario_usd - orig.precio_unitario_usd) > 0.01 ||
        Math.abs(match.total_usd - orig.total_usd) > 0.5;

      diffItems.push({
        codigo: orig.codigo_producto,
        descripcion: orig.descripcion,
        status: isModified ? 'modified' : 'unchanged',
        original: orig,
        current: {
          cantidad: match.cantidad,
          unidad: match.unidad,
          precio_unitario_usd: match.precio_unitario_usd,
          total_usd: match.total_usd || 0,
          toneladas: match.toneladas || 0,
        },
      });
    } else {
      diffItems.push({
        codigo: orig.codigo_producto,
        descripcion: orig.descripcion,
        status: 'removed',
        original: orig,
      });
    }
  }

  // Items in current but not in original
  for (const curr of currentItems || []) {
    if (!matchedCurrentIds.has(curr.id)) {
      diffItems.push({
        codigo: curr.codigo_producto,
        descripcion: curr.descripcion,
        status: 'added',
        current: {
          cantidad: curr.cantidad,
          unidad: curr.unidad,
          precio_unitario_usd: curr.precio_unitario_usd,
          total_usd: curr.total_usd || 0,
          toneladas: curr.toneladas || 0,
        },
      });
    }
  }

  // Summary stats
  const addedCount = diffItems.filter((d) => d.status === 'added').length;
  const removedCount = diffItems.filter((d) => d.status === 'removed').length;
  const modifiedCount = diffItems.filter((d) => d.status === 'modified').length;
  const hasChanges = addedCount > 0 || removedCount > 0 || modifiedCount > 0;

  // PIM-level diffs
  const currentTotalUsd = (currentItems || []).reduce((s, i) => s + (i.total_usd || 0), 0);
  const currentTotalTon = (currentItems || []).reduce((s, i) => s + (i.toneladas || 0), 0);
  const usdDiff = currentTotalUsd - (originalPim.total_usd || 0);
  const tonDiff = currentTotalTon - (originalPim.total_toneladas || 0);

  const statusIcons = {
    added: <Plus className="h-3.5 w-3.5 text-green-600" />,
    removed: <Minus className="h-3.5 w-3.5 text-red-600" />,
    modified: <ArrowRight className="h-3.5 w-3.5 text-yellow-600" />,
    unchanged: <Equal className="h-3.5 w-3.5 text-muted-foreground" />,
  };

  const statusColors = {
    added: 'bg-green-50 border-green-200',
    removed: 'bg-red-50 border-red-200',
    modified: 'bg-yellow-50 border-yellow-200',
    unchanged: '',
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Comparacion: Original vs Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">USD Original</p>
              <p className="font-semibold">{formatUSD(originalPim.total_usd || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">USD Actual</p>
              <p className="font-semibold">{formatUSD(currentTotalUsd)}</p>
              {usdDiff !== 0 && (
                <p className={cn('text-xs font-medium', usdDiff > 0 ? 'text-red-600' : 'text-green-600')}>
                  {usdDiff > 0 ? '+' : ''}{formatUSD(usdDiff)}
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Toneladas Original</p>
              <p className="font-semibold">{formatTon(originalPim.total_toneladas || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Toneladas Actual</p>
              <p className="font-semibold">{formatTon(currentTotalTon)}</p>
              {Math.abs(tonDiff) > 0.01 && (
                <p className={cn('text-xs font-medium', tonDiff > 0 ? 'text-blue-600' : 'text-orange-600')}>
                  {tonDiff > 0 ? '+' : ''}{formatTon(tonDiff)}
                </p>
              )}
            </div>
          </div>

          {hasChanges ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {addedCount > 0 && (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  +{addedCount} agregado{addedCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {removedCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-300">
                  -{removedCount} eliminado{removedCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {modifiedCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  {modifiedCount} modificado{modifiedCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">
              Sin cambios en los items desde la creacion del PIM.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Diff Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Detalle de Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8"></TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead className="text-right">Cantidad Orig.</TableHead>
                <TableHead className="text-right">Cantidad Actual</TableHead>
                <TableHead className="text-right">USD Orig.</TableHead>
                <TableHead className="text-right">USD Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diffItems.map((item, idx) => (
                <TableRow
                  key={idx}
                  className={cn(
                    statusColors[item.status],
                    item.status === 'removed' && 'line-through opacity-60'
                  )}
                >
                  <TableCell className="px-2">{statusIcons[item.status]}</TableCell>
                  <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                  <TableCell className="text-sm truncate max-w-[200px]">{item.descripcion}</TableCell>
                  <TableCell className="text-right text-sm">
                    {item.original
                      ? `${item.original.cantidad.toLocaleString('es-CL')} ${item.original.unidad}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.current
                      ? `${item.current.cantidad.toLocaleString('es-CL')} ${item.current.unidad}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.original ? formatUSD(item.original.total_usd) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.current ? formatUSD(item.current.total_usd) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Creation date */}
      <p className="text-xs text-muted-foreground text-center">
        Snapshot tomado el {new Date(snapshot.created_at).toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
}
