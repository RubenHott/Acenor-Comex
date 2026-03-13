import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Pencil } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { useStageDocumentStatus } from '@/hooks/usePIMDocuments';
import { toast } from 'sonner';
import type { UserRole } from '@/types/comex';

/** Common props shared by all step components */
export interface StepBaseProps {
  step: StageStep;
  pimId: string;
  stageKey: string;
  pim: any;
  userId: string;
  userName: string;
  userRole?: UserRole;
  userDepartment?: string;
}

interface UseStepBaseConfig {
  stepKey: string;
  stepName: string;
  successMessage: string;
  /** Document types required for this step to be completable (optional) */
  requiredDocTypes?: string[];
}

export function useStepBase(props: StepBaseProps, config: UseStepBaseConfig) {
  const { step, pimId, stageKey, userId, userName, userRole } = props;
  const { stepKey, stepName, successMessage, requiredDocTypes } = config;

  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();

  const { data: docStatus } = useStageDocumentStatus(
    requiredDocTypes && requiredDocTypes.length > 0 ? pimId : undefined,
    requiredDocTypes,
  );

  const canEdit = userRole === 'admin' || userRole === 'manager';
  const allDocsUploaded = requiredDocTypes
    ? (docStatus?.missingTypes?.length ?? requiredDocTypes.length) === 0
    : true;
  const missingDocs = docStatus?.missingTypes ?? requiredDocTypes ?? [];
  const isCompleted = step.status === 'completado';
  const showCompletedView = isCompleted && !isEditing;

  /** Call to complete the step. Pass optional `datos` for extra JSONB data. */
  const handleComplete = useCallback(
    (datos?: Record<string, unknown>) => {
      completeStep.mutate(
        {
          stepId: step.id,
          pimId,
          stageKey,
          stepKey,
          stepName,
          userId,
          userName,
          datos,
        },
        {
          onSuccess: () => {
            toast.success(successMessage);
            setIsEditing(false);
          },
          onError: (err) => toast.error(err.message),
        },
      );
    },
    [step.id, pimId, stageKey, stepKey, stepName, userId, userName, successMessage, completeStep],
  );

  /** Green check + "Modificar" button for completed state header */
  const CompletedHeader = useCallback(
    ({ children }: { children: React.ReactNode }) => (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span>{children}</span>
        </div>
        {canEdit && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3 w-3 mr-1" />
            Modificar
          </Button>
        )}
      </div>
    ),
    [canEdit],
  );

  /** Blue badge + cancel button shown in edit mode */
  const EditModeBanner = useCallback(
    () =>
      isEditing ? (
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            Modo edición (Admin)
          </Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      ) : null,
    [isEditing],
  );

  /** Standard "Complete Step" button (disabled while pending or if docs missing) */
  const CompleteButton = useCallback(
    ({ datos, label, disabled }: { datos?: Record<string, unknown>; label?: string; disabled?: boolean }) => (
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => handleComplete(datos)}
          disabled={completeStep.isPending || disabled}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {completeStep.isPending ? 'Completando...' : label || 'Continuar al siguiente paso'}
        </Button>
      </div>
    ),
    [handleComplete, completeStep.isPending],
  );

  return {
    isEditing,
    setIsEditing,
    canEdit,
    isCompleted,
    showCompletedView,
    completeStep,
    allDocsUploaded,
    missingDocs,
    handleComplete,
    CompletedHeader,
    EditModeBanner,
    CompleteButton,
  };
}
