import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Truck, Pencil } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
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

export function StepCitacionCarga({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [fechaCitacion, setFechaCitacion] = useState('');
  const [transportista, setTransportista] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    const datos = step.datos as any;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Citación de carga registrada</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
          {datos?.fecha_citacion && <p><span className="text-muted-foreground">Fecha:</span> {new Date(datos.fecha_citacion).toLocaleDateString('es-CL')}</p>}
          {datos?.transportista && <p><span className="text-muted-foreground">Transportista:</span> {datos.transportista}</p>}
          {datos?.observaciones && <p><span className="text-muted-foreground">Observaciones:</span> {datos.observaciones}</p>}
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    if (!fechaCitacion) {
      toast.error('Ingrese la fecha de citación de carga');
      return;
    }

    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'citacion_carga',
        stepName: 'Citación de Carga',
        userId,
        userName,
        datos: {
          fecha_citacion: fechaCitacion,
          transportista: transportista.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Citación de carga registrada.');
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
        <>
          <p className="text-sm text-muted-foreground">
            Registre los datos de la citación de carga recibida del transportista.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fecha de citación *</Label>
              <Input type="date" className="mt-1" value={fechaCitacion} onChange={(e) => setFechaCitacion(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Transportista</Label>
              <Input className="mt-1" value={transportista} onChange={(e) => setTransportista(e.target.value)} placeholder="Nombre del transportista" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Observaciones</Label>
            <Textarea className="mt-1" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas adicionales..." />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleComplete} disabled={completeStep.isPending || !fechaCitacion}>
              <Truck className="h-4 w-4 mr-1" />
              {completeStep.isPending ? 'Registrando...' : 'Registrar Citación'}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          Esperando que COMEX registre la citación de carga.
        </div>
      )}
    </div>
  );
}
