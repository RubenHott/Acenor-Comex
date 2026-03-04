import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Pencil } from 'lucide-react';
import { useCompleteStep, useSkipSteps, type StageStep } from '@/hooks/useStageSteps';
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

export function StepRevisionDocumental({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [revision, setRevision] = useState<'conforme' | 'observaciones' | ''>('');
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();
  const skipSteps = useSkipSteps();

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
  const canInteract = isComex || isFinanzas;
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    const datos = step.datos as any;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {datos?.conforme ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Revision documental conforme — sin discrepancias</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-700">Revision documental con discrepancias — gestion requerida</span>
              </>
            )}
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
      </div>
    );
  }

  const handleConforme = () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'revision_documental',
        stepName: 'Revision Documental',
        userId,
        userName,
        datos: { conforme: true },
      },
      {
        onSuccess: () => {
          // Skip discrepancy steps
          skipSteps.mutate({
            pimId,
            stageKey,
            stepKeys: ['declaracion_discrepancia', 'subsanacion_discrepancia'],
            motivo: 'Revision documental conforme',
            userId,
            userName,
          });
          toast.success('Revision conforme. Pasos de discrepancia saltados.');
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleObservaciones = () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'revision_documental',
        stepName: 'Revision Documental',
        userId,
        userName,
        datos: { conforme: false },
      },
      {
        onSuccess: () => {
          toast.success('Discrepancia detectada. Continua con la Declaracion de Discrepancia.');
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

      <p className="text-sm text-muted-foreground">
        Revise los documentos recibidos y determine si estan conformes.
      </p>

      {canInteract ? (
        <>
          <RadioGroup
            value={revision}
            onValueChange={(v) => setRevision(v as 'conforme' | 'observaciones')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="conforme" id="conforme" />
              <Label htmlFor="conforme" className="font-normal cursor-pointer">
                Conforme — Documentos correctos, sin discrepancias
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="observaciones" id="observaciones" />
              <Label htmlFor="observaciones" className="font-normal cursor-pointer">
                Discrepancia — Se detectaron diferencias que requieren gestion
              </Label>
            </div>
          </RadioGroup>

          {revision === 'conforme' && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleConforme}
                disabled={completeStep.isPending || skipSteps.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmar Conforme
              </Button>
            </div>
          )}

          {revision === 'observaciones' && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleObservaciones}
                disabled={completeStep.isPending}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Levantar Discrepancia
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          Esperando revision documental por parte de COMEX o Finanzas.
        </div>
      )}
    </div>
  );
}
