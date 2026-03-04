import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Building2, Pencil, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
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

export function StepRetiroDocsBanco({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [observaciones, setObservaciones] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();

  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const datos = step.datos as any;

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Documentos retirados del banco y enviados a COMEX</span>
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
        {datos?.fecha_retiro && (
          <div className="text-xs text-muted-foreground">
            Fecha de retiro: {new Date(datos.fecha_retiro).toLocaleDateString('es-CL')}
          </div>
        )}
      </div>
    );
  }

  const handleComplete = async () => {
    // Notify COMEX users that docs have been withdrawn and sent
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
            titulo: `Documentos retirados del banco — PIM ${pim?.codigo}`,
            mensaje: `Finanzas retiró los documentos del banco y los envió a COMEX.`,
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
        stepKey: 'retiro_docs_banco',
        stepName: 'Retiro Documentos del Banco',
        userId,
        userName,
        datos: {
          retiro_confirmado: true,
          observaciones: observaciones.trim() || undefined,
          fecha_retiro: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Retiro confirmado. COMEX ha sido notificado.');
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

      {isFinanzas ? (
        <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h5 className="text-sm font-semibold text-blue-800">Retiro de Documentos del Banco</h5>
          </div>

          <p className="text-sm text-muted-foreground">
            Confirme que los documentos han sido retirados del banco y enviados a COMEX.
          </p>

          <div>
            <Label className="text-xs">Observaciones (opcional)</Label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder="Observaciones sobre el retiro..."
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
              {completeStep.isPending ? 'Confirmando...' : 'Confirmar Retiro y Envío a COMEX'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando que Finanzas retire los documentos del banco.
        </div>
      )}
    </div>
  );
}
