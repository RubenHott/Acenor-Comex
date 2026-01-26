import { usePIMs } from '@/hooks/usePIMs';
import { useSuppliers } from '@/hooks/useSuppliers';
import { PIMStatusBadge } from './PIMStatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PIMStatus } from '@/types/comex';

export function RecentPIMsTable() {
  const { data: pims, isLoading } = usePIMs();
  const { data: suppliers } = useSuppliers();

  const getSupplierName = (id: string) => {
    return suppliers?.find(s => s.id === id)?.nombre ?? 'N/A';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">PIMs Recientes</h3>
        <p className="text-sm text-muted-foreground">Seguimiento de importaciones activas</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[140px]">Código</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="text-right">Monto USD</TableHead>
            <TableHead className="text-right">Toneladas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))
          ) : (
            (pims || []).slice(0, 5).map((pim) => (
              <TableRow key={pim.id} className="table-row-hover">
                <TableCell className="font-mono text-sm font-medium">{pim.codigo}</TableCell>
                <TableCell className="max-w-[200px] truncate">{pim.descripcion}</TableCell>
                <TableCell>{pim.proveedor_nombre || getSupplierName(pim.proveedor_id)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(pim.total_usd || 0)}</TableCell>
                <TableCell className="text-right">{pim.total_toneladas || 0} t</TableCell>
                <TableCell>
                  <PIMStatusBadge status={pim.estado as PIMStatus} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem>Editar PIM</DropdownMenuItem>
                      <DropdownMenuItem>Ver contrato</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
