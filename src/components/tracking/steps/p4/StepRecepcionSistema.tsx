import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Pencil, Package } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { RequiredDocumentsPanel } from '../../RequiredDocumentsPanel';
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

export function StepRecepcionSistema({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Recepción de productos registrada en sistema</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        <RequiredDocumentsPanel
          pimId={pimId}
          stageKey={stageKey}
          stageName="Recepción en Sistema"
          requiredDocTypes={['acta_recepcion']}
          usuario={userName}
          pimCodigo={pim.codigo}
          readOnly={true}
        />
      </div>
    );
  }

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
        <>
          <p className="text-sm text-muted-foreground">
            Confirme la recepción de productos en sistema. Opcionalmente puede adjuntar el acta de recepción.
          </p>

          <RequiredDocumentsPanel
            pimId={pimId}
            stageKey={stageKey}
            stageName="Recepción en Sistema"
            requiredDocTypes={['acta_recepcion']}
            usuario={userName}
            pimCodigo={pim.codigo}
            readOnly={false}
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                completeStep.mutate(
                  {
                    stepId: step.id,
                    pimId,
                    stageKey,
                    stepKey: 'recepcion_sistema',
                    stepName: 'Recepción en Sistema',
                    userId,
                    userName,
                    datos: { recepcion_confirmada: true, fecha_recepcion: new Date().toISOString() },
                  },
                  {
                    onSuccess: () => {
                      toast.success('Recepción en sistema confirmada.');
                      setIsEditing(false);
                    },
                    onError: (err) => toast.error(err.message),
                  }
                );
              }}
              disabled={completeStep.isPending}
            >
              <Package className="h-4 w-4 mr-1" />
              {completeStep.isPending ? 'Confirmando...' : 'Confirmar Recepción en Sistema'}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          Esperando que COMEX confirme la recepción de productos en sistema.
        </div>
      )}
    </div>
  );
}
