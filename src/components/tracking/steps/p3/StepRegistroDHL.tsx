import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Truck, Pencil, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { supabase } from '@/integrations/supabase/client';
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

export function StepRegistroDHL({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [codigoDHL, setCodigoDHL] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    const datos = step.datos as any;
    const trackingCode = datos?.dhl_tracking_code || pim?.dhl_tracking_code || '';
    const dhlUrl = `https://www.dhl.com/cl-es/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingCode}`;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Codigo DHL registrado</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        {trackingCode && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Truck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium font-mono">{trackingCode}</span>
            <a
              href={dhlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver en DHL
            </a>
          </div>
        )}
      </div>
    );
  }

  const handleComplete = async () => {
    if (!codigoDHL.trim()) {
      toast.error('Ingrese el codigo de seguimiento DHL');
      return;
    }

    try {
      const { error } = await supabase
        .from('pims')
        .update({ dhl_tracking_code: codigoDHL.trim() })
        .eq('id', pimId);

      if (error) throw error;
    } catch (err: any) {
      toast.error(`Error al guardar codigo DHL: ${err.message}`);
      return;
    }

    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'registro_dhl',
        stepName: 'Registro DHL',
        userId,
        userName,
        datos: { dhl_tracking_code: codigoDHL.trim() },
      },
      {
        onSuccess: () => {
          toast.success('Codigo DHL registrado correctamente.');
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
            Ingrese el codigo de seguimiento DHL para los documentos fisicos.
          </p>

          <div className="flex gap-2">
            <Input
              value={codigoDHL}
              onChange={(e) => setCodigoDHL(e.target.value)}
              placeholder="Codigo DHL (ej: 1234567890)"
              className="flex-1"
            />
            {codigoDHL.trim() && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://www.dhl.com/cl-es/home/tracking/tracking-express.html?submit=1&tracking-id=${codigoDHL.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeStep.isPending || !codigoDHL.trim()}
            >
              <Truck className="h-4 w-4 mr-1" />
              {completeStep.isPending ? 'Registrando...' : 'Registrar Codigo DHL'}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          Esperando que COMEX registre el codigo de seguimiento DHL.
        </div>
      )}
    </div>
  );
}
