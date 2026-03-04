import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Package, Pencil, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { DHLTrackingPanel } from '../../DHLTrackingPanel';
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

export function StepSeguimientoDocsFisicos({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [observaciones, setObservaciones] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();

  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    const datos = step.datos as any;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Documentos fisicos recibidos</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        {datos?.observaciones && (
          <div className="p-2 bg-muted rounded-lg text-sm text-muted-foreground">
            <span className="text-xs font-medium">Observaciones:</span>
            <p>{datos.observaciones}</p>
          </div>
        )}
        {datos?.fecha_recepcion && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Recibido: {new Date(datos.fecha_recepcion).toLocaleDateString('es-CL')}
          </div>
        )}
      </div>
    );
  }

  const handleComplete = async () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'seguimiento_docs_fisicos',
        stepName: 'Seguimiento Docs Fisicos',
        userId,
        userName,
        datos: {
          recibido: true,
          observaciones: observaciones.trim() || undefined,
          fecha_recepcion: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Recepcion de documentos fisicos confirmada.');
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
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Modo edicion (Admin)</Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      )}

      <DHLTrackingPanel
        pimId={pimId}
        currentTrackingCode={pim?.dhl_tracking_code}
        lastStatus={pim?.dhl_last_status}
        lastCheckedAt={pim?.dhl_last_checked_at}
      />

      {isFinanzas ? (
        <>
          <div>
            <Label className="text-xs">Observaciones (opcional)</Label>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder="Notas sobre la recepcion de documentos fisicos..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeStep.isPending}
            >
              <Package className="h-4 w-4 mr-1" />
              {completeStep.isPending ? 'Confirmando...' : 'Confirmar Recepcion de Documentos Fisicos'}
            </Button>
          </div>
        </>
      ) : (
        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando que Finanzas confirme la recepcion de los documentos fisicos.
        </div>
      )}
    </div>
  );
}
