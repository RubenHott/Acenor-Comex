import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, FileText, Pencil, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompleteStep, useStageSteps, type StageStep } from '@/hooks/useStageSteps';
import { useStageDocumentStatus } from '@/hooks/usePIMDocuments';
import { RequiredDocumentsPanel } from '../../RequiredDocumentsPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Department, UserRole } from '@/types/comex';

function generateId() { return crypto.randomUUID(); }

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

const REQUIRED_DOCS = ['comprobante_pago'] as const;

export function StepGestionPagoInternacion({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();
  const { data: steps } = useStageSteps(pimId, stageKey);
  const { data: docStatus } = useStageDocumentStatus(pimId, [...REQUIRED_DOCS]);

  const allDocsUploaded = docStatus?.missingTypes?.length === 0;
  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const datos = step.datos as any;

  // Read solicitud_pago_internacion step datos to show requested amount
  const solicitudStep = steps?.find((s) => s.step_key === 'solicitud_pago_internacion');
  const solicitudDatos = solicitudStep?.datos as any;

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Pago realizado — Comprobante registrado</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        {datos?.fecha_pago && (
          <div className="text-xs text-muted-foreground">
            Fecha de pago: {new Date(datos.fecha_pago).toLocaleDateString('es-CL')}
          </div>
        )}
        <RequiredDocumentsPanel
          pimId={pimId}
          stageKey={stageKey}
          stageName="Gestión Pago Internación"
          requiredDocTypes={[...REQUIRED_DOCS]}
          usuario={userName}
          readOnly={true}
        />
      </div>
    );
  }

  const handleComplete = async () => {
    // Notify COMEX users
    try {
      const { data: comexUsers } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('department', 'comex')
        .eq('active', true);

      if (comexUsers && comexUsers.length > 0) {
        const now = new Date().toISOString();
        await supabase.from('notificaciones').insert(
          comexUsers.map((u) => ({
            id: generateId(),
            destinatario_id: u.id,
            pim_id: pimId,
            tipo: 'sistema',
            titulo: `Pago de internación realizado — PIM ${pim?.codigo}`,
            mensaje: `Finanzas realizó el pago de internación y registró el comprobante.`,
            leido: false,
            prioridad: 'alta',
            fecha_creacion: now,
          }))
        );
      }
    } catch (err) {
      console.error('Error sending notifications:', err);
    }

    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'gestion_pago_internacion',
        stepName: 'Gestión Pago Internación',
        userId,
        userName,
        datos: {
          pago_realizado: true,
          fecha_pago: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Pago registrado. COMEX ha sido notificado.');
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

      {/* Show requested amount from solicitud step */}
      {solicitudDatos?.monto_internacion && (
        <Card className="bg-yellow-50/50 border-yellow-200">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <span className="text-muted-foreground">Monto solicitado:</span>
              <strong>${solicitudDatos.monto_internacion} {solicitudDatos.moneda || ''}</strong>
            </div>
            {solicitudDatos.descripcion && (
              <p className="text-xs text-muted-foreground mt-1">{solicitudDatos.descripcion}</p>
            )}
          </CardContent>
        </Card>
      )}

      {isFinanzas ? (
        <>
          <p className="text-sm text-muted-foreground">
            Realice el pago de internación y suba el comprobante de pago.
          </p>

          <RequiredDocumentsPanel
            pimId={pimId}
            stageKey={stageKey}
            stageName="Gestión Pago Internación"
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
                {completeStep.isPending ? 'Completando...' : 'Confirmar Pago Realizado'}
              </Button>
            </div>
          )}

          {!allDocsUploaded && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Suba el comprobante de pago para continuar
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando que Finanzas realice el pago y registre el comprobante.
        </div>
      )}
    </div>
  );
}
