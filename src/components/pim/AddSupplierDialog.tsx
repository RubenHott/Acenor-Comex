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
import { useCreateSupplier } from '@/hooks/useSuppliers';
import { toast } from '@/components/ui/use-toast';

interface AddSupplierDialogProps {
  onSupplierCreated?: (supplierId: string) => void;
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

const TIPOS_PROVEEDOR = [
  { value: 'Trader', label: 'Trader' },
  { value: 'Fabricante', label: 'Fabricante' },
  { value: 'Distribuidor', label: 'Distribuidor' },
];

export function AddSupplierDialog({ onSupplierCreated }: AddSupplierDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    pais: '',
    ciudad: '',
    tipoProveedor: 'Trader',
    contacto: '',
    email: '',
    telefono: '',
  });

  const createSupplier = useCreateSupplier();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.codigo.trim() || !formData.pais) {
      toast({
        title: 'Campos requeridos',
        description: 'Nombre, código y país son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createSupplier.mutateAsync({
        id: crypto.randomUUID(),
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim().toUpperCase(),
        pais: formData.pais,
        ciudad: formData.ciudad.trim() || null,
        tipo_proveedor: formData.tipoProveedor,
        contacto: formData.contacto.trim() || null,
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        activo: true,
      });

      toast({
        title: 'Proveedor creado',
        description: `${result.nombre} ha sido agregado exitosamente`,
      });

      onSupplierCreated?.(result.id);
      setOpen(false);
      setFormData({
        nombre: '',
        codigo: '',
        pais: '',
        ciudad: '',
        tipoProveedor: 'Trader',
        contacto: '',
        email: '',
        telefono: '',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error al crear proveedor',
        description: errorMsg.includes('duplicate') 
          ? 'Ya existe un proveedor con ese código' 
          : errorMsg.includes('check constraint')
          ? 'Tipo de proveedor no válido'
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
          <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
          <DialogDescription>
            Ingresa los datos del proveedor. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: COFCO Trading"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: COFCO"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, codigo: e.target.value }))
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
                  placeholder="Ej: Shanghai"
                  value={formData.ciudad}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ciudad: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoProveedor">Tipo de Proveedor</Label>
              <Select
                value={formData.tipoProveedor}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, tipoProveedor: v }))
                }
              >
                <SelectTrigger id="tipoProveedor">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PROVEEDOR.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contacto">Nombre de Contacto</Label>
              <Input
                id="contacto"
                placeholder="Ej: John Smith"
                value={formData.contacto}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contacto: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="+86 123 456 7890"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, telefono: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Guardar Proveedor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
