import { mockPIMs, mockSuppliers } from '@/data/mockData';
import { PIMStatusBadge } from './PIMStatusBadge';
import { SLAIndicator } from './SLAIndicator';
import { Button } from '@/components/ui/button';
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

export function RecentPIMsTable() {
  const getSupplierName = (id: string) => {
    return mockSuppliers.find(s => s.id === id)?.nombre ?? 'N/A';
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
            <TableHead>SLA</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockPIMs.map((pim) => (
            <TableRow key={pim.id} className="table-row-hover">
              <TableCell className="font-mono text-sm font-medium">{pim.codigo}</TableCell>
              <TableCell className="max-w-[200px] truncate">{pim.descripcion}</TableCell>
              <TableCell>{getSupplierName(pim.proveedorId)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(pim.totalUSD)}</TableCell>
              <TableCell className="text-right">{pim.totalToneladas} t</TableCell>
              <TableCell>
                <PIMStatusBadge status={pim.estado} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {Object.entries(pim.slaData).slice(0, 3).map(([key, value]) => (
                    <div
                      key={key}
                      className={`h-2 w-2 rounded-full ${
                        value.alerta === 'verde'
                          ? 'bg-success'
                          : value.alerta === 'amarillo'
                          ? 'bg-warning'
                          : 'bg-destructive'
                      }`}
                      title={`${key}: ${value.alerta}`}
                    />
                  ))}
                </div>
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
                    <DropdownMenuItem>Historial SLA</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
