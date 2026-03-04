import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Building, Clock } from 'lucide-react';
import { useCompleteStep, useReactivateStep, useStageSteps, type StageStep } from '@/hooks/useStageSteps';
import { useCuentasBancarias, useApproveByGerencia, useRejectByGerencia } from '@/hooks/useCuentasBancarias';
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

export function StepAprobacionGerencia({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const datos = step.datos as any;
  let cuentaId = datos?.cuenta_id;

  // Fallback: try to get cuenta_id from validacion_cuenta_bancaria step
  const { data: allSteps } = useStageSteps(pimId, stageKey);
  if (!cuentaId && allSteps) {
    const validacionStep = allSteps.find((s) => s.step_key === 'validacion_cuenta_bancaria');
    cuentaId = (validacionStep?.datos as any)?.cuenta_id;
  }

  const proveedorId = pim?.proveedor_id;
  const { data: cuentas } = useCuentasBancarias(proveedorId);
  const approveByGerencia = useApproveByGerencia();
  const rejectByGerencia = useRejectByGerencia();
  const completeStep = useCompleteStep();
  const reactivateStep = useReactivateStep();

  const cuenta = cuentas?.find((c) => c.id === cuentaId) || cuentas?.[0];

  if (step.status === 'completado') {
    const resultado = datos?.resultado;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span>Cuenta bancaria aprobada por Gerencia</span>
        </div>

        {/* Show approved account details */}
        {cuenta && (
          <Card className="bg-green-50/50 border-green-200">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Cuenta Aprobada</span>
                <Badge className="bg-green-100 text-green-800 text-xs ml-auto">Aprobada</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Banco:</span> {cuenta.banco}</p>
                <p><span className="text-muted-foreground">Cuenta:</span> {cuenta.numero_cuenta}</p>
                <p><span className="text-muted-foreground">Moneda:</span> {cuenta.moneda}</p>
                {cuenta.swift_code && <p><span className="text-muted-foreground">SWIFT:</span> {cuenta.swift_code}</p>}
                {cuenta.iban && <p><span className="text-muted-foreground">IBAN:</span> {cuenta.iban}</p>}
                {cuenta.titular && <p><span className="text-muted-foreground">Titular:</span> {cuenta.titular}</p>}
                <p><span className="text-muted-foreground">Proveedor:</span> {pim?.proveedor_nombre || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const isGerencia = userDepartment === 'gerencia' || userRole === 'admin' || userRole === 'manager' || userRole === 'gerente';

  if (!cuenta) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Cargando datos de la cuenta bancaria...
      </div>
    );
  }

  const handleApprove = async () => {
    approveByGerencia.mutate(
      {
        cuentaId: cuenta.id,
        proveedorId,
        aprobadaPor: userId,
        pimId,
        userName,
      },
      {
        onSuccess: async () => {
          // Notify COMEX
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
                titulo: `Cuenta bancaria aprobada — PIM ${pim?.codigo}`,
                mensaje: `Gerencia aprobó la cuenta bancaria del proveedor. Puede cerrar el proceso.`,
                leido: false,
                prioridad: 'media',
                fecha_creacion: now,
              }))
            );
          }

          completeStep.mutate(
            {
              stepId: step.id,
              pimId,
              stageKey,
              stepKey: 'aprobacion_gerencia',
              stepName: 'Aprobación Gerencia',
              userId,
              userName,
              datos: { cuenta_id: cuenta.id, resultado: 'aprobada' },
            },
            {
              onSuccess: () => toast.success('Cuenta bancaria aprobada por Gerencia'),
              onError: (err) => toast.error(err.message),
            }
          );
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleReject = async () => {
    if (!motivoRechazo.trim()) {
      toast.error('Ingrese el motivo del rechazo');
      return;
    }

    rejectByGerencia.mutate(
      {
        cuentaId: cuenta.id,
        proveedorId,
        rechazadaPor: userId,
        motivo: motivoRechazo,
        pimId,
        userName,
      },
      {
        onSuccess: async () => {
          // Notify COMEX
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
                titulo: `Cuenta bancaria rechazada — PIM ${pim?.codigo}`,
                mensaje: `Gerencia rechazó la cuenta bancaria: ${motivoRechazo.slice(0, 100)}`,
                leido: false,
                prioridad: 'alta',
                fecha_creacion: now,
              }))
            );
          }

          // Reactivate step 6
          reactivateStep.mutate(
            {
              pimId,
              stageKey,
              stepKey: 'validacion_cuenta_bancaria',
              motivo: `Rechazada por Gerencia: ${motivoRechazo}`,
              userId,
              userName,
            },
            {
              onSuccess: () => {
                toast.info('Cuenta rechazada. Devuelta a COMEX para corrección.');
                setShowRejectForm(false);
                setMotivoRechazo('');
              },
            }
          );
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Account Summary */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Cuenta Bancaria a Aprobar</span>
          </div>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Banco:</span> {cuenta.banco}</p>
            <p><span className="text-muted-foreground">Cuenta:</span> {cuenta.numero_cuenta}</p>
            <p><span className="text-muted-foreground">Moneda:</span> {cuenta.moneda}</p>
            {cuenta.swift_code && <p><span className="text-muted-foreground">SWIFT:</span> {cuenta.swift_code}</p>}
            {cuenta.iban && <p><span className="text-muted-foreground">IBAN:</span> {cuenta.iban}</p>}
            {cuenta.titular && <p><span className="text-muted-foreground">Titular:</span> {cuenta.titular}</p>}
            <p><span className="text-muted-foreground">Proveedor:</span> {pim?.proveedor_nombre || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {isGerencia ? (
        <>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={approveByGerencia.isPending || completeStep.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar Cuenta
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowRejectForm(true)}
              disabled={rejectByGerencia.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </div>

          {showRejectForm && (
            <div className="space-y-3 p-4 bg-red-50/50 border border-red-200 rounded-lg">
              <Label className="text-xs">Motivo del rechazo *</Label>
              <Textarea
                rows={2}
                placeholder="Explique por qué la cuenta no puede ser aprobada..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>Cancelar</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectByGerencia.isPending || reactivateStep.isPending}
                >
                  Confirmar Rechazo
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando aprobación de Gerencia para la cuenta bancaria
        </div>
      )}
    </div>
  );
}
