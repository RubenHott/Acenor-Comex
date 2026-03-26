import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Pencil } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
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

export function StepCosteoProductos({ step, pimId, stageKey, pim, userId, userName, userRole }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();

  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Costeo de productos enviado a validación</span>
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
          stageName="Costeo de Productos"
          requiredDocTypes={['costeo', 'orden_compra_final', 'factura_gastos_puerto', 'detalle_pim']}
          usuario={userName}
          pimCodigo={pim.codigo}
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
        stepKey: 'costeo_productos',
        stepName: 'Costeo de Productos',
        userId,
        userName,
      },
      {
        onSuccess: () => {
          toast.success('Costeo enviado. Se solicita validación a Finanzas.');
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
        El costeo se realiza en sistema. Opcionalmente puede adjuntar un documento de respaldo.
      </p>

      <RequiredDocumentsPanel
        pimId={pimId}
        stageKey={stageKey}
        stageName="Costeo de Productos"
        requiredDocTypes={['costeo', 'orden_compra_final', 'factura_gastos_puerto', 'detalle_pim']}
        usuario={userName}
        pimCodigo={pim.codigo}
        readOnly={false}
      />

      <div className="flex justify-end">
        <Button size="sm" onClick={handleComplete} disabled={completeStep.isPending}>
          <CheckCircle className="h-4 w-4 mr-1" />
          {completeStep.isPending ? 'Completando...' : 'Enviar a Validación de Finanzas'}
        </Button>
      </div>
    </div>
  );
}
