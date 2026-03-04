import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Building, DollarSign, Pencil } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { useCuentaBancariaVigente } from '@/hooks/useCuentasBancarias';
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

export function StepRegistroBancoTasa({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const proveedorId = pim?.proveedor_id;
  const { data: cuentaVigente } = useCuentaBancariaVigente(proveedorId);

  const [bancoSeleccionado, setBancoSeleccionado] = useState(cuentaVigente?.banco || '');
  const [tasaAcordada, setTasaAcordada] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();

  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const datos = step.datos as any;

  // Pre-fill from cuenta vigente when it loads
  if (cuentaVigente?.banco && !bancoSeleccionado) {
    setBancoSeleccionado(cuentaVigente.banco);
  }

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Banco y tasa registrados</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>

        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="py-3 px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Banco:</span>
                <strong>{datos?.banco_seleccionado || 'N/A'}</strong>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Tasa acordada:</span>
                <strong>{datos?.tasa_acordada || 'N/A'}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRegistrar = () => {
    if (!bancoSeleccionado.trim()) {
      toast.error('Ingrese el banco seleccionado');
      return;
    }
    if (!tasaAcordada.trim()) {
      toast.error('Ingrese la tasa acordada');
      return;
    }

    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'registro_banco_tasa',
        stepName: 'Registro Banco y Tasa',
        userId,
        userName,
        datos: {
          banco_seleccionado: bancoSeleccionado,
          tasa_acordada: tasaAcordada,
        },
      },
      {
        onSuccess: () => {
          toast.success('Banco y tasa registrados. Continúa con la Solicitud de Firma.');
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
          <h5 className="text-sm font-semibold text-blue-800">Registro de Banco y Tasa</h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Banco seleccionado *</Label>
              <Input
                className="mt-1"
                value={bancoSeleccionado}
                onChange={(e) => setBancoSeleccionado(e.target.value)}
                placeholder="Nombre del banco"
              />
              {cuentaVigente && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Pre-rellenado desde cuenta vigente del proveedor
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs">Tasa cerrada/acordada *</Label>
              <Input
                className="mt-1"
                type="number"
                step="0.01"
                value={tasaAcordada}
                onChange={(e) => setTasaAcordada(e.target.value)}
                placeholder="Ej: 950.50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleRegistrar}
              disabled={completeStep.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {completeStep.isPending ? 'Registrando...' : 'Registrar y Continuar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Esperando que Finanzas registre el banco y la tasa.
        </div>
      )}
    </div>
  );
}
