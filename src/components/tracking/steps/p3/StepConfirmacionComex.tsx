import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, FileText, Send, Pencil, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompleteStep, useUpdateStepData, useStageSteps, type StageStep } from '@/hooks/useStageSteps';
import { usePIMDocuments } from '@/hooks/usePIMDocuments';
import { toast } from 'sonner';
import type { Department, UserRole } from '@/types/comex';

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

type ConfirmacionEstado = 'pendiente_confirmacion' | 'recepcion_confirmada';

export function StepConfirmacionComex({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();
  const updateStepData = useUpdateStepData();
  const { data: documents } = usePIMDocuments(pimId);

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const datos = step.datos as any;
  const estado: ConfirmacionEstado = datos?.estado || 'pendiente_confirmacion';

  // Find comprobante_pago document
  const comprobantePago = documents?.find((d: any) => d.tipo === 'comprobante_pago');

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Comprobante confirmado y enviado al agente de aduanas</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        {datos?.fecha_confirmacion && (
          <div className="text-xs text-muted-foreground">
            Fecha de confirmación: {new Date(datos.fecha_confirmacion).toLocaleDateString('es-CL')}
          </div>
        )}
      </div>
    );
  }

  // Step 1: Confirm receipt of comprobante
  const handleConfirmarRecepcion = () => {
    updateStepData.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        datos: {
          ...datos,
          estado: 'recepcion_confirmada',
        },
      },
      {
        onSuccess: () => toast.success('Recepción de comprobante confirmada. Confirme el envío al agente.'),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  // Step 2: Confirm sent to customs agent and complete step
  const handleConfirmarEnvio = () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'confirmacion_comex',
        stepName: 'Confirmación COMEX',
        userId,
        userName,
        datos: {
          recepcion_confirmada: true,
          envio_agente_confirmado: true,
          fecha_confirmacion: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Comprobante confirmado y enviado al agente de aduanas.');
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Modo edición (Admin)</Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {isComex ? (
        <div className="space-y-3">
          {/* Show comprobante link */}
          {comprobantePago && (
            <Card className="bg-gray-50 border">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <a
                    href={comprobantePago.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver Comprobante de Pago
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Confirm receipt */}
          {estado === 'pendiente_confirmacion' && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
              <p className="text-sm">
                Confirme la recepción del comprobante de pago de Finanzas.
              </p>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleConfirmarRecepcion}
                  disabled={updateStepData.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {updateStepData.isPending ? 'Confirmando...' : 'Confirmar Recepción de Comprobante'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm sent to agent */}
          {estado === 'recepcion_confirmada' && (
            <div className="p-4 bg-green-50/50 border border-green-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>Recepción de comprobante confirmada</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Confirme que el comprobante ha sido enviado al agente de aduanas.
              </p>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleConfirmarEnvio}
                  disabled={completeStep.isPending}
                >
                  <Send className="h-4 w-4 mr-1" />
                  {completeStep.isPending ? 'Confirmando...' : 'Confirmar Envío al Agente de Aduanas'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando que COMEX confirme la recepción y envío del comprobante.
        </div>
      )}
    </div>
  );
}
