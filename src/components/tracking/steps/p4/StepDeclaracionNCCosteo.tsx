import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useCompleteStep, useStageSteps, useUpdateStepData, type StageStep } from '@/hooks/useStageSteps';
import { useCreateNC, NC_TIPOS, NC_PRIORIDADES, useUsersByDepartment, useNCsByStage } from '@/hooks/useNoConformidades';
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

const DEPARTMENTS = [
  { value: 'comex', label: 'COMEX' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'gerencia', label: 'Gerencia' },
];

export function StepDeclaracionNCCosteo({ step, pimId, stageKey, pim, userId, userName, userRole }: Props) {
  const [ncTipo, setNcTipo] = useState('');
  const [ncDescripcion, setNcDescripcion] = useState('');
  const [ncPrioridad, setNcPrioridad] = useState('media');
  const [ncDepartamento, setNcDepartamento] = useState('');
  const [ncAsignadoA, setNcAsignadoA] = useState('');

  const completeStep = useCompleteStep();
  const createNC = useCreateNC();
  const updateStepData = useUpdateStepData();
  const { data: allSteps } = useStageSteps(pimId, stageKey);
  const { data: deptUsers } = useUsersByDepartment(ncDepartamento || undefined);
  const { data: ncs } = useNCsByStage(pimId, stageKey);

  if (step.status === 'completado') {
    const datos = step.datos as any;
    const nc = datos?.nc_id ? ncs?.find((n: any) => n.id === datos.nc_id) : null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-yellow-700">No Conformidad declarada: {datos?.nc_codigo || 'creada'}</span>
        </div>

        {nc && (
          <Card className="bg-yellow-50/50 border-yellow-200">
            <CardContent className="py-3 px-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">NC: {nc.codigo}</span>
                  <Badge variant="outline" className="text-xs">{nc.estado}</Badge>
                </div>
                <p className="text-muted-foreground">{nc.descripcion}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Tipo: {nc.tipo}</span>
                  <span>Prioridad: {nc.prioridad}</span>
                  <span>Area: {nc.departamento_asignado}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const isFinanzas = userRole === 'admin' || userRole === 'manager' || step.datos;

  const handleCrearNC = () => {
    if (!ncTipo || !ncDescripcion.trim() || !ncDepartamento || !ncAsignadoA) {
      toast.error('Complete todos los campos obligatorios de la no conformidad');
      return;
    }

    createNC.mutate(
      {
        pimId,
        stageKey,
        tipo: ncTipo as any,
        descripcion: ncDescripcion,
        prioridad: ncPrioridad as any,
        departamentoAsignado: ncDepartamento,
        asignadoA: ncAsignadoA,
        creadoPor: userId,
        creadoPorNombre: userName,
        userRole,
      },
      {
        onSuccess: (nc) => {
          // Propagate nc_id to subsanacion_nc_costeo and revision_finanzas_costeo
          if (allSteps) {
            const stepSubsanacion = allSteps.find((s) => s.step_key === 'subsanacion_nc_costeo');
            const stepRevision = allSteps.find((s) => s.step_key === 'revision_finanzas_costeo');
            if (stepSubsanacion) {
              updateStepData.mutate({ stepId: stepSubsanacion.id, pimId, stageKey, datos: { nc_id: nc.id, nc_codigo: nc.codigo } });
            }
            if (stepRevision) {
              updateStepData.mutate({ stepId: stepRevision.id, pimId, stageKey, datos: { nc_id: nc.id, nc_codigo: nc.codigo } });
            }
          }

          completeStep.mutate(
            {
              stepId: step.id,
              pimId,
              stageKey,
              stepKey: 'declaracion_nc_costeo',
              stepName: 'Declaración de NC Costeo',
              userId,
              userName,
              datos: { nc_id: nc.id, nc_codigo: nc.codigo },
            },
            {
              onSuccess: () => toast.success(`NC ${nc.codigo} creada. Paso de subsanación activado.`),
              onError: (err) => toast.error(err.message),
            }
          );
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg">
        <h5 className="text-sm font-semibold text-yellow-800">Detalle de la No Conformidad</h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Tipo de NC *</Label>
            <Select value={ncTipo} onValueChange={setNcTipo}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccione tipo..." />
              </SelectTrigger>
              <SelectContent>
                {NC_TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Prioridad</Label>
            <Select value={ncPrioridad} onValueChange={setNcPrioridad}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NC_PRIORIDADES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Descripcion de la observacion *</Label>
          <Textarea
            className="mt-1"
            rows={3}
            placeholder="Describa el detalle de la observación en el costeo..."
            value={ncDescripcion}
            onChange={(e) => setNcDescripcion(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Area responsable *</Label>
            <Select value={ncDepartamento} onValueChange={(v) => { setNcDepartamento(v); setNcAsignadoA(''); }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccione área..." />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Persona responsable *</Label>
            <Select value={ncAsignadoA} onValueChange={setNcAsignadoA} disabled={!ncDepartamento}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={ncDepartamento ? 'Seleccione persona...' : 'Seleccione área primero'} />
              </SelectTrigger>
              <SelectContent>
                {(deptUsers || []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleCrearNC}
            disabled={createNC.isPending || completeStep.isPending}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            {createNC.isPending ? 'Creando NC...' : 'Crear No Conformidad'}
          </Button>
        </div>
      </div>
    </div>
  );
}
