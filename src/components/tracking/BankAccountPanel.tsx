import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, CheckCircle, Plus, ShieldCheck, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  useCuentasBancarias,
  useCreateCuentaBancaria,
  useValidarCuentaBancaria,
  type CuentaBancaria,
} from '@/hooks/useCuentasBancarias';
import { toast } from 'sonner';

interface Props {
  proveedorId: string;
  proveedorNombre: string;
  canCreate?: boolean;
  canValidate: boolean;
  validadoPor: string;
  esNuevoProveedor?: boolean;
  onAccountValidated?: () => void;
}

const MONEDAS = ['USD', 'EUR', 'CLP', 'CNY', 'GBP'];

export function BankAccountPanel({
  proveedorId,
  proveedorNombre,
  canCreate = true,
  canValidate,
  validadoPor,
  esNuevoProveedor = false,
  onAccountValidated,
}: Props) {
  const { data: cuentas = [], isLoading } = useCuentasBancarias(proveedorId);
  const createCuenta = useCreateCuentaBancaria();
  const validarCuenta = useValidarCuentaBancaria();

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [form, setForm] = useState({
    banco: '',
    numeroCuenta: '',
    tipoCuenta: '',
    swiftCode: '',
    abaRouting: '',
    iban: '',
    moneda: 'USD',
    paisBanco: '',
    titular: '',
  });

  const resetForm = () => {
    setForm({
      banco: '',
      numeroCuenta: '',
      tipoCuenta: '',
      swiftCode: '',
      abaRouting: '',
      iban: '',
      moneda: 'USD',
      paisBanco: '',
      titular: '',
    });
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!form.banco || !form.numeroCuenta) {
      toast.error('Banco y numero de cuenta son obligatorios');
      return;
    }
    createCuenta.mutate(
      {
        proveedorId,
        banco: form.banco,
        numeroCuenta: form.numeroCuenta,
        tipoCuenta: form.tipoCuenta || undefined,
        swiftCode: form.swiftCode || undefined,
        abaRouting: form.abaRouting || undefined,
        iban: form.iban || undefined,
        moneda: form.moneda,
        paisBanco: form.paisBanco || undefined,
        titular: form.titular || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Cuenta bancaria agregada');
          resetForm();
        },
        onError: () => toast.error('Error al crear cuenta bancaria'),
      }
    );
  };

  const handleValidate = (cuenta: CuentaBancaria) => {
    validarCuenta.mutate(
      {
        cuentaId: cuenta.id,
        proveedorId,
        validadaPor: validadoPor,
      },
      {
        onSuccess: () => {
          toast.success('Cuenta bancaria validada');
          onAccountValidated?.();
        },
        onError: () => toast.error('Error al validar cuenta'),
      }
    );
  };

  const validatedCount = cuentas.filter((c) => c.validada).length;
  const hasValidatedAccount = validatedCount > 0;

  // Condensed mode: provider already has validated accounts → just show a green summary
  if (!isLoading && hasValidatedAccount && !esNuevoProveedor) {
    const validatedAcct = cuentas.find((c) => c.validada)!;
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Cuenta Bancaria Verificada
            </CardTitle>
            <Badge className="bg-green-600 text-white text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verificada
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-800">
            {validatedAcct.banco} — {validatedAcct.moneda} — Cuenta: {validatedAcct.numero_cuenta}
          </p>
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 mt-2"
          >
            {showDetail ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {showDetail ? 'Ocultar detalle' : 'Ver detalle'}
          </button>
          {showDetail && (
            <div className="mt-2 space-y-2">
              {cuentas.map((cuenta) => (
                <div key={cuenta.id} className="text-xs p-2 rounded border bg-white space-y-0.5">
                  <span className="font-medium">{cuenta.banco}</span>
                  <span className="text-muted-foreground"> — {cuenta.moneda} — {cuenta.numero_cuenta}</span>
                  {cuenta.swift_code && <p className="text-muted-foreground">SWIFT: {cuenta.swift_code}</p>}
                  {cuenta.validada && (
                    <p className="text-green-700">
                      Validada el {new Date(cuenta.fecha_validacion!).toLocaleDateString('es-CL')}
                      {cuenta.validada_por && ` por ${cuenta.validada_por}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={esNuevoProveedor && !hasValidatedAccount ? 'border-yellow-300' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Cuentas Bancarias — {proveedorNombre}
          </CardTitle>
          {canCreate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva cuenta
            </Button>
          )}
        </div>
        {esNuevoProveedor && !hasValidatedAccount && (
          <div className="flex items-center gap-2 mt-2 p-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Nuevo proveedor:</strong> Se requiere al menos una cuenta bancaria validada por Gerencia para avanzar esta etapa.
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : cuentas.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin cuentas bancarias registradas para este proveedor.
          </p>
        ) : (
          <div className="space-y-3">
            {cuentas.map((cuenta) => (
              <div
                key={cuenta.id}
                className={`p-3 rounded-lg border text-sm ${
                  cuenta.validada
                    ? 'border-green-300 bg-green-50'
                    : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{cuenta.banco}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {cuenta.moneda}
                      </Badge>
                      {cuenta.validada ? (
                        <Badge className="text-[10px] bg-green-600">
                          <ShieldCheck className="h-3 w-3 mr-0.5" />
                          Validada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-700">
                          Pendiente validacion
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cuenta: {cuenta.numero_cuenta}
                      {cuenta.swift_code && ` | SWIFT: ${cuenta.swift_code}`}
                      {cuenta.iban && ` | IBAN: ${cuenta.iban}`}
                    </p>
                    {cuenta.titular && (
                      <p className="text-xs text-muted-foreground">
                        Titular: {cuenta.titular}
                      </p>
                    )}
                    {cuenta.validada && cuenta.fecha_validacion && (
                      <p className="text-xs text-green-700 mt-1">
                        Validada el{' '}
                        {new Date(cuenta.fecha_validacion).toLocaleDateString('es-CL')}
                        {cuenta.validada_por && ` por ${cuenta.validada_por}`}
                      </p>
                    )}
                  </div>
                  {canValidate && !cuenta.validada && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleValidate(cuenta)}
                      disabled={validarCuenta.isPending}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Validar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <p className="text-sm font-medium">Nueva cuenta bancaria</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Banco *</Label>
                <Input
                  placeholder="Nombre del banco"
                  value={form.banco}
                  onChange={(e) => setForm({ ...form, banco: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">N. Cuenta *</Label>
                <Input
                  placeholder="Numero de cuenta"
                  value={form.numeroCuenta}
                  onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SWIFT</Label>
                <Input
                  placeholder="Codigo SWIFT"
                  value={form.swiftCode}
                  onChange={(e) => setForm({ ...form, swiftCode: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">IBAN</Label>
                <Input
                  placeholder="IBAN"
                  value={form.iban}
                  onChange={(e) => setForm({ ...form, iban: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Moneda</Label>
                <Select value={form.moneda} onValueChange={(v) => setForm({ ...form, moneda: v })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONEDAS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pais del banco</Label>
                <Input
                  placeholder="Pais"
                  value={form.paisBanco}
                  onChange={(e) => setForm({ ...form, paisBanco: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Titular</Label>
                <Input
                  placeholder="Nombre del titular de la cuenta"
                  value={form.titular}
                  onChange={(e) => setForm({ ...form, titular: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!form.banco || !form.numeroCuenta || createCuenta.isPending}
              >
                {createCuenta.isPending ? 'Guardando...' : 'Guardar cuenta'}
              </Button>
            </div>
          </div>
        )}

        {/* Summary */}
        {cuentas.length > 0 && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {validatedCount} de {cuentas.length} cuenta(s) validada(s)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
