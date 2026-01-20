import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { mockPIMs, mockSuppliers } from '@/data/mockData';
import { PIMStatusBadge } from '@/components/dashboard/PIMStatusBadge';
import { SLAIndicator } from '@/components/dashboard/SLAIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PIM } from '@/types/comex';

export default function PIMsPage() {
  const [selectedPIM, setSelectedPIM] = useState<PIM | null>(mockPIMs[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPIMs = mockPIMs.filter(pim => {
    const matchesSearch = 
      pim.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pim.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pim.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSupplierName = (id: string) => {
    return mockSuppliers.find(s => s.id === id)?.nombre ?? 'N/A';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

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
          <Button className="gradient-primary">
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
                  {filteredPIMs.map((pim) => (
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
                          <PIMStatusBadge status={pim.estado} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(pim.totalUSD)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-0.5">
                          {Object.entries(pim.slaData).slice(0, 4).map(([key, value]) => (
                            <div
                              key={key}
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                value.alerta === 'verde' ? 'bg-success' :
                                value.alerta === 'amarillo' ? 'bg-warning' : 'bg-destructive'
                              )}
                            />
                          ))}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
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
                      <PIMStatusBadge status={selectedPIM.estado} />
                    </div>
                    <p className="text-muted-foreground">{selectedPIM.descripcion}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
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
                          <p className="font-medium">{getSupplierName(selectedPIM.proveedorId)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">Fecha Creación</span>
                          </div>
                          <p className="font-medium">{formatDate(selectedPIM.fechaCreacion)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs">Monto Total</span>
                          </div>
                          <p className="font-medium text-lg">{formatCurrency(selectedPIM.totalUSD)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Package className="h-4 w-4" />
                            <span className="text-xs">Toneladas</span>
                          </div>
                          <p className="font-medium text-lg">{selectedPIM.totalToneladas} t</p>
                        </div>
                      </div>

                      {/* Contract & Payment Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Contrato
                          </h4>
                          {selectedPIM.numeroContrato ? (
                            <div className="space-y-2">
                              <p className="font-mono text-sm">{selectedPIM.numeroContrato}</p>
                              <p className="text-sm text-muted-foreground">
                                Fecha: {formatDate(selectedPIM.fechaContrato)}
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
                              {selectedPIM.modalidadPago.replace(/_/g, ' ')}
                            </p>
                            {selectedPIM.diasCredito && (
                              <p className="text-sm text-muted-foreground">
                                {selectedPIM.diasCredito} días de crédito
                              </p>
                            )}
                            {selectedPIM.porcentajeAnticipo && (
                              <p className="text-sm text-muted-foreground">
                                {selectedPIM.porcentajeAnticipo}% anticipo
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="sla" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(selectedPIM.slaData).map(([key, value]) => (
                          <SLAIndicator
                            key={key}
                            label={key.replace(/tiempo/i, '').replace(/([A-Z])/g, ' $1').trim()}
                            diasEstimados={value.diasEstimados}
                            diasReales={value.diasReales}
                            alerta={value.alerta}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="items">
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Lista de items del PIM próximamente...</p>
                      </div>
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
