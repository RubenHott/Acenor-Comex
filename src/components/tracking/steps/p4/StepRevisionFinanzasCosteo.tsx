import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, FileText, User, Calendar, Clock } from 'lucide-react';
import { useCompleteStep, useReactivateStep, useStageSteps, type StageStep } from '@/hooks/useStageSteps';
import { useNCsByStage, useUpdateNCStatus, useReopenNC } from '@/hooks/useNoConformidades';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DOCUMENT_TYPES } from '@/services/documentService';
import type { Department, UserRole } from '@/types/comex';

function generateId() { return crypto.randomUUID(); }

interface Props {
  step: StageStep;
  pimId: string;
  stageKey: string;
  pim: any;
  userId: string;
  userName: string;
  userRole?: UserRole;
  userDepartment?: Department;
}

export function StepRevisionFinanzasCosteo({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: ncs } = useNCsByStage(pimId, stageKey);
  const { data: allSteps } = useStageSteps(pimId, stageKey);
  const completeStep = useCompleteStep();
  const reactivateStep = useReactivateStep();
  const updateNCStatus = useUpdateNCStatus();
  const reopenNC = useReopenNC();

  // Get nc_id from own datos or from declaracion_nc_costeo step
  const datos = step.datos as any;
  let ncId = datos?.nc_id;
  if (!ncId && allSteps) {
    const declaracionStep = allSteps.find((s) => s.step_key === 'declaracion_nc_costeo');
    ncId = (declaracionStep?.datos as any)?.nc_id;
  }
  const nc = ncId
    ? ncs?.find((n) => n.id === ncId)
    : ncs?.find((n) => ['abierta', 'en_revision', 'resuelta'].includes(n.estado));

  if (step.status === 'completado') {
    const resultado = (step.datos as any)?.resultado;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          {resultado === 'aceptada' ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700">Correccion aceptada por Finanzas</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">Correccion rechazada — devuelta para nueva subsanacion</span>
            </>
          )}
        </div>

        {nc && (
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">NC: {nc.codigo}</span>
                <Badge variant="outline" className="text-xs">{nc.estado}</Badge>
              </div>
              {nc.resolucion && (
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">Correccion:</span>
                  <p className="text-green-700">{nc.resolucion}</p>
                </div>
              )}
              {(() => {
                const subStep = allSteps?.find((s) => s.step_key === 'subsanacion_nc_costeo');
                const subDatos = subStep?.datos as any;
                const urls: string[] = subDatos?.evidencia_urls || (nc.evidencia_url ? [nc.evidencia_url] : []);
                const types: string[] = subDatos?.doc_types || [];
                if (urls.length === 0) return null;
                return (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Documentos corregidos:</span>
                    {urls.map((url: string, i: number) => {
                      const typeLabel = DOCUMENT_TYPES.find((dt) => dt.value === types[i])?.label || types[i] || 'Archivo';
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{typeLabel}</a>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!nc) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Cargando datos de la NC...
      </div>
    );
  }

  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';

  const handleAccept = async () => {
    updateNCStatus.mutate(
      {
        ncId: nc.id,
        pimId,
        stageKey,
        nuevoEstado: 'cerrada',
        usuario: userName,
        usuarioId: userId,
        ncCodigo: nc.codigo,
      },
      {
        onSuccess: () => {
          supabase.from('pim_activity_log').insert({
            id: generateId(),
            pim_id: pimId,
            stage_key: stageKey,
            tipo: 'nc_accepted',
            descripcion: `Finanzas acepto la subsanacion de NC ${nc.codigo}`,
            usuario: userName,
            usuario_id: userId,
            metadata: { nc_id: nc.id },
          });

          completeStep.mutate(
            {
              stepId: step.id,
              pimId,
              stageKey,
              stepKey: 'revision_finanzas_costeo',
              stepName: 'Revision Finanzas (Costeo)',
              userId,
              userName,
              datos: { nc_id: nc.id, resultado: 'aceptada' },
            },
            {
              onSuccess: () => toast.success('Correccion aceptada. Continua con Recepcion en Sistema.'),
              onError: (err) => toast.error(err.message),
            }
          );
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleReject = () => {
    if (!motivoRechazo.trim()) {
      toast.error('Ingrese el motivo del rechazo');
      return;
    }

    reopenNC.mutate(
      {
        ncId: nc.id,
        pimId,
        stageKey,
        ncCodigo: nc.codigo,
        motivo: motivoRechazo,
        usuario: userName,
        usuarioId: userId,
      },
      {
        onSuccess: () => {
          supabase.from('pim_activity_log').insert({
            id: generateId(),
            pim_id: pimId,
            stage_key: stageKey,
            tipo: 'nc_rejected',
            descripcion: `Finanzas rechazo la subsanacion de NC ${nc.codigo}: ${motivoRechazo}`,
            usuario: userName,
            usuario_id: userId,
            metadata: { nc_id: nc.id, motivo: motivoRechazo },
          });

          // Notify assigned department
          if (nc.departamento_asignado) {
            supabase.from('user_profiles')
              .select('id')
              .eq('department', nc.departamento_asignado)
              .eq('active', true)
              .then(({ data: users }) => {
                if (users && users.length > 0) {
                  const now = new Date().toISOString();
                  supabase.from('notificaciones').insert(
                    users.map((u) => ({
                      id: generateId(),
                      destinatario_id: u.id,
                      pim_id: pimId,
                      tipo: 'nc_created',
                      titulo: `NC ${nc.codigo} rechazada — requiere nueva correccion`,
                      mensaje: `Finanzas rechazo la subsanacion: ${motivoRechazo.slice(0, 100)}`,
                      leido: false,
                      prioridad: 'alta',
                      fecha_creacion: now,
                    }))
                  );
                }
              });
          }

          reactivateStep.mutate(
            {
              pimId,
              stageKey,
              stepKey: 'subsanacion_nc_costeo',
              motivo: `Rechazada por Finanzas: ${motivoRechazo}`,
              userId,
              userName,
            },
            {
              onSuccess: () => {
                toast.info('Correccion rechazada. Devuelta al area responsable para nueva subsanacion.');
                setShowRejectForm(false);
                setMotivoRechazo('');
              },
            }
          );
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* NC Resolution Summary */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="py-3 px-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">NC: {nc.codigo}</span>
            <Badge variant="outline" className="text-xs">{nc.estado}</Badge>
          </div>

          <div className="text-sm space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Descripcion original:</span>
              <p className="text-sm">{nc.descripcion}</p>
            </div>

            {nc.resolucion && (
              <div>
                <span className="text-xs text-muted-foreground">Correccion realizada:</span>
                <p className="text-sm text-green-700">{nc.resolucion}</p>
              </div>
            )}

            {(() => {
              const subStep = allSteps?.find((s) => s.step_key === 'subsanacion_nc_costeo');
              const subDatos = subStep?.datos as any;
              const urls: string[] = subDatos?.evidencia_urls || (nc.evidencia_url ? [nc.evidencia_url] : []);
              const types: string[] = subDatos?.doc_types || [];
              if (urls.length === 0) return null;
              return (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Documentos corregidos:</span>
                  {urls.map((url: string, i: number) => {
                    const typeLabel = DOCUMENT_TYPES.find((dt) => dt.value === types[i])?.label || types[i] || 'Archivo';
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{typeLabel}</a>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {nc.fecha_resolucion && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(nc.fecha_resolucion).toLocaleDateString('es-CL')}
                </span>
                {nc.resuelto_por && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Resuelto por: {nc.resuelto_por}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isFinanzas && nc.estado === 'resuelta' && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={updateNCStatus.isPending || completeStep.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Aceptar Correccion
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowRejectForm(true)}
            disabled={reopenNC.isPending}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rechazar
          </Button>
        </div>
      )}

      {showRejectForm && (
        <div className="space-y-3 p-4 bg-red-50/50 border border-red-200 rounded-lg">
          <Label className="text-xs">Motivo del rechazo *</Label>
          <Textarea
            rows={2}
            placeholder="Explique por que la correccion no es aceptable..."
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>Cancelar</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={reopenNC.isPending || reactivateStep.isPending}
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      )}

      {isFinanzas && nc.estado !== 'resuelta' && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando que el area asignada envie la subsanacion...
        </div>
      )}

      {!isFinanzas && (
        <div className="text-sm text-muted-foreground">
          Esperando revision de Finanzas sobre la subsanacion presentada.
        </div>
      )}
    </div>
  );
}
