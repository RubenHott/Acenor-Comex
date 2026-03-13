import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Truck, Pencil, Plus } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { useTransportistas, useCreateTransportista } from '@/hooks/useTransportistas';
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
  const [transportistaId, setTransportistaId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // New transportista form
  const [showNewForm, setShowNewForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRut, setNuevoRut] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');

  const completeStep = useCompleteStep();
  const { data: transportistas } = useTransportistas();
  const createTransportista = useCreateTransportista();

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  const selectedTransportista = transportistas?.find((t) => t.id === transportistaId);

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
          {datos?.transportista_nombre && <p><span className="text-muted-foreground">Transportista:</span> {datos.transportista_nombre}</p>}
          {datos?.observaciones && <p><span className="text-muted-foreground">Observaciones:</span> {datos.observaciones}</p>}
        </div>
      </div>
    );
  }

  const handleCreateTransportista = () => {
    if (!nuevoNombre.trim()) {
      toast.error('Ingrese el nombre del transportista');
      return;
    }

    createTransportista.mutate(
      {
        nombre: nuevoNombre.trim(),
        rut: nuevoRut.trim() || undefined,
        contactoNombre: nuevoContacto.trim() || undefined,
        contactoTelefono: nuevoTelefono.trim() || undefined,
        createdBy: userId,
      },
      {
        onSuccess: (newTransportista) => {
          setTransportistaId(newTransportista.id);
          setShowNewForm(false);
          setNuevoNombre('');
          setNuevoRut('');
          setNuevoContacto('');
          setNuevoTelefono('');
          toast.success(`Transportista "${newTransportista.nombre}" creado.`);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

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
          transportista_id: transportistaId || undefined,
          transportista_nombre: selectedTransportista?.nombre || undefined,
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
              <div className="flex gap-2 mt-1">
                <Select value={transportistaId} onValueChange={(v) => { setTransportistaId(v); setShowNewForm(false); }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione transportista..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(transportistas || []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}{t.rut ? ` (${t.rut})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  title="Crear nuevo transportista"
                  onClick={() => setShowNewForm(!showNewForm)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {showNewForm && (
            <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
              <h5 className="text-sm font-semibold text-blue-800">Nuevo Transportista</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nombre *</Label>
                  <Input className="mt-1" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Razón social" />
                </div>
                <div>
                  <Label className="text-xs">RUT</Label>
                  <Input className="mt-1" value={nuevoRut} onChange={(e) => setNuevoRut(e.target.value)} placeholder="12.345.678-9" />
                </div>
                <div>
                  <Label className="text-xs">Contacto</Label>
                  <Input className="mt-1" value={nuevoContacto} onChange={(e) => setNuevoContacto(e.target.value)} placeholder="Nombre contacto" />
                </div>
                <div>
                  <Label className="text-xs">Teléfono</Label>
                  <Input className="mt-1" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} placeholder="+56 9 ..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowNewForm(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleCreateTransportista} disabled={createTransportista.isPending}>
                  <Plus className="h-4 w-4 mr-1" />
                  {createTransportista.isPending ? 'Creando...' : 'Crear Transportista'}
                </Button>
              </div>
            </div>
          )}

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
