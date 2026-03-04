import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useUpdateUserProfile, type UserProfile } from '@/hooks/useUserProfiles';
import { ROLES, DEPARTMENTS, MODULES } from '@/lib/userConstants';
import { toast } from '@/components/ui/use-toast';

interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export function EditUserDialog({ user, open, onOpenChange, currentUserId }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'viewer',
    department: 'comex',
    modules: ['comex'] as string[],
    active: true,
  });

  const updateProfile = useUpdateUserProfile();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        department: user.department,
        modules: user.modules || ['comex'],
        active: user.active,
      });
    }
  }, [user]);

  const handleModuleToggle = (moduleValue: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      modules: checked
        ? [...prev.modules, moduleValue]
        : prev.modules.filter((m) => m !== moduleValue),
    }));
  };

  const isSelf = user?.id === currentUserId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }

    try {
      await updateProfile.mutateAsync({
        id: user.id,
        updates: {
          name: formData.name.trim(),
          role: formData.role,
          department: formData.department,
          modules: formData.modules,
          active: formData.active,
        },
      });

      toast({ title: 'Usuario actualizado', description: `${formData.name} ha sido actualizado` });
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({ title: 'Error al actualizar', description: msg, variant: 'destructive' });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario. El email no se puede cambiar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eu-name">Nombre</Label>
                <Input
                  id="eu-name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} disabled className="opacity-60" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData((p) => ({ ...p, role: v }))}
                  disabled={isSelf}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSelf && (
                  <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={formData.department}
                  onValueChange={(v) => setFormData((p) => ({ ...p, department: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Estado Activo</Label>
                <p className="text-xs text-muted-foreground">
                  {isSelf
                    ? 'No puedes desactivar tu propia cuenta'
                    : 'Desactivar impedirá el acceso del usuario'}
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, active: checked }))}
                disabled={isSelf}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
