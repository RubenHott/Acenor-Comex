import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useRequirements } from '@/hooks/useRequirements';
import { usePIMs } from '@/hooks/usePIMs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Plus, 
  Calendar,
  Package,
  DollarSign,
  TrendingUp,
  Edit,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Requirement } from '@/hooks/useRequirements';

export default function RequirementsPage() {
  const { data: requirements, isLoading, error } = useRequirements();
  const { data: pims } = usePIMs();
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // Set first requirement as selected when data loads
  if (requirements && requirements.length > 0 && !selectedRequirement) {
    setSelectedRequirement(requirements[0]);
  }

  // Count PIMs for a requirement
  const countPIMsForRequirement = (requirementId: string) => {
    return pims?.filter(pim => pim.requerimiento_id === requirementId).length || 0;
  };

  // Total PIMs generated
  const totalPIMsGenerated = pims?.length || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      borrador: 'bg-muted text-muted-foreground',
      pendiente: 'bg-warning/10 text-warning',
      aprobado: 'bg-success/10 text-success',
      cerrado: 'bg-info/10 text-info',
    };
    return styles[estado] || styles.borrador;
  };

  const totalToneladas = requirements?.reduce((acc, r) => acc + (r.total_toneladas || 0), 0) || 0;
  const totalUSD = requirements?.reduce((acc, r) => acc + (r.total_usd || 0), 0) || 0;

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Requerimientos Mensuales" subtitle="Gestión de requerimientos de importación por cuadro" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error al cargar requerimientos: {error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
                  <p className="text-2xl font-bold">{requirements?.length || 0}</p>
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
                  <p className="text-2xl font-bold">{totalToneladas} t</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(totalUSD)}</p>
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
                  <p className="text-2xl font-bold">{totalPIMsGenerated}</p>
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
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))
                  ) : (
                    (requirements || []).map((req) => (
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
                            Cuadro: {req.cuadro_id} • {req.total_toneladas || 0}t
                          </p>
                          <p className="text-sm font-medium text-primary mt-1">
                            {formatCurrency(req.total_usd || 0)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))
                  )}
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
                      Cuadro: {selectedRequirement.cuadro_id} • 
                      {selectedRequirement.fecha_creacion && ` Creado el ${new Intl.DateTimeFormat('es-PE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      }).format(new Date(selectedRequirement.fecha_creacion))}`}
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
                  <div className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Kilos</p>
                      <p className="text-xl font-bold">{(selectedRequirement.total_kilos || 0).toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Toneladas</p>
                      <p className="text-xl font-bold">{selectedRequirement.total_toneladas || 0} t</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total USD</p>
                      <p className="text-xl font-bold">{formatCurrency(selectedRequirement.total_usd || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PIMs</p>
                      <p className="text-xl font-bold">{countPIMsForRequirement(selectedRequirement.id)}</p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-lg border border-success/30 bg-success/5">
                      <p className="text-sm text-muted-foreground">Kilos Disponibles</p>
                      <p className="text-xl font-bold text-success">{(selectedRequirement.kilos_disponibles || 0).toLocaleString()} kg</p>
                    </div>
                    <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
                      <p className="text-sm text-muted-foreground">Kilos Consumidos</p>
                      <p className="text-xl font-bold text-warning">{(selectedRequirement.kilos_consumidos || 0).toLocaleString()} kg</p>
                    </div>
                  </div>

                  {/* Observations */}
                  {selectedRequirement.observaciones && (
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-sm font-medium mb-2">Observaciones</p>
                      <p className="text-sm text-muted-foreground">{selectedRequirement.observaciones}</p>
                    </div>
                  )}
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
