import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileUp, Pencil } from 'lucide-react';
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

export function StepBorradorCartaCredito({ step, pimId, stageKey, pim, userId, userName, userRole }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();
  const { data: docStatus } = useStageDocumentStatus(pimId, ['borrador_lc']);

  const hasDoc = docStatus && docStatus.missingTypes.length === 0;
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Borrador de carta de crédito cargado correctamente</span>
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
          stageName="Borrador Carta de Crédito"
          requiredDocTypes={['borrador_lc']}
          usuario={userName}
          readOnly={true}
        />
      </div>
    );
  }

  const handleComplete = () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'borrador_carta_credito',
        stepName: 'Borrador Carta de Crédito',
        userId,
        userName,
      },
      {
        onSuccess: () => {
          toast.success('Paso completado: Borrador de carta de crédito');
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

      <RequiredDocumentsPanel
        pimId={pimId}
        stageKey={stageKey}
        stageName="Borrador Carta de Crédito"
        requiredDocTypes={['borrador_lc']}
        usuario={userName}
        readOnly={false}
      />

      {hasDoc && !step.completado_en && (
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
          Suba el borrador de carta de crédito para continuar
        </div>
      )}
    </div>
  );
}
