import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateMolino } from '@/hooks/useMolinos';
import { toast } from '@/components/ui/use-toast';

interface AddFabricaMolinoDialogProps {
  onMolinoCreated?: (molinoId: string) => void;
}

const PAISES = [
  'China',
  'Taiwán',
  'Corea del Sur',
  'India',
  'Estados Unidos',
  'Alemania',
  'Japón',
  'Brasil',
  'Chile',
  'Otro',
];

export function AddFabricaMolinoDialog({ onMolinoCreated }: AddFabricaMolinoDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    pais: '',
    ciudad: '',
  });

  const createMolino = useCreateMolino();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.pais) {
      toast({
        title: 'Campos requeridos',
        description: 'Código, nombre y país son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createMolino.mutateAsync({
        codigo: formData.codigo.trim().toUpperCase(),
        nombre: formData.nombre.trim(),
        pais: formData.pais,
        ciudad: formData.ciudad.trim() || null,
        activo: true,
      });

      toast({
        title: 'Fábrica/Molino creado',
        description: `${result.nombre} ha sido agregado exitosamente`,
      });

      onMolinoCreated?.(result.id);
      setOpen(false);
      setFormData({ codigo: '', nombre: '', pais: '', ciudad: '' });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error al crear fábrica/molino',
        description: errorMsg.includes('duplicate')
          ? 'Ya existe una fábrica/molino con ese código'
          : errorMsg,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Fábrica/Molino</DialogTitle>
          <DialogDescription>
            Ingresa los datos de la fábrica o molino. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: RNAV, PGR"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, codigo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Yanshan-Benxi"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pais">País *</Label>
                <Select
                  value={formData.pais}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, pais: v }))
                  }
                >
                  <SelectTrigger id="pais">
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAISES.map((pais) => (
                      <SelectItem key={pais} value={pais}>
                        {pais}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  placeholder="Ej: Beijing"
                  value={formData.ciudad}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ciudad: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMolino.isPending}>
              {createMolino.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Guardar Fábrica/Molino
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
