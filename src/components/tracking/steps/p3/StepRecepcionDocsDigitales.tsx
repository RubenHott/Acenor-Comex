import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

const REQUIRED_DOCS = ['factura', 'bl', 'packing_list'] as const;

export function StepRecepcionDocsDigitales({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();
  const { data: docStatus } = useStageDocumentStatus(pimId, [...REQUIRED_DOCS]);

  const allDocsUploaded = docStatus?.missingTypes?.length === 0;
  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Documentos digitales recibidos</span>
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
          stageName="Recepcion Docs Digitales"
          requiredDocTypes={[...REQUIRED_DOCS]}
          usuario={userName}
          readOnly={true}
        />
      </div>
    );
  }

  const handleComplete = async () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'recepcion_docs_digitales',
        stepName: 'Recepcion Docs Digitales',
        userId,
        userName,
        datos: { docs_subidos: true },
      },
      {
        onSuccess: () => {
          toast.success('Documentos digitales confirmados.');
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

      {isComex ? (
        <>
          <p className="text-sm text-muted-foreground">
            Suba los documentos digitales: BL, factura comercial y packing list.
          </p>

          <RequiredDocumentsPanel
            pimId={pimId}
            stageKey={stageKey}
            stageName="Recepcion Docs Digitales"
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
                {completeStep.isPending ? 'Completando...' : 'Confirmar Documentos Recibidos'}
              </Button>
            </div>
          )}

          {!allDocsUploaded && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Suba los 3 documentos requeridos para continuar
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          Esperando que COMEX cargue los documentos digitales.
        </div>
      )}
    </div>
  );
}
