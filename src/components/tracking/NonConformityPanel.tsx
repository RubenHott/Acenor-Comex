import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Plus, Clock, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, RotateCcw, MessageCircle } from 'lucide-react';
import {
  useNCsByStage,
  useUpdateNCStatus,
  useResolveNC,
  useReopenNC,
  useNCIterations,
  useAddNCIteration,
  NC_ESTADOS,
  NC_PRIORIDADES,
  NC_ITERACION_TIPOS,
  type NoConformidad,
  type NCEstado,
  type NCIteracionTipo,
} from '@/hooks/useNoConformidades';
import { NonConformityCreateDialog } from './NonConformityCreateDialog';
import { cn } from '@/lib/utils';

interface Props {
  pimId: string;
  stageKey: string;
  stageName?: string;
  userId: string;
  userName: string;
  readOnly?: boolean;
}

export function NonConformityPanel({ pimId, stageKey, stageName, userId, userName, readOnly }: Props) {
  const { data: ncs = [] } = useNCsByStage(pimId, stageKey);
  const updateStatus = useUpdateNCStatus();
  const resolveNC = useResolveNC();
  const reopenNC = useReopenNC();
  const addIteration = useAddNCIteration();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [resolveDialogNC, setResolveDialogNC] = useState<NoConformidad | null>(null);
  const [resolucionText, setResolucionText] = useState('');
  const [expandedNC, setExpandedNC] = useState<string | null>(null);
  const [iterationText, setIterationText] = useState('');
  const [iterationType, setIterationType] = useState<NCIteracionTipo>('observacion');
  const [reopenDialogNC, setReopenDialogNC] = useState<NoConformidad | null>(null);
  const [reopenMotivo, setReopenMotivo] = useState('');

  const openNCs = ncs.filter((nc) => nc.estado === 'abierta' || nc.estado === 'en_revision');

  const handleStatusChange = (nc: NoConformidad, nuevoEstado: NCEstado) => {
    updateStatus.mutate({
      ncId: nc.id,
      pimId,
      stageKey,
      nuevoEstado,
      usuario: userName,
      usuarioId: userId,
      ncCodigo: nc.codigo,
    });
  };

  const handleResolve = () => {
    if (!resolveDialogNC || !resolucionText.trim()) return;
    resolveNC.mutate(
      {
        ncId: resolveDialogNC.id,
        pimId,
        stageKey,
        resolucion: resolucionText.trim(),
        usuario: userName,
        usuarioId: userId,
        ncCodigo: resolveDialogNC.codigo,
      },
      {
        onSuccess: () => {
          setResolveDialogNC(null);
          setResolucionText('');
        },
      }
    );
  };

  const handleReopen = () => {
    if (!reopenDialogNC || !reopenMotivo.trim()) return;
    reopenNC.mutate(
      {
        ncId: reopenDialogNC.id,
        pimId,
        stageKey,
        ncCodigo: reopenDialogNC.codigo,
        motivo: reopenMotivo.trim(),
        usuario: userName,
        usuarioId: userId,
      },
      {
        onSuccess: () => {
          setReopenDialogNC(null);
          setReopenMotivo('');
        },
      }
    );
  };

  const handleAddIteration = (ncId: string, ncCodigo: string) => {
    if (!iterationText.trim()) return;
    addIteration.mutate(
      {
        ncId,
        pimId,
        stageKey,
        ncCodigo,
        tipo: iterationType,
        descripcion: iterationText.trim(),
        creadoPor: userId,
        creadoPorNombre: userName,
      },
      {
        onSuccess: () => {
          setIterationText('');
          setIterationType('observacion');
        },
      }
    );
  };

  const getEstadoConfig = (estado: NCEstado) =>
    NC_ESTADOS.find((e) => e.value === estado) || NC_ESTADOS[0];

  const getPrioridadConfig = (prioridad: string) =>
    NC_PRIORIDADES.find((p) => p.value === prioridad) || NC_PRIORIDADES[1];

  const getEstadoIcon = (estado: NCEstado) => {
    switch (estado) {
      case 'abierta': return <XCircle className="h-3.5 w-3.5" />;
      case 'en_revision': return <Eye className="h-3.5 w-3.5" />;
      case 'resuelta': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'cerrada': return <Clock className="h-3.5 w-3.5" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            No Conformidades
            {openNCs.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {openNCs.length} abierta{openNCs.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nueva NC
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {ncs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin no conformidades en esta etapa
            </p>
          ) : (
            <div className="space-y-3">
              {ncs.map((nc) => {
                const estadoCfg = getEstadoConfig(nc.estado);
                const prioridadCfg = getPrioridadConfig(nc.prioridad);

                return (
                  <div
                    key={nc.id}
                    className={cn(
                      'p-3 rounded-lg border text-sm',
                      nc.estado === 'abierta' && 'border-destructive/30 bg-destructive/5',
                      nc.estado === 'en_revision' && 'border-yellow-500/30 bg-yellow-50',
                      nc.estado === 'resuelta' && 'border-green-500/30 bg-green-50',
                      nc.estado === 'cerrada' && 'border-muted bg-muted/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-xs">{nc.codigo}</span>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: estadoCfg.color, color: estadoCfg.color }}
                          >
                            {getEstadoIcon(nc.estado)}
                            <span className="ml-1">{estadoCfg.label}</span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: prioridadCfg.color, color: prioridadCfg.color }}
                          >
                            {prioridadCfg.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">{nc.descripcion}</p>
                        {nc.resolucion && (
                          <p className="mt-1 text-green-700 text-xs">
                            Resolución: {nc.resolucion}
                          </p>
                        )}
                        {nc.fecha_limite && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Límite: {new Date(nc.fecha_limite).toLocaleDateString('es-CL')}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1 shrink-0">
                        {!readOnly && nc.estado === 'abierta' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleStatusChange(nc, 'en_revision')}
                          >
                            Tomar
                          </Button>
                        )}
                        {!readOnly && nc.estado === 'en_revision' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setResolveDialogNC(nc);
                              setResolucionText('');
                            }}
                          >
                            Resolver
                          </Button>
                        )}
                        {!readOnly && nc.estado === 'resuelta' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleStatusChange(nc, 'cerrada')}
                            >
                              Cerrar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive"
                              onClick={() => {
                                setReopenDialogNC(nc);
                                setReopenMotivo('');
                              }}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reabrir
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setExpandedNC(expandedNC === nc.id ? null : nc.id)}
                        >
                          {expandedNC === nc.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable iterations section */}
                    {expandedNC === nc.id && (
                      <NCIterationsSection
                        nc={nc}
                        pimId={pimId}
                        stageKey={stageKey}
                        userId={userId}
                        userName={userName}
                        readOnly={readOnly}
                        iterationText={iterationText}
                        iterationType={iterationType}
                        onIterationTextChange={setIterationText}
                        onIterationTypeChange={setIterationType}
                        onAddIteration={() => handleAddIteration(nc.id, nc.codigo)}
                        isAdding={addIteration.isPending}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NonConformityCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        pimId={pimId}
        stageKey={stageKey}
        stageName={stageName}
        userId={userId}
        userName={userName}
      />

      {/* Resolve Dialog */}
      <Dialog
        open={!!resolveDialogNC}
        onOpenChange={(open) => !open && setResolveDialogNC(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolver {resolveDialogNC?.codigo}</DialogTitle>
            <DialogDescription>
              Ingrese la resolución de la no conformidad
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describa cómo se resolvió el problema..."
            value={resolucionText}
            onChange={(e) => setResolucionText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogNC(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolucionText.trim() || resolveNC.isPending}
            >
              {resolveNC.isPending ? 'Resolviendo...' : 'Resolver NC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Dialog */}
      <Dialog
        open={!!reopenDialogNC}
        onOpenChange={(open) => !open && setReopenDialogNC(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reabrir {reopenDialogNC?.codigo}</DialogTitle>
            <DialogDescription>
              Indique el motivo para reabrir esta no conformidad
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo de reapertura (ej: correccion insuficiente del proveedor)..."
            value={reopenMotivo}
            onChange={(e) => setReopenMotivo(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialogNC(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReopen}
              disabled={!reopenMotivo.trim() || reopenNC.isPending}
            >
              {reopenNC.isPending ? 'Reabriendo...' : 'Reabrir NC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- NC Iterations Sub-component ---

function NCIterationsSection({
  nc,
  pimId,
  stageKey,
  userId,
  userName,
  readOnly,
  iterationText,
  iterationType,
  onIterationTextChange,
  onIterationTypeChange,
  onAddIteration,
  isAdding,
}: {
  nc: NoConformidad;
  pimId: string;
  stageKey: string;
  userId: string;
  userName: string;
  readOnly?: boolean;
  iterationText: string;
  iterationType: NCIteracionTipo;
  onIterationTextChange: (text: string) => void;
  onIterationTypeChange: (tipo: NCIteracionTipo) => void;
  onAddIteration: () => void;
  isAdding: boolean;
}) {
  const { data: iterations = [], isLoading } = useNCIterations(nc.id);

  return (
    <div className="mt-3 pt-3 border-t space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5" />
        <span className="font-medium">
          Iteraciones ({iterations.length})
        </span>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : iterations.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin iteraciones registradas</p>
      ) : (
        <div className="space-y-2">
          {iterations.map((iter) => {
            const tipoLabel = NC_ITERACION_TIPOS.find((t) => t.value === iter.tipo)?.label || iter.tipo;
            return (
              <div
                key={iter.id}
                className={cn(
                  'p-2 rounded border text-xs',
                  iter.tipo === 'correccion_proveedor' && 'bg-blue-50 border-blue-200',
                  iter.tipo === 'observacion' && 'bg-yellow-50 border-yellow-200',
                  iter.tipo === 'respuesta_interna' && 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">
                    #{iter.numero_iteracion}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {tipoLabel}
                  </Badge>
                  <span className="text-muted-foreground">
                    {iter.creado_por_nombre || 'Sistema'}
                  </span>
                  <span className="text-muted-foreground ml-auto">
                    {new Date(iter.created_at).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground">{iter.descripcion}</p>
                {iter.adjuntos && iter.adjuntos.length > 0 && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {iter.adjuntos.map((adj, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">
                        {adj.nombre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add iteration form */}
      {!readOnly && (nc.estado === 'abierta' || nc.estado === 'en_revision') && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex gap-2">
            <Select
              value={iterationType}
              onValueChange={(v) => onIterationTypeChange(v as NCIteracionTipo)}
            >
              <SelectTrigger className="h-7 text-xs w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NC_ITERACION_TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Describir la observacion o correccion..."
            value={iterationText}
            onChange={(e) => onIterationTextChange(e.target.value)}
            rows={2}
            className="text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onAddIteration}
            disabled={!iterationText.trim() || isAdding}
          >
            <Plus className="h-3 w-3 mr-1" />
            {isAdding ? 'Agregando...' : 'Agregar iteracion'}
          </Button>
        </div>
      )}
    </div>
  );
}
