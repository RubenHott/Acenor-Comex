import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { usePIMsWithItems, useDeletePIM } from '@/hooks/usePIMs';
import { useTrackingDashboard } from '@/hooks/useTrackingDashboard';
import { useCuadros } from '@/hooks/useCuadros';
import { useAllPIMPuertos } from '@/hooks/usePuertos';
import { usePIMPermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { PIMFullCard } from '@/components/pim/PIMFullCard';
import { PIMSpreadsheetView } from '@/components/pim/PIMSpreadsheetView';
import { TRACKING_STAGES } from '@/lib/trackingChecklists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Plus,
  Filter,
  Package,
  AlertCircle,
  ArrowUpDown,
  Ship,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Grid3X3,
  LayoutGrid,
  Table2,
} from 'lucide-react';

type ViewMode = 'cards' | 'spreadsheet';
type SortOption = 'dias_desc' | 'dias_asc' | 'monto_desc' | 'codigo';

export default function PIMsPage() {
  const navigate = useNavigate();
  const { data: pims, isLoading, error } = usePIMsWithItems();
  const { data: trackingMap } = useTrackingDashboard();
  const { data: cuadros } = useCuadros();
  const { data: puertosMap } = useAllPIMPuertos();
  const perms = usePIMPermissions();
  const deletePIM = useDeletePIM();

  const handleDeletePIM = useCallback(async (id: string) => {
    try {
      await deletePIM.mutateAsync(id);
      toast.success('PIM eliminado');
    } catch {
      toast.error('Error al eliminar el PIM');
    }
  }, [deletePIM]);

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [cuadroFilter, setCuadroFilter] = useState<string>('all');
  const [articuloSearch, setArticuloSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('dias_desc');
  const [searchTerm, setSearchTerm] = useState('');

  const cuadroMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cuadros || []) {
      map.set(c.id, c.codigo);
    }
    return map;
  }, [cuadros]);

  // Filter + sort PIMs
  const filteredPIMs = useMemo(() => {
    let result = (pims || []).filter((pim) => {
      const matchesSearch =
        pim.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pim.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pim.proveedor_nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || pim.estado === statusFilter;

      let matchesStage = true;
      if (stageFilter !== 'all') {
        const info = trackingMap?.get(pim.id);
        if (stageFilter === 'sin_tracking') {
          matchesStage = !info;
        } else if (stageFilter === 'completado') {
          matchesStage = !!info?.allComplete;
        } else {
          matchesStage = info?.currentStageKey === stageFilter;
        }
      }

      const matchesCuadro = cuadroFilter === 'all' || pim.cuadro_id === cuadroFilter;

      const artLower = articuloSearch.toLowerCase();
      const matchesArticulo = !articuloSearch || ((pim as any).items || []).some(
        (item: any) =>
          item.codigo_producto?.toLowerCase().includes(artLower) ||
          item.descripcion?.toLowerCase().includes(artLower)
      );

      return matchesSearch && matchesStatus && matchesStage && matchesCuadro && matchesArticulo;
    });

    result = [...result].sort((a, b) => {
      const ta = trackingMap?.get(a.id);
      const tb = trackingMap?.get(b.id);
      switch (sortBy) {
        case 'dias_desc':
          return (tb?.diasEnProceso || 0) - (ta?.diasEnProceso || 0);
        case 'dias_asc':
          return (ta?.diasEnProceso || 0) - (tb?.diasEnProceso || 0);
        case 'monto_desc':
          return (b.total_usd || 0) - (a.total_usd || 0);
        case 'codigo':
          return a.codigo.localeCompare(b.codigo);
        default:
          return 0;
      }
    });

    return result;
  }, [pims, searchTerm, statusFilter, stageFilter, cuadroFilter, articuloSearch, trackingMap, sortBy]);

  // Summary stats
  const allPims = pims || [];
  const activePIMs = allPims.filter((p) => p.estado !== 'cerrado');
  const totalUSD = activePIMs.reduce((s, p) => s + (p.total_usd || 0), 0);
  const totalTons = activePIMs.reduce((s, p) => s + (p.total_toneladas || 0), 0);
  const alertCount = activePIMs.filter((p) => {
    const t = trackingMap?.get(p.id);
    return t && t.slaStatus === 'rojo';
  }).length;
  const completedCount = allPims.filter((p) => {
    const t = trackingMap?.get(p.id);
    return t?.allComplete || p.estado === 'cerrado';
  }).length;

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

      <div className="p-6 space-y-5">
        {/* Summary Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="p-2 rounded-lg bg-blue-50">
              <Ship className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">PIMs Activos</p>
              <p className="text-lg font-bold">{activePIMs.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="p-2 rounded-lg bg-emerald-50">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Monto Total</p>
              <p className="text-lg font-bold">
                {totalUSD >= 1000000
                  ? `USD ${(totalUSD / 1000000).toFixed(1)}M`
                  : `USD ${(totalUSD / 1000).toFixed(0)}K`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="p-2 rounded-lg bg-violet-50">
              <BarChart3 className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Toneladas</p>
              <p className="text-lg font-bold">
                {totalTons.toLocaleString('es-CL', { maximumFractionDigits: 0 })} t
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Completados</p>
              <p className="text-lg font-bold">{completedCount}</p>
            </div>
          </div>
          {alertCount > 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-red-600 font-semibold">Alertas SLA</p>
                <p className="text-lg font-bold text-red-700">{alertCount}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="p-2 rounded-lg bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Alertas SLA</p>
                <p className="text-lg font-bold text-green-600">0</p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, descripción o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  size="sm"
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  className="h-8 px-3 rounded-none"
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'spreadsheet' ? 'default' : 'ghost'}
                  className="h-8 px-3 rounded-none"
                  onClick={() => setViewMode('spreadsheet')}
                  title="Vista Estatus PIMs Chile"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </div>
              <Button className="gradient-primary" onClick={() => navigate('/comex/pim/crear')}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo PIM
              </Button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="creado">Creado</SelectItem>
                <SelectItem value="en_negociacion">En Negociación</SelectItem>
                <SelectItem value="contrato_validado">Contrato Validado</SelectItem>
                <SelectItem value="en_produccion">En Producción</SelectItem>
                <SelectItem value="en_transito">En Tránsito</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <Package className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {TRACKING_STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.name}
                  </SelectItem>
                ))}
                <SelectItem value="completado">Completados</SelectItem>
                <SelectItem value="sin_tracking">Sin seguimiento</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cuadroFilter} onValueChange={setCuadroFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <Grid3X3 className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Cuadro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cuadros</SelectItem>
                {(cuadros || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-[180px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Buscar artículo..."
                value={articuloSearch}
                onChange={(e) => setArticuloSearch(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dias_desc">Más urgente primero</SelectItem>
                <SelectItem value="dias_asc">Menos urgente primero</SelectItem>
                <SelectItem value="monto_desc">Mayor monto</SelectItem>
                <SelectItem value="codigo">Código</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground ml-2">
              {filteredPIMs.length} de {allPims.length} PIMs
            </span>
          </div>
        </div>

        {/* PIM Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-3 w-64" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-1 flex-1" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-1 flex-1" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-1 flex-1" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPIMs.length === 0 ? (
          <div className="text-center py-16">
            <Ship className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-1">
              No se encontraron PIMs
            </h3>
            <p className="text-sm text-muted-foreground/60">
              Ajusta los filtros o crea un nuevo PIM para comenzar.
            </p>
          </div>
        ) : viewMode === 'spreadsheet' ? (
          <PIMSpreadsheetView
            pims={filteredPIMs.map((pim) => ({
              id: pim.id,
              codigo: pim.codigo,
              descripcion: pim.descripcion,
              estado: pim.estado,
              proveedor_nombre: pim.proveedor_nombre || null,
              total_usd: pim.total_usd || 0,
              total_toneladas: pim.total_toneladas || 0,
              cuadroNombre: cuadroMap.get(pim.cuadro_id) || null,
              origen: pim.origen || null,
              fecha_embarque: pim.fecha_embarque || null,
              fecha_creacion: pim.fecha_creacion || null,
              molino_nombre: pim.molino_nombre || null,
              modalidad_pago: pim.modalidad_pago || null,
              condicion_precio: pim.condicion_precio || null,
              fecha_contrato: pim.fecha_contrato || null,
              numero_contrato: pim.numero_contrato || null,
              porcentaje_anticipo: pim.porcentaje_anticipo ?? null,
              puerto: puertosMap?.get(pim.id) || null,
              items: ((pim as any).items || []).map((item: any) => ({
                codigo_producto: item.codigo_producto,
                descripcion: item.descripcion,
                unidad: item.unidad,
                cantidad: item.cantidad,
                toneladas: item.toneladas,
                precio_unitario_usd: item.precio_unitario_usd,
                total_usd: item.total_usd,
                espesor: item.producto?.espesor ?? null,
                familia: item.producto?.categoria || null,
                ancho: item.producto?.ancho ?? null,
              })),
            }))}
            trackingMap={trackingMap}
          />
        ) : (
          <div className="space-y-3">
            {filteredPIMs.map((pim) => (
              <PIMFullCard
                key={pim.id}
                pim={{
                  id: pim.id,
                  codigo: pim.codigo,
                  descripcion: pim.descripcion,
                  estado: pim.estado,
                  proveedor_nombre: pim.proveedor_nombre || null,
                  total_usd: pim.total_usd || 0,
                  total_toneladas: pim.total_toneladas || 0,
                  cuadroNombre: cuadroMap.get(pim.cuadro_id) || null,
                  origen: pim.origen || null,
                  fecha_embarque: pim.fecha_embarque || null,
                  fecha_creacion: pim.fecha_creacion || null,
                }}
                tracking={trackingMap?.get(pim.id)}
                canDelete={perms.canDeletePIM}
                onDelete={handleDeletePIM}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
