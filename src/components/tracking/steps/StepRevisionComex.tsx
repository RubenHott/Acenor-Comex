import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, FileText, User, Calendar } from 'lucide-react';
import { useCompleteStep, useReactivateStep, useStageSteps, type StageStep } from '@/hooks/useStageSteps';
import { useNCsByStage, useUpdateNCStatus, useReopenNC } from '@/hooks/useNoConformidades';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

export function StepRevisionComex({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: ncs } = useNCsByStage(pimId, stageKey);
  const { data: allSteps } = useStageSteps(pimId, stageKey);
  const completeStep = useCompleteStep();
  const reactivateStep = useReactivateStep();
  const updateNCStatus = useUpdateNCStatus();
  const reopenNC = useReopenNC();

  // Get nc_id: try own datos first, then fall back to declaracion_nc step datos, then find first active NC
  const datos = step.datos as any;
  let ncId = datos?.nc_id;
  if (!ncId && allSteps) {
    const declaracionStep = allSteps.find((s) => s.step_key === 'declaracion_nc');
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
              <span className="text-green-700">Subsanación aceptada por COMEX</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">Subsanación rechazada — devuelta para corrección</span>
            </>
          )}
        </div>

        {/* Show NC details in completed state */}
        {nc && (
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">NC: {nc.codigo}</span>
                <Badge variant="outline" className="text-xs">{nc.estado}</Badge>
              </div>
              <div className="text-sm">
                <span className="text-xs text-muted-foreground">Descripción original:</span>
                <p className="text-muted-foreground">{nc.descripcion}</p>
              </div>
              {nc.resolucion && (
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">Corrección realizada:</span>
                  <p className="text-green-700">{nc.resolucion}</p>
                </div>
              )}
              {nc.evidencia_url && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <a
                    href={nc.evidencia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver archivo corregido
                  </a>
                </div>
              )}
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
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!nc) {
    return <div className="text-sm text-muted-foreground">Cargando datos de la NC...</div>;
  }

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager' || userRole === 'gerente';

  const handleAccept = async () => {
    // Close the NC
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
          // Log acceptance
          supabase.from('pim_activity_log').insert({
            id: generateId(),
            pim_id: pimId,
            stage_key: stageKey,
            tipo: 'nc_accepted',
            descripcion: `COMEX aceptó la subsanación de NC ${nc.codigo}`,
            usuario: userName,
            usuario_id: userId,
            metadata: { nc_id: nc.id },
          });

          // Complete this step
          completeStep.mutate(
            {
              stepId: step.id,
              pimId,
              stageKey,
              stepKey: 'revision_comex',
              stepName: 'Revisión COMEX',
              userId,
              userName,
              datos: { nc_id: nc.id, resultado: 'aceptada' },
            },
            {
              onSuccess: () => toast.success('Subsanación aceptada. Continúa con el contrato firmado.'),
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

    // Reopen the NC
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
          // Log rejection
          supabase.from('pim_activity_log').insert({
            id: generateId(),
            pim_id: pimId,
            stage_key: stageKey,
            tipo: 'nc_rejected',
            descripcion: `COMEX rechazó la subsanación de NC ${nc.codigo}: ${motivoRechazo}`,
            usuario: userName,
            usuario_id: userId,
            metadata: { nc_id: nc.id, motivo: motivoRechazo },
          });

          // Create notification for assigned person/department
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
                      titulo: `NC ${nc.codigo} rechazada — requiere nueva corrección`,
                      mensaje: `COMEX rechazó la subsanación: ${motivoRechazo.slice(0, 100)}`,
                      leido: false,
                      prioridad: 'alta',
                      fecha_creacion: now,
                    }))
                  );
                }
              });
          }

          // Reactivate subsanacion step
          reactivateStep.mutate(
            {
              pimId,
              stageKey,
              stepKey: 'subsanacion_nc',
              motivo: `Rechazada por COMEX: ${motivoRechazo}`,
              userId,
              userName,
            },
            {
              onSuccess: () => {
                toast.info('Subsanación rechazada. Devuelta al área responsable.');
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
              <span className="text-xs text-muted-foreground">Descripción original:</span>
              <p className="text-sm">{nc.descripcion}</p>
            </div>

            {nc.resolucion && (
              <div>
                <span className="text-xs text-muted-foreground">Corrección realizada:</span>
                <p className="text-sm text-green-700">{nc.resolucion}</p>
              </div>
            )}

            {nc.evidencia_url && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <a
                  href={nc.evidencia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver archivo corregido
                </a>
              </div>
            )}

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

      {isComex && nc.estado === 'resuelta' && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={updateNCStatus.isPending || completeStep.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Aceptar Subsanación
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
            placeholder="Explique por qué la subsanación no es aceptable..."
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>
              Cancelar
            </Button>
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

      {!isComex && (
        <div className="text-sm text-muted-foreground">
          Esperando revisión de COMEX sobre la subsanación presentada.
        </div>
      )}
    </div>
  );
}
