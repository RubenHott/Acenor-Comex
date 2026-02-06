import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { usePIMs, useDeletePIM } from '@/hooks/usePIMs';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePIMSLA, formatSLAForPIM } from '@/hooks/useSLAData';
import { usePIMItems } from '@/hooks/usePIMItems';
import { useAllTrackingStages } from '@/hooks/usePIMTracking';
import { PIMStatusBadge } from '@/components/dashboard/PIMStatusBadge';
import { TrackingProgressMini } from '@/components/tracking/TrackingProgressMini';
import { SLAIndicator } from '@/components/dashboard/SLAIndicator';
import { PIMDetailItems } from '@/components/pim/PIMDetailItems';
import { PIMDetailContract } from '@/components/pim/PIMDetailContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Plus, 
  Filter,
  Ship,
  FileText,
  Clock,
  ChevronRight,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Trash2,
  AlertCircle,
  Pencil,
  Weight,
  Box,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PIM } from '@/hooks/usePIMs';
import type { PIMStatus } from '@/types/comex';
import { toast } from 'sonner';

export default function PIMsPage() {
  const navigate = useNavigate();
  const { data: pims, isLoading, error } = usePIMs();
  const { data: allStagesMap } = useAllTrackingStages();
  const { data: suppliers } = useSuppliers();
  const deletePIMMutation = useDeletePIM();
  
  const [selectedPIM, setSelectedPIM] = useState<PIM | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch SLA and items data for selected PIM
  const { data: slaData, isLoading: isLoadingSLA } = usePIMSLA(selectedPIM?.id);
  const { data: pimItems } = usePIMItems(selectedPIM?.id);
  const formattedSLA = formatSLAForPIM(slaData);

  // Compute real totals from items
  const UNIT_TYPES = ['u', 'und', 'pza', 'pieza', 'unidad'];
  const isUnit = (u: string) => UNIT_TYPES.includes(u.toLowerCase());
  const computedTotalTon = (pimItems || []).filter(i => !isUnit(i.unidad)).reduce((s, i) => s + i.cantidad / 1000, 0);
  const computedTotalUnits = (pimItems || []).filter(i => isUnit(i.unidad)).reduce((s, i) => s + i.cantidad, 0);
  const computedTotalUsd = (pimItems || []).reduce((s, i) => s + (i.total_usd || 0), 0);

  // Set first PIM as selected when data loads
  if (pims && pims.length > 0 && !selectedPIM) {
    setSelectedPIM(pims[0]);
  }

  const handleDeletePIM = useCallback(async (id: string) => {
    try {
      await deletePIMMutation.mutateAsync(id);
      toast.success('PIM eliminado correctamente');
      if (selectedPIM?.id === id) {
        setSelectedPIM(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar el PIM');
    }
  }, [deletePIMMutation, selectedPIM]);

  const filteredPIMs = (pims || []).filter(pim => {
    const matchesSearch = 
      pim.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pim.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pim.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSupplierName = (id: string) => {
    return suppliers?.find(s => s.id === id)?.nombre ?? 'N/A';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Gestión de PIMs" subtitle="Control y seguimiento de importaciones" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error al cargar PIMs: {error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header 
        title="Gestión de PIMs" 
        subtitle="Control y seguimiento de importaciones" 
      />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar PIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="creado">Creado</SelectItem>
                <SelectItem value="en_negociacion">En Negociación</SelectItem>
                <SelectItem value="contrato_validado">Contrato Validado</SelectItem>
                <SelectItem value="en_produccion">En Producción</SelectItem>
                <SelectItem value="en_transito">En Tránsito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gradient-primary" onClick={() => navigate('/comex/pim/crear')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo PIM
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PIMs List */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  PIMs ({filteredPIMs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))
                  ) : (
                    filteredPIMs.map((pim) => (
                      <button
                        key={pim.id}
                        onClick={() => setSelectedPIM(pim)}
                        className={cn(
                          'w-full p-4 text-left transition-colors hover:bg-muted/50 flex items-start justify-between gap-3',
                          selectedPIM?.id === pim.id && 'bg-muted'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono font-medium text-sm">{pim.codigo}</p>
                            {pim.tipo === 'sub-pim' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                Sub-PIM
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {pim.descripcion}
                          </p>
                          <div className="flex items-center gap-3">
                            <PIMStatusBadge status={pim.estado as PIMStatus} size="sm" />
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(pim.total_usd || 0)}
                            </span>
                            {(pim.total_toneladas || 0) > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {pim.total_toneladas} t
                              </span>
                            )}
                          </div>
                          {allStagesMap?.has(pim.id) && (
                            <TrackingProgressMini
                              stages={allStagesMap.get(pim.id)!}
                              className="mt-2"
                            />
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PIM Detail */}
          <div className="lg:col-span-2">
            {selectedPIM ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl font-bold font-mono">
                        {selectedPIM.codigo}
                      </CardTitle>
                      <PIMStatusBadge status={selectedPIM.estado as PIMStatus} />
                    </div>
                    <p className="text-muted-foreground">{selectedPIM.descripcion}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/comex/pim/seguimiento/${selectedPIM.id}`)}
                    >
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Seguimiento
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/comex/pim/editar/${selectedPIM.id}`)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar PIM?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán el PIM y todos sus items asociados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePIM(selectedPIM.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-6">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="sla">SLA</TabsTrigger>
                      <TabsTrigger value="items">Items</TabsTrigger>
                      <TabsTrigger value="documentos">Documentos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6">
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Building2 className="h-4 w-4" />
                            <span className="text-xs">Proveedor</span>
                          </div>
                          <p className="font-medium">{selectedPIM.proveedor_nombre || getSupplierName(selectedPIM.proveedor_id)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs">Monto Total</span>
                          </div>
                          <p className="font-medium text-lg">{formatCurrency(computedTotalUsd || selectedPIM.total_usd || 0)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Weight className="h-4 w-4" />
                            <span className="text-xs">Toneladas</span>
                          </div>
                          <p className="font-medium text-lg">
                            {computedTotalTon > 0 
                              ? `${computedTotalTon.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} t` 
                              : `${selectedPIM.total_toneladas || 0} t`}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Box className="h-4 w-4" />
                            <span className="text-xs">Unidades</span>
                          </div>
                          <p className="font-medium text-lg">
                            {computedTotalUnits > 0 ? computedTotalUnits.toLocaleString('es-CL') : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Date & Payment row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Contrato
                          </h4>
                          {selectedPIM.numero_contrato ? (
                            <div className="space-y-2">
                              <p className="font-mono text-sm">{selectedPIM.numero_contrato}</p>
                              <p className="text-sm text-muted-foreground">
                                Fecha: {formatDate(selectedPIM.fecha_contrato)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Sin contrato asignado</p>
                          )}
                        </div>
                        <div className="p-4 rounded-lg border border-border">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Modalidad de Pago
                          </h4>
                          <div className="space-y-2">
                            <p className="capitalize">
                              {selectedPIM.modalidad_pago.replace(/_/g, ' ')}
                            </p>
                            {selectedPIM.dias_credito && (
                              <p className="text-sm text-muted-foreground">
                                {selectedPIM.dias_credito} días de crédito
                              </p>
                            )}
                            {selectedPIM.porcentaje_anticipo && (
                              <p className="text-sm text-muted-foreground">
                                {selectedPIM.porcentaje_anticipo}% anticipo
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contract conditions */}
                      <PIMDetailContract pim={selectedPIM} />
                    </TabsContent>

                    <TabsContent value="sla" className="space-y-4">
                      {isLoadingSLA ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <SLAIndicator 
                            label="Negociación" 
                            diasEstimados={formattedSLA.negociacion.estimados} 
                            diasReales={formattedSLA.negociacion.reales} 
                            alerta={formattedSLA.negociacion.alerta} 
                          />
                          <SLAIndicator 
                            label="Contrato" 
                            diasEstimados={formattedSLA.contrato.estimados} 
                            diasReales={formattedSLA.contrato.reales} 
                            alerta={formattedSLA.contrato.alerta} 
                          />
                          <SLAIndicator 
                            label="Producción" 
                            diasEstimados={formattedSLA.produccion.estimados} 
                            diasReales={formattedSLA.produccion.reales} 
                            alerta={formattedSLA.produccion.alerta} 
                          />
                          <SLAIndicator 
                            label="Tránsito" 
                            diasEstimados={formattedSLA.transito.estimados} 
                            diasReales={formattedSLA.transito.reales} 
                            alerta={formattedSLA.transito.alerta} 
                          />
                          <SLAIndicator 
                            label="Aduana" 
                            diasEstimados={formattedSLA.aduana.estimados} 
                            diasReales={formattedSLA.aduana.reales} 
                            alerta={formattedSLA.aduana.alerta} 
                          />
                          <SLAIndicator 
                            label="Total" 
                            diasEstimados={formattedSLA.total.estimados} 
                            diasReales={formattedSLA.total.reales} 
                            alerta={formattedSLA.total.alerta} 
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="items">
                      <PIMDetailItems pimId={selectedPIM.id} />
                    </TabsContent>

                    <TabsContent value="documentos">
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Gestión de documentos próximamente...</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                  <Ship className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Selecciona un PIM para ver los detalles</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
