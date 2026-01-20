import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { mockRequirements, mockProducts } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Calendar,
  Package,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RequirementsPage() {
  const [selectedRequirement, setSelectedRequirement] = useState(mockRequirements[0]);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (estado: string) => {
    const styles = {
      borrador: 'bg-muted text-muted-foreground',
      pendiente: 'bg-warning/10 text-warning',
      aprobado: 'bg-success/10 text-success',
      cerrado: 'bg-info/10 text-info',
    };
    return styles[estado as keyof typeof styles] || styles.borrador;
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header 
        title="Requerimientos Mensuales" 
        subtitle="Gestión de requerimientos de importación por cuadro" 
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Requerimientos Activos</p>
                  <p className="text-2xl font-bold">{mockRequirements.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Toneladas</p>
                  <p className="text-2xl font-bold">
                    {mockRequirements.reduce((acc, r) => acc + r.totalToneladas, 0)} t
                  </p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monto Total USD</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(mockRequirements.reduce((acc, r) => acc + r.totalUSD, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">PIMs Generados</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requirements List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold">Cuadros de Importación</CardTitle>
                <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gradient-primary">
                      <Plus className="h-4 w-4 mr-1" />
                      Nuevo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nuevo Requerimiento Mensual</DialogTitle>
                      <DialogDescription>
                        Crea un nuevo cuadro de importación para el mes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        Formulario de creación de requerimiento próximamente...
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {mockRequirements.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequirement(req)}
                      className={cn(
                        'w-full p-4 text-left transition-colors hover:bg-muted/50 flex items-center justify-between',
                        selectedRequirement?.id === req.id && 'bg-muted'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{req.mes}</p>
                          <Badge className={getStatusBadge(req.estado)}>
                            {req.estado}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Cuadro: {req.cuadroId} • {req.totalToneladas}t
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">
                          {formatCurrency(req.totalUSD)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requirement Detail */}
          <div className="lg:col-span-2">
            {selectedRequirement ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Requerimiento {selectedRequirement.mes}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cuadro: {selectedRequirement.cuadroId} • 
                      Creado el {new Intl.DateTimeFormat('es-PE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      }).format(selectedRequirement.fechaCreacion)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" className="gradient-accent">
                      Generar PIM
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Productos</p>
                      <p className="text-xl font-bold">{selectedRequirement.productos.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Toneladas</p>
                      <p className="text-xl font-bold">{selectedRequirement.totalToneladas} t</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total USD</p>
                      <p className="text-xl font-bold">{formatCurrency(selectedRequirement.totalUSD)}</p>
                    </div>
                  </div>

                  {/* Products Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Toneladas</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Total USD</TableHead>
                        <TableHead>Última Import.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequirement.productos.map((item) => (
                        <TableRow key={item.id} className="table-row-hover">
                          <TableCell className="font-mono text-sm">{item.codigoProducto}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{item.descripcion}</TableCell>
                          <TableCell className="text-right">
                            {item.cantidadRequerida.toLocaleString()} {item.unidad}
                          </TableCell>
                          <TableCell className="text-right">{item.toneladas}</TableCell>
                          <TableCell className="text-right">${item.precioUnitarioUSD.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.totalUSD)}
                          </TableCell>
                          <TableCell>
                            {item.ultimaImportacion ? (
                              <div className="text-xs">
                                <p className="text-muted-foreground">
                                  {new Intl.DateTimeFormat('es-PE', {
                                    day: '2-digit',
                                    month: 'short',
                                  }).format(item.ultimaImportacion.fecha)}
                                </p>
                                <p className="font-medium">${item.ultimaImportacion.precio}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Selecciona un requerimiento para ver los detalles</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
