import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, FileText, Pencil, Ship, Calendar } from 'lucide-react';
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

  const datos = step.datos as any;

  // Logistics fields
  const [nroBl, setNroBl] = useState(datos?.nro_bl || '');
  const [vapor, setVapor] = useState(datos?.vapor || '');
  const [nroInvoice, setNroInvoice] = useState(datos?.nro_invoice || '');
  const [fechaEmbarqueReal, setFechaEmbarqueReal] = useState(datos?.fecha_embarque_real || '');
  const [fechaArribo, setFechaArribo] = useState(datos?.fecha_arribo || '');

  // Sync from datos when editing a completed step
  useEffect(() => {
    if (isEditing && datos) {
      setNroBl(datos.nro_bl || '');
      setVapor(datos.vapor || '');
      setNroInvoice(datos.nro_invoice || '');
      setFechaEmbarqueReal(datos.fecha_embarque_real || '');
      setFechaArribo(datos.fecha_arribo || '');
    }
  }, [isEditing, datos]);

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

        {/* Show saved logistics data */}
        {(datos?.nro_bl || datos?.vapor || datos?.nro_invoice || datos?.fecha_embarque_real || datos?.fecha_arribo) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs bg-muted/30 rounded-lg p-3">
            {datos.nro_bl && (
              <div><span className="text-muted-foreground">Nro BL:</span> <strong>{datos.nro_bl}</strong></div>
            )}
            {datos.vapor && (
              <div><span className="text-muted-foreground">Vapor:</span> <strong>{datos.vapor}</strong></div>
            )}
            {datos.nro_invoice && (
              <div><span className="text-muted-foreground">Invoice:</span> <strong>{datos.nro_invoice}</strong></div>
            )}
            {datos.fecha_embarque_real && (
              <div><span className="text-muted-foreground">Embarque real:</span> <strong>{new Date(datos.fecha_embarque_real).toLocaleDateString('es-CL')}</strong></div>
            )}
            {datos.fecha_arribo && (
              <div><span className="text-muted-foreground">Arribo:</span> <strong>{new Date(datos.fecha_arribo).toLocaleDateString('es-CL')}</strong></div>
            )}
          </div>
        )}

        <RequiredDocumentsPanel
          pimId={pimId}
          stageKey={stageKey}
          stageName="Recepcion Docs Digitales"
          requiredDocTypes={[...REQUIRED_DOCS]}
          usuario={userName}
          pimCodigo={pim.codigo}
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
        datos: {
          docs_subidos: true,
          nro_bl: nroBl || null,
          vapor: vapor || null,
          nro_invoice: nroInvoice || null,
          fecha_embarque_real: fechaEmbarqueReal || null,
          fecha_arribo: fechaArribo || null,
        },
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

          {/* Logistics info inputs */}
          <div className="border rounded-lg p-3 space-y-3 bg-blue-50/30">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
              <Ship className="h-3.5 w-3.5" />
              Datos logísticos del embarque
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nro. BL</Label>
                <Input
                  value={nroBl}
                  onChange={(e) => setNroBl(e.target.value)}
                  placeholder="Ej: MSCUAA123456"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vapor / Buque</Label>
                <Input
                  value={vapor}
                  onChange={(e) => setVapor(e.target.value)}
                  placeholder="Ej: MSC Flaminia"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nro. Invoice</Label>
                <Input
                  value={nroInvoice}
                  onChange={(e) => setNroInvoice(e.target.value)}
                  placeholder="Ej: INV-2024-001"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Fecha embarque real
                </Label>
                <Input
                  type="date"
                  value={fechaEmbarqueReal}
                  onChange={(e) => setFechaEmbarqueReal(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Fecha estimada de arribo
                </Label>
                <Input
                  type="date"
                  value={fechaArribo}
                  onChange={(e) => setFechaArribo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <RequiredDocumentsPanel
            pimId={pimId}
            stageKey={stageKey}
            stageName="Recepcion Docs Digitales"
            requiredDocTypes={[...REQUIRED_DOCS]}
            usuario={userName}
            pimCodigo={pim.codigo}
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
