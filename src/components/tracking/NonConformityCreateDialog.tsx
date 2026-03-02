import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import {
  NC_TIPOS,
  NC_PRIORIDADES,
  useCreateNC,
  useUsersByDepartment,
  type NCTipo,
  type NCPrioridad,
} from '@/hooks/useNoConformidades';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pimId: string;
  stageKey: string;
  stageName?: string;
  userId: string;
  userName: string;
}

const DEPARTAMENTOS = [
  { value: 'comex', label: 'COMEX' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'proveedor', label: 'Proveedor' },
];

export function NonConformityCreateDialog({
  open,
  onOpenChange,
  pimId,
  stageKey,
  stageName,
  userId,
  userName,
}: Props) {
  const [tipo, setTipo] = useState<NCTipo | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<NCPrioridad>('media');
  const [departamento, setDepartamento] = useState('');
  const [asignadoA, setAsignadoA] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  const createNC = useCreateNC();
  const { data: users } = useUsersByDepartment(departamento || undefined);

  const handleSubmit = () => {
    if (!tipo || !descripcion.trim()) {
      toast.error('Complete tipo y descripción');
      return;
    }

    createNC.mutate(
      {
        pimId,
        stageKey,
        tipo,
        descripcion: descripcion.trim(),
        prioridad,
        departamentoAsignado: departamento || undefined,
        asignadoA: asignadoA || undefined,
        fechaLimite: fechaLimite || undefined,
        creadoPor: userId,
        creadoPorNombre: userName,
      },
      {
        onSuccess: (nc) => {
          toast.success(`No conformidad ${nc.codigo} creada`);
          resetForm();
          onOpenChange(false);
        },
        onError: () => toast.error('Error al crear no conformidad'),
      }
    );
  };

  const resetForm = () => {
    setTipo('');
    setDescripcion('');
    setPrioridad('media');
    setDepartamento('');
    setAsignadoA('');
    setFechaLimite('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Crear No Conformidad
          </DialogTitle>
          <DialogDescription>
            {stageName
              ? `No conformidad en etapa "${stageName}"`
              : 'Registrar una no conformidad'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as NCTipo)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {NC_TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select
                value={prioridad}
                onValueChange={(v) => setPrioridad(v as NCPrioridad)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NC_PRIORIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción *</Label>
            <Textarea
              placeholder="Describa el problema encontrado..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Departamento asignado</Label>
              <Select value={departamento} onValueChange={setDepartamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Asignar a</Label>
              <Select
                value={asignadoA}
                onValueChange={setAsignadoA}
                disabled={!departamento}
              >
                <SelectTrigger>
                  <SelectValue placeholder={departamento ? 'Seleccionar' : 'Seleccione depto.'} />
                </SelectTrigger>
                <SelectContent>
                  {(users || []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fecha límite</Label>
            <Input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!tipo || !descripcion.trim() || createNC.isPending}
          >
            {createNC.isPending ? 'Creando...' : 'Crear NC'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
