import { Button } from '@/components/ui/button';
import { CheckCircle, FileUp } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { useStageDocumentStatus } from '@/hooks/usePIMDocuments';
import { RequiredDocumentsPanel } from '../RequiredDocumentsPanel';
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

export function StepContratoFirmado({ step, pimId, stageKey, pim, userId, userName }: Props) {
  const completeStep = useCompleteStep();
  const { data: docStatus } = useStageDocumentStatus(pimId, ['contrato_firmado']);

  const hasDoc = docStatus && docStatus.missingTypes.length === 0;

  if (step.status === 'completado') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="h-4 w-4" />
        <span>Contrato firmado cargado correctamente</span>
      </div>
    );
  }

  const handleComplete = () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'contrato_firmado',
        stepName: 'Contrato Firmado',
        userId,
        userName,
      },
      {
        onSuccess: () => toast.success('Paso completado: Contrato firmado cargado'),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      <RequiredDocumentsPanel
        pimId={pimId}
        stageKey={stageKey}
        stageName="Contrato Firmado"
        requiredDocTypes={['contrato_firmado']}
        usuario={userName}
        readOnly={false}
      />

      {hasDoc && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={completeStep.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {completeStep.isPending ? 'Completando...' : 'Continuar al siguiente paso'}
          </Button>
        </div>
      )}

      {!hasDoc && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <FileUp className="h-3.5 w-3.5" />
          Suba el contrato firmado para continuar
        </div>
      )}
    </div>
  );
}
