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
import { AlertTriangle, Plus, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import {
  useNCsByStage,
  useUpdateNCStatus,
  useResolveNC,
  NC_ESTADOS,
  NC_PRIORIDADES,
  type NoConformidad,
  type NCEstado,
} from '@/hooks/useNoConformidades';
import { NonConformityCreateDialog } from './NonConformityCreateDialog';
import { cn } from '@/lib/utils';

interface Props {
  pimId: string;
  stageKey: string;
  stageName?: string;
  userId: string;
  userName: string;
}

export function NonConformityPanel({ pimId, stageKey, stageName, userId, userName }: Props) {
  const { data: ncs = [] } = useNCsByStage(pimId, stageKey);
  const updateStatus = useUpdateNCStatus();
  const resolveNC = useResolveNC();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [resolveDialogNC, setResolveDialogNC] = useState<NoConformidad | null>(null);
  const [resolucionText, setResolucionText] = useState('');

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
          <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva NC
          </Button>
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
                        {nc.estado === 'abierta' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleStatusChange(nc, 'en_revision')}
                          >
                            Tomar
                          </Button>
                        )}
                        {nc.estado === 'en_revision' && (
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
                        {nc.estado === 'resuelta' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleStatusChange(nc, 'cerrada')}
                          >
                            Cerrar
                          </Button>
                        )}
                      </div>
                    </div>
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
    </>
  );
}
