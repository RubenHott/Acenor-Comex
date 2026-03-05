import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle, Building, Plus, Pencil } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import {
  useCuentasBancarias,
  useCreateCuentaBancaria,
  useValidarCuentaBancaria,
  type CuentaBancaria,
} from '@/hooks/useCuentasBancarias';
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

const MONEDAS = ['USD', 'EUR', 'CLP', 'CNY', 'GBP'];

export function StepValidacionBancaria({ step, pimId, stageKey, pim, userId, userName, userRole }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [iban, setIban] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [paisBanco, setPaisBanco] = useState('');
  const [titular, setTitular] = useState('');

  const proveedorId = pim?.proveedor_id;
  const { data: cuentas } = useCuentasBancarias(proveedorId);
  const createCuenta = useCreateCuentaBancaria();
  const validarCuenta = useValidarCuentaBancaria();
  const completeStep = useCompleteStep();

  const canEdit = userRole === 'admin' || userRole === 'manager';
  const datos = step.datos as any;

  if (step.status === 'completado' && !isEditing) {
    // Find the selected account
    const cuentaId = datos?.cuenta_id;
    const cuentaSeleccionada = cuentas?.find((c) => c.id === cuentaId);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Cuenta bancaria validada y enviada a Gerencia para aprobación</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>

        {cuentaSeleccionada && (
          <div className="bg-green-50/50 border border-green-200 rounded-md py-2 px-3 space-y-1">
            {pim?.proveedor_nombre && (
              <p className="text-xs text-muted-foreground">Proveedor: <span className="font-medium text-foreground">{pim.proveedor_nombre}</span></p>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Building className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="font-medium">{cuentaSeleccionada.banco}</span>
              <span className="text-muted-foreground">|</span>
              <span className="font-mono text-xs">{cuentaSeleccionada.numero_cuenta}</span>
              <span className="text-muted-foreground">|</span>
              <span>{cuentaSeleccionada.moneda}</span>
              {cuentaSeleccionada.swift_code && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <span className="font-mono text-xs">SWIFT: {cuentaSeleccionada.swift_code}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleSelectCuenta = async (cuenta: CuentaBancaria) => {
    // Notify Gerencia
    const { data: gerenciaUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('department', 'gerencia')
      .eq('active', true);

    if (gerenciaUsers && gerenciaUsers.length > 0) {
      const now = new Date().toISOString();
      await supabase.from('notificaciones').insert(
        gerenciaUsers.map((u) => ({
          id: generateId(),
          destinatario_id: u.id,
          pim_id: pimId,
          tipo: 'sistema',
          titulo: `Aprobación de cuenta bancaria — PIM ${pim?.codigo}`,
          mensaje: `Se requiere aprobación de cuenta bancaria del proveedor ${pim?.proveedor_nombre || ''}`,
          leido: false,
          prioridad: 'alta',
          fecha_creacion: now,
        }))
      );
    }

    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'validacion_cuenta_bancaria',
        stepName: 'Validación de Cuenta Bancaria',
        userId,
        userName,
        datos: { cuenta_id: cuenta.id, requiere_nueva_validacion: false },
      },
      {
        onSuccess: () => {
          toast.success('Cuenta bancaria seleccionada. Enviada a Gerencia para aprobación.');
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleCreateAndValidate = () => {
    if (!banco.trim() || !numeroCuenta.trim()) {
      toast.error('Banco y número de cuenta son obligatorios');
      return;
    }

    createCuenta.mutate(
      {
        proveedorId,
        banco,
        numeroCuenta,
        swiftCode: swiftCode || undefined,
        iban: iban || undefined,
        moneda,
        paisBanco: paisBanco || undefined,
        titular: titular || undefined,
      },
      {
        onSuccess: (newCuenta) => {
          // Validate immediately by COMEX
          validarCuenta.mutate(
            {
              cuentaId: newCuenta.id,
              proveedorId,
              validadaPor: userId,
            },
            {
              onSuccess: async () => {
                // Log
                await supabase.from('pim_activity_log').insert({
                  id: generateId(),
                  pim_id: pimId,
                  stage_key: stageKey,
                  tipo: 'bank_validated',
                  descripcion: `Cuenta bancaria creada y validada por COMEX (${banco})`,
                  usuario: userName,
                  usuario_id: userId,
                  metadata: { cuenta_id: newCuenta.id, banco },
                });

                // Notify Gerencia
                const { data: gerenciaUsers } = await supabase
                  .from('user_profiles')
                  .select('id')
                  .eq('department', 'gerencia')
                  .eq('active', true);

                if (gerenciaUsers && gerenciaUsers.length > 0) {
                  const now = new Date().toISOString();
                  await supabase.from('notificaciones').insert(
                    gerenciaUsers.map((u) => ({
                      id: generateId(),
                      destinatario_id: u.id,
                      pim_id: pimId,
                      tipo: 'sistema',
                      titulo: `Aprobación de cuenta bancaria — PIM ${pim?.codigo}`,
                      mensaje: `Nueva cuenta bancaria requiere aprobación de Gerencia`,
                      leido: false,
                      prioridad: 'alta',
                      fecha_creacion: now,
                    }))
                  );
                }

                completeStep.mutate(
                  {
                    stepId: step.id,
                    pimId,
                    stageKey,
                    stepKey: 'validacion_cuenta_bancaria',
                    stepName: 'Validación de Cuenta Bancaria',
                    userId,
                    userName,
                    datos: { cuenta_id: newCuenta.id, requiere_nueva_validacion: true },
                  },
                  {
                    onSuccess: () => {
                      toast.success('Cuenta creada y validada. Enviada a Gerencia para aprobación.');
                      setShowForm(false);
                      setIsEditing(false);
                    },
                  }
                );
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
      {isEditing && (
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Modo edición (Admin)</Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {/* All existing accounts — compact table */}
      {cuentas && cuentas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Cuentas bancarias de <span className="font-medium text-foreground">{pim?.proveedor_nombre || 'proveedor'}</span>:
          </p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Banco</th>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Cuenta</th>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden sm:table-cell">Moneda</th>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden md:table-cell">SWIFT</th>
                  <th className="text-center py-2 px-3 font-medium text-xs text-muted-foreground">Estado</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {cuentas.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={cn(
                      'border-b last:border-b-0 transition-colors',
                      c.validada ? 'hover:bg-green-50/50' : 'opacity-60',
                      idx % 2 === 0 ? 'bg-white' : 'bg-muted/20'
                    )}
                  >
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <Building className={`h-3.5 w-3.5 flex-shrink-0 ${c.validada ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <span className="font-medium truncate max-w-[120px]">{c.banco}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">{c.numero_cuenta}</td>
                    <td className="py-2 px-3 hidden sm:table-cell">{c.moneda}</td>
                    <td className="py-2 px-3 hidden md:table-cell font-mono text-xs">{c.swift_code || '—'}</td>
                    <td className="py-2 px-3 text-center">
                      {c.validada ? (
                        <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0">Validada</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Sin validar</Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {c.validada && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleSelectCuenta(c)}
                          disabled={completeStep.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Seleccionar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create new account button */}
      {!showForm && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {cuentas && cuentas.length > 0 ? 'Crear nueva cuenta bancaria' : 'Agregar cuenta bancaria'}
        </Button>
      )}

      {/* New account form */}
      {showForm && (
        <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-semibold">Nueva Cuenta Bancaria</h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Banco *</Label>
              <Input className="mt-1" value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Nombre del banco" />
            </div>
            <div>
              <Label className="text-xs">Número de cuenta *</Label>
              <Input className="mt-1" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} placeholder="Número de cuenta" />
            </div>
            <div>
              <Label className="text-xs">SWIFT</Label>
              <Input className="mt-1" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} placeholder="Código SWIFT" />
            </div>
            <div>
              <Label className="text-xs">IBAN</Label>
              <Input className="mt-1" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN" />
            </div>
            <div>
              <Label className="text-xs">Moneda</Label>
              <Select value={moneda} onValueChange={setMoneda}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">País del banco</Label>
              <Input className="mt-1" value={paisBanco} onChange={(e) => setPaisBanco(e.target.value)} placeholder="País" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Titular</Label>
              <Input className="mt-1" value={titular} onChange={(e) => setTitular(e.target.value)} placeholder="Nombre del titular" />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button
              size="sm"
              onClick={handleCreateAndValidate}
              disabled={createCuenta.isPending || validarCuenta.isPending}
            >
              {createCuenta.isPending ? 'Creando...' : 'Crear y Validar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
