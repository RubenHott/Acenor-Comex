import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const BANCOS_CHILE = [
  'Banco de Chile',
  'Banco Santander Chile',
  'Banco Estado',
  'BCI',
  'Banco Itaú Chile',
  'Scotiabank Chile',
  'Banco BICE',
  'Banco Security',
  'Banco Falabella',
  'Banco Ripley',
  'Banco Consorcio',
  'Banco Internacional',
  'HSBC Bank Chile',
  'JP Morgan Chase Chile',
  'Banco BTG Pactual Chile',
  'China Construction Bank Chile',
];

const TASA_REGEX = /^\d+([,]\d{1,4})?$/;

export function StepRegistroBancoTasa({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const proveedorId = pim?.proveedor_id;
  const { data: cuentaVigente } = useCuentaBancariaVigente(proveedorId);

  const [bancoSeleccionado, setBancoSeleccionado] = useState('');
  const [bancoOtro, setBancoOtro] = useState('');
  const [tasaAcordada, setTasaAcordada] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();

  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const datos = step.datos as any;

  const esOtro = bancoSeleccionado === '__otro__';
  const bancoFinal = esOtro ? bancoOtro.trim() : bancoSeleccionado;

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

  const handleTasaChange = (value: string) => {
    // Only allow digits and comma
    const filtered = value.replace(/[^0-9,]/g, '');
    // Only allow one comma
    const parts = filtered.split(',');
    if (parts.length > 2) return;
    // Max 4 decimals after comma
    if (parts.length === 2 && parts[1].length > 4) return;
    setTasaAcordada(filtered);
  };

  const handleRegistrar = () => {
    if (!bancoFinal) {
      toast.error('Seleccione un banco');
      return;
    }
    if (esOtro && !bancoOtro.trim()) {
      toast.error('Ingrese el nombre del banco');
      return;
    }
    if (!tasaAcordada.trim()) {
      toast.error('Ingrese la tasa acordada');
      return;
    }
    if (!TASA_REGEX.test(tasaAcordada)) {
      toast.error('Formato de tasa inválido. Use formato: 950,50 (coma para decimales, máximo 4 decimales)');
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
          banco_seleccionado: bancoFinal,
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

          {cuentaVigente && (
            <p className="text-xs text-muted-foreground">
              Cuenta vigente del proveedor: <strong>{cuentaVigente.banco}</strong> — {cuentaVigente.numero_cuenta} ({cuentaVigente.moneda})
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Banco *</Label>
              <Select value={bancoSeleccionado} onValueChange={(v) => { setBancoSeleccionado(v); if (v !== '__otro__') setBancoOtro(''); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione banco..." />
                </SelectTrigger>
                <SelectContent>
                  {BANCOS_CHILE.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                  <SelectItem value="__otro__">Otro (ingresar manualmente)</SelectItem>
                </SelectContent>
              </Select>

              {esOtro && (
                <Input
                  className="mt-2"
                  value={bancoOtro}
                  onChange={(e) => setBancoOtro(e.target.value)}
                  placeholder="Nombre del banco"
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Tasa cerrada/acordada *</Label>
              <Input
                className="mt-1"
                type="text"
                inputMode="decimal"
                value={tasaAcordada}
                onChange={(e) => handleTasaChange(e.target.value)}
                placeholder="Ej: 950,50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Use coma para decimales (máx. 4)
              </p>
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
