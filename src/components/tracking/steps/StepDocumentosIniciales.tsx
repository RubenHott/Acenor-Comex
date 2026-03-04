import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUp, CheckCircle, FileText } from 'lucide-react';
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

const REQUIRED_DOCS = ['contrato', 'cierre_compra'] as const;

export function StepDocumentosIniciales({ step, pimId, stageKey, pim, userId, userName, userRole }: Props) {
  const completeStep = useCompleteStep();
  const { data: docStatus } = useStageDocumentStatus(pimId, [...REQUIRED_DOCS]);

  const missingDocs = docStatus?.missingTypes || [...REQUIRED_DOCS];
  const allDocsUploaded = missingDocs.length === 0;

  if (step.status === 'completado') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="h-4 w-4" />
        <span>Documentos iniciales cargados correctamente</span>
      </div>
    );
  }

  const handleComplete = () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'documentos_iniciales',
        stepName: 'Documentos Iniciales',
        userId,
        userName,
      },
      {
        onSuccess: () => toast.success('Paso 1 completado: Documentos iniciales'),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      <RequiredDocumentsPanel
        pimId={pimId}
        stageKey={stageKey}
        stageName="Documentos Iniciales"
        requiredDocTypes={[...REQUIRED_DOCS]}
        usuario={userName}
        readOnly={false}
      />

      {allDocsUploaded && (
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

      {!allDocsUploaded && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <FileUp className="h-3.5 w-3.5" />
          Faltan documentos: {missingDocs.join(', ')}
        </div>
      )}
    </div>
  );
}
