import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Shield, Building, AlertTriangle } from 'lucide-react';
import { useStageSteps, type StageStep } from '@/hooks/useStageSteps';
import { useAdvanceStage } from '@/hooks/usePIMTracking';
import { getStageSteps } from '@/lib/stageStepDefinitions';
import { getStageByKey, TRACKING_STAGES } from '@/lib/trackingChecklists';
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

// Map stage keys to human-readable labels
function getStageLabel(stageKey: string): { processNum: number; nextStageName: string; isLastStage: boolean } {
  const stageIdx = TRACKING_STAGES.findIndex((s) => s.key === stageKey);
  const isLastStage = stageIdx >= TRACKING_STAGES.length - 1;
  const nextStage = stageIdx >= 0 && !isLastStage
    ? TRACKING_STAGES[stageIdx + 1]
    : null;
  return {
    processNum: stageIdx + 1,
    nextStageName: nextStage?.name || 'siguiente etapa',
    isLastStage,
  };
}

export function StepCierreProceso({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const { data: allSteps } = useStageSteps(pimId, stageKey);
  const advanceStage = useAdvanceStage();
  const stepDefs = getStageSteps(stageKey);
  const stageDef = getStageByKey(stageKey);

  const { processNum, nextStageName, isLastStage } = getStageLabel(stageKey);

  // Dynamic permission based on stage's primary department
  const primaryDept = stageDef?.primaryDepartment || 'comex';
  const canClose = userDepartment === primaryDept || userRole === 'admin' || userRole === 'manager';
  const deptLabel = primaryDept === 'comex' ? 'COMEX' : primaryDept === 'finanzas' ? 'Finanzas' : primaryDept;

  // Summary of previous steps
  const previousSteps = (allSteps || []).filter((s) => s.step_key !== 'cierre_proceso');
  const allPreviousComplete = previousSteps.every((s) => s.status === 'completado' || s.status === 'saltado');

  // Always show the summary card (both for completed and active)
  const summaryCard = (
    <Card className="bg-gray-50/50">
      <CardContent className="py-3 px-4">
        <h5 className="text-sm font-semibold mb-3">Resumen del Proceso</h5>
        <div className="space-y-2">
          {previousSteps.map((s) => {
            const def = stepDefs.find((d) => d.key === s.step_key);
            return (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {s.status === 'completado' ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  ) : s.status === 'saltado' ? (
                    <span className="h-3.5 w-3.5 text-gray-400">—</span>
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                  )}
                  <span className={s.status === 'saltado' ? 'text-muted-foreground line-through' : ''}>
                    {def?.name || s.step_key}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {s.completado_en && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(s.completado_en).toLocaleDateString('es-CL')}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      s.status === 'completado' ? 'text-green-600' : s.status === 'saltado' ? 'text-gray-400' : 'text-yellow-600'
                    }`}
                  >
                    {s.status === 'completado' ? 'Completado' : s.status === 'saltado' ? 'Saltado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  if (step.status === 'completado') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span>
            {isLastStage
              ? `Proceso ${processNum} cerrado. PIM finalizado.`
              : `Proceso ${processNum} cerrado. Avanzado a ${nextStageName}.`}
          </span>
        </div>
        {summaryCard}
      </div>
    );
  }

  const handleClose = () => {
    advanceStage.mutate(
      {
        pimId,
        currentStageKey: stageKey,
        modalidadPago: pim?.modalidad_pago || '',
        usuario: userName,
        usuarioId: userId,
        userRole,
      },
      {
        onSuccess: () => {
          toast.success(
            isLastStage
              ? `Proceso ${processNum} cerrado. PIM finalizado.`
              : `Proceso ${processNum} cerrado. Avanzando a ${nextStageName}.`
          );
        },
        onError: (err) => {
          toast.error(err.message || 'No se pudo cerrar el proceso');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {summaryCard}

      {canClose && allPreviousComplete && (
        <div className="flex justify-end">
          <Button
            onClick={handleClose}
            disabled={advanceStage.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {advanceStage.isPending
              ? 'Cerrando proceso...'
              : isLastStage
                ? 'Cerrar Proceso y Finalizar PIM'
                : `Cerrar Proceso y Avanzar a ${nextStageName}`}
          </Button>
        </div>
      )}

      {!allPreviousComplete && (
        <div className="text-sm text-muted-foreground">
          Todos los pasos anteriores deben estar completados para cerrar el proceso.
        </div>
      )}

      {!canClose && allPreviousComplete && (
        <div className="text-sm text-muted-foreground">
          Solo {deptLabel} puede cerrar este proceso.
        </div>
      )}
    </div>
  );
}
