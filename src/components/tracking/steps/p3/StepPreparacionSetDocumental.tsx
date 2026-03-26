import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, FileStack, Pencil, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { RequiredDocumentsPanel } from '../../RequiredDocumentsPanel';
import { toast } from 'sonner';
import type { Department, UserRole } from '@/types/comex';
import type { DocumentType } from '@/lib/trackingChecklists';

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

const CHECKLIST_ITEMS = [
  'BL original',
  'Factura comercial',
  'Packing list',
  'Certificado de origen (si aplica)',
  'Certificado de calidad (si aplica)',
  'Seguro Chubb',
  'Otros documentos requeridos por agente',
];

const SET_DOC_TYPES: DocumentType[] = [
  'set_doc_bl',
  'set_doc_factura',
  'set_doc_packing',
  'set_doc_cert_origen',
  'set_doc_cert_calidad',
  'seguro_chubb',
  'set_doc_otros',
];

export function StepPreparacionSetDocumental({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [observaciones, setObservaciones] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const datos = step.datos as any;

  const handleToggleItem = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Set documental preparado y enviado al agente de aduanas</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        {datos?.observaciones && (
          <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md border">
            <span className="text-xs font-medium text-gray-500">Observaciones:</span>
            <p className="mt-1">{datos.observaciones}</p>
          </div>
        )}

        <RequiredDocumentsPanel
          pimId={pimId}
          stageKey={stageKey}
          stageName="Set Documental"
          requiredDocTypes={SET_DOC_TYPES}
          usuario={userName}
          readOnly
          pimCodigo={pim?.codigo}
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
        stepKey: 'preparacion_set_documental',
        stepName: 'Preparación Set Documental',
        userId,
        userName,
        datos: {
          set_preparado: true,
          observaciones: observaciones.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Set documental confirmado como preparado.');
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

      {isComex ? (
        <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FileStack className="h-4 w-4 text-blue-600" />
            <h5 className="text-sm font-semibold text-blue-800">Preparación del Set Documental</h5>
          </div>

          <p className="text-sm text-muted-foreground">
            Verifique que todos los documentos necesarios estén listos antes de enviar al agente de aduanas.
          </p>

          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item} className="flex items-center space-x-2">
                <Checkbox
                  id={`check-${item}`}
                  checked={checkedItems[item] || false}
                  onCheckedChange={() => handleToggleItem(item)}
                />
                <label
                  htmlFor={`check-${item}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {item}
                </label>
              </div>
            ))}
          </div>

          <div>
            <Label className="text-xs">Observaciones (opcional)</Label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder="Observaciones sobre el set documental..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeStep.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {completeStep.isPending ? 'Confirmando...' : 'Confirmar Set Preparado'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando que COMEX prepare el set documental.
        </div>
      )}

      {/* Document upload panel for set documental */}
      <RequiredDocumentsPanel
        pimId={pimId}
        stageKey={stageKey}
        stageName="Set Documental"
        requiredDocTypes={SET_DOC_TYPES}
        usuario={userName}
        pimCodigo={pim?.codigo}
      />
    </div>
  );
}
