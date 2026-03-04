import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Pencil } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { useStageDocumentStatus } from '@/hooks/usePIMDocuments';
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

const REQUIRED_DOCS = ['contrato_firmado'] as const;

export function StepSolicitudFirma({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();
  const { data: docStatus } = useStageDocumentStatus(pimId, [...REQUIRED_DOCS]);

  const allDocsUploaded = docStatus?.missingTypes?.length === 0;
  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Contrato firmado recibido y registrado</span>
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
          stageName="Solicitud de Firma"
          requiredDocTypes={[...REQUIRED_DOCS]}
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
        stepKey: 'solicitud_firma',
        stepName: 'Solicitud de Firma',
        userId,
        userName,
      },
      {
        onSuccess: () => {
          toast.success('Contrato firmado registrado. Continúa con la Recepción de Swift.');
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
        Gestione la firma del contrato y suba el documento firmado.
      </p>

      <RequiredDocumentsPanel
        pimId={pimId}
        stageKey={stageKey}
        stageName="Solicitud de Firma"
        requiredDocTypes={[...REQUIRED_DOCS]}
        usuario={userName}
        readOnly={false}
      />

      {isFinanzas && allDocsUploaded && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={completeStep.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {completeStep.isPending ? 'Completando...' : 'Confirmar Firma Recibida'}
          </Button>
        </div>
      )}

      {!allDocsUploaded && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          Suba el contrato firmado para continuar
        </div>
      )}
    </div>
  );
}
