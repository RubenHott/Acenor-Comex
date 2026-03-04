import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Shield, Building, AlertTriangle } from 'lucide-react';
import { useStageSteps, type StageStep } from '@/hooks/useStageSteps';
import { useAdvanceStage } from '@/hooks/usePIMTracking';
import { getStageSteps } from '@/lib/stageStepDefinitions';
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

export function StepCierreProceso({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const { data: allSteps } = useStageSteps(pimId, stageKey);
  const advanceStage = useAdvanceStage();
  const stepDefs = getStageSteps(stageKey);

  if (step.status === 'completado') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="h-4 w-4" />
        <span>Proceso 1 cerrado. Avanzado a etapa 2.</span>
      </div>
    );
  }

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';

  // Summary of previous steps
  const previousSteps = (allSteps || []).filter((s) => s.step_key !== 'cierre_proceso');
  const allPreviousComplete = previousSteps.every((s) => s.status === 'completado' || s.status === 'saltado');

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
          toast.success('Proceso 1 cerrado. Avanzando a Firma de Contrato.');
        },
        onError: (err) => {
          toast.error(err.message || 'No se pudo cerrar el proceso');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary card */}
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
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      s.status === 'completado' ? 'text-green-600' : s.status === 'saltado' ? 'text-gray-400' : 'text-yellow-600'
                    }`}
                  >
                    {s.status === 'completado' ? 'Completado' : s.status === 'saltado' ? 'Saltado' : 'Pendiente'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isComex && allPreviousComplete && (
        <div className="flex justify-end">
          <Button
            onClick={handleClose}
            disabled={advanceStage.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {advanceStage.isPending ? 'Cerrando proceso...' : 'Cerrar Proceso y Avanzar a Etapa 2'}
          </Button>
        </div>
      )}

      {!allPreviousComplete && (
        <div className="text-sm text-muted-foreground">
          Todos los pasos anteriores deben estar completados para cerrar el proceso.
        </div>
      )}

      {!isComex && allPreviousComplete && (
        <div className="text-sm text-muted-foreground">
          Solo COMEX puede cerrar este proceso.
        </div>
      )}
    </div>
  );
}
