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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateUser } from '@/hooks/useUserProfiles';
import { ROLES, DEPARTMENTS, MODULES } from '@/lib/userConstants';
import { toast } from '@/components/ui/use-toast';

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'viewer',
    department: 'comex',
    modules: ['comex'] as string[],
  });

  const createUser = useCreateUser();

  const handleModuleToggle = (moduleValue: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      modules: checked
        ? [...prev.modules, moduleValue]
        : prev.modules.filter((m) => m !== moduleValue),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.name.trim() || !formData.password) {
      toast({ title: 'Campos requeridos', description: 'Email, nombre y contraseña son obligatorios', variant: 'destructive' });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'Debe tener al menos 6 caracteres', variant: 'destructive' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' });
      return;
    }

    try {
      await createUser.mutateAsync({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        role: formData.role,
        department: formData.department,
        modules: formData.modules,
      });

      toast({ title: 'Usuario creado', description: `${formData.name} ha sido creado exitosamente` });
      setOpen(false);
      setFormData({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        role: 'viewer',
        department: 'comex',
        modules: ['comex'],
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error al crear usuario',
        description: msg.includes('already been registered') ? 'Ya existe un usuario con ese email' : msg,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo usuario. Los campos con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cu-name">Nombre *</Label>
                <Input
                  id="cu-name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-email">Email *</Label>
                <Input
                  id="cu-email"
                  type="email"
                  placeholder="juan@acenor.cl"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cu-password">Contraseña *</Label>
                <Input
                  id="cu-password"
                  type="password"
                  placeholder="Min. 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-confirm">Confirmar Contraseña *</Label>
                <Input
                  id="cu-confirm"
                  type="password"
                  placeholder="Repetir contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData((p) => ({ ...p, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={formData.department}
                  onValueChange={(v) => setFormData((p) => ({ ...p, department: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar depto." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Módulos de Acceso</Label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {MODULES.map((m) => (
                  <label key={m.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={formData.modules.includes(m.value)}
                      onCheckedChange={(checked) => handleModuleToggle(m.value, !!checked)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
