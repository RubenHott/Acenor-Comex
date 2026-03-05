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

export function StepValidacionCosteo({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [revision, setRevision] = useState<'conforme' | 'observaciones' | ''>('');
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();
  const skipSteps = useSkipSteps();

  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
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
                <span className="text-green-700">Costeo validado conforme por Finanzas</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-700">Costeo con observaciones — NC requerida</span>
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
        stepKey: 'validacion_costeo',
        stepName: 'Validación de Costeo',
        userId,
        userName,
        datos: { conforme: true },
      },
      {
        onSuccess: () => {
          skipSteps.mutate({
            pimId,
            stageKey,
            stepKeys: ['declaracion_nc_costeo', 'subsanacion_nc_costeo', 'revision_finanzas_costeo'],
            motivo: 'Costeo validado conforme',
            userId,
            userName,
          });
          toast.success('Costeo aprobado. Pasos de NC saltados. Continúa con Recepción en Sistema.');
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
        stepKey: 'validacion_costeo',
        stepName: 'Validación de Costeo',
        userId,
        userName,
        datos: { conforme: false },
      },
      {
        onSuccess: () => {
          toast.success('Observaciones detectadas. Continúa con la Declaración de NC.');
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

      <p className="text-sm text-muted-foreground">
        Revise el costeo de productos y determine si está conforme.
      </p>

      {isFinanzas ? (
        <>
          <RadioGroup
            value={revision}
            onValueChange={(v) => setRevision(v as 'conforme' | 'observaciones')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="conforme" id="costeo-conforme" />
              <Label htmlFor="costeo-conforme" className="font-normal cursor-pointer">
                Conforme — Costeo correcto, sin observaciones
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="observaciones" id="costeo-observaciones" />
              <Label htmlFor="costeo-observaciones" className="font-normal cursor-pointer">
                Con observaciones — Se detectaron problemas en el costeo
              </Label>
            </div>
          </RadioGroup>

          {revision === 'conforme' && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleConforme} disabled={completeStep.isPending || skipSteps.isPending}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Aprobar Costeo
              </Button>
            </div>
          )}

          {revision === 'observaciones' && (
            <div className="flex justify-end">
              <Button size="sm" variant="destructive" onClick={handleObservaciones} disabled={completeStep.isPending}>
                <AlertTriangle className="h-4 w-4 mr-1" />
                Confirmar Observaciones
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          Esperando validación del costeo por parte de Finanzas.
        </div>
      )}
    </div>
  );
}
