import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useCompleteStep, useSkipSteps, type StageStep } from '@/hooks/useStageSteps';
import { useCreateNC, NC_TIPOS, NC_PRIORIDADES, useUsersByDepartment } from '@/hooks/useNoConformidades';
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

export function StepDeclaracionNC({ step, pimId, stageKey, pim, userId, userName, userRole }: Props) {
  const [declaracion, setDeclaracion] = useState<'sin_nc' | 'con_nc' | ''>('');
  const [ncTipo, setNcTipo] = useState('');
  const [ncDescripcion, setNcDescripcion] = useState('');
  const [ncPrioridad, setNcPrioridad] = useState('media');
  const [ncDepartamento, setNcDepartamento] = useState('');
  const [ncAsignadoA, setNcAsignadoA] = useState('');

  const completeStep = useCompleteStep();
  const skipSteps = useSkipSteps();
  const createNC = useCreateNC();
  const { data: deptUsers } = useUsersByDepartment(ncDepartamento || undefined);

  if (step.status === 'completado') {
    const datos = step.datos as any;
    return (
      <div className="flex items-center gap-2 text-sm">
        {datos?.tiene_nc ? (
          <>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-700">Declarada con no conformidad (NC: {datos?.nc_codigo || 'creada'})</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700">Declarada sin no conformidad</span>
          </>
        )}
      </div>
    );
  }

  const handleSinNC = () => {
    // Complete this step and skip steps 3 & 4
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'declaracion_nc',
        stepName: 'Declaración de No Conformidad',
        userId,
        userName,
        datos: { tiene_nc: false },
      },
      {
        onSuccess: () => {
          skipSteps.mutate({
            pimId,
            stageKey,
            stepKeys: ['subsanacion_nc', 'revision_comex'],
            motivo: 'Sin no conformidad declarada',
            userId,
            userName,
          });
          toast.success('Declarado sin no conformidad. Pasos 3 y 4 saltados.');
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleConNC = () => {
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
          completeStep.mutate(
            {
              stepId: step.id,
              pimId,
              stageKey,
              stepKey: 'declaracion_nc',
              stepName: 'Declaración de No Conformidad',
              userId,
              userName,
              datos: { tiene_nc: true, nc_id: nc.id, nc_codigo: nc.codigo },
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
      <RadioGroup
        value={declaracion}
        onValueChange={(v) => setDeclaracion(v as 'sin_nc' | 'con_nc')}
        className="space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sin_nc" id="sin_nc" />
          <Label htmlFor="sin_nc" className="font-normal cursor-pointer">
            Sin no conformidad — Los documentos son conformes
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="con_nc" id="con_nc" />
          <Label htmlFor="con_nc" className="font-normal cursor-pointer">
            Con no conformidad — Se encontraron observaciones
          </Label>
        </div>
      </RadioGroup>

      {declaracion === 'sin_nc' && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSinNC}
            disabled={completeStep.isPending || skipSteps.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirmar sin NC
          </Button>
        </div>
      )}

      {declaracion === 'con_nc' && (
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
            <Label className="text-xs">Descripción de la no conformidad *</Label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder="Describa el detalle de la no conformidad..."
              value={ncDescripcion}
              onChange={(e) => setNcDescripcion(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Área responsable *</Label>
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
              onClick={handleConNC}
              disabled={createNC.isPending || completeStep.isPending}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              {createNC.isPending ? 'Creando NC...' : 'Confirmar No Conformidad'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
