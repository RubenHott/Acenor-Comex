import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfiles, useUpdateUserProfile, useDeleteUser } from '@/hooks/useUserProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLES, DEPARTMENTS, getDepartmentLabel } from '@/lib/userConstants';
import { UserRoleBadge } from '@/components/users/UserRoleBadge';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { ResetPasswordDialog } from '@/components/users/ResetPasswordDialog';
import type { UserProfile } from '@/hooks/useUserProfiles';
import { toast } from '@/components/ui/use-toast';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error } = useUserProfiles();
  const updateProfile = useUpdateUserProfile();
  const deleteUser = useDeleteUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Dialog states
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserProfile | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  // Guard: only admin can see this page
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Usuarios" subtitle="Administración de usuarios y roles" />
        <div className="p-4 md:p-6">
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos para acceder a esta sección. Solo administradores pueden gestionar usuarios.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const filteredUsers = (users || []).filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesDept = deptFilter === 'all' || u.department === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  const isSelf = (u: UserProfile) => u.id === currentUser?.id;

  const handleToggleActive = async (u: UserProfile) => {
    if (isSelf(u)) {
      toast({ title: 'Error', description: 'No puedes desactivar tu propia cuenta', variant: 'destructive' });
      return;
    }
    try {
      await updateProfile.mutateAsync({
        id: u.id,
        updates: { active: !u.active },
      });
      toast({
        title: u.active ? 'Usuario desactivado' : 'Usuario activado',
        description: `${u.name} ha sido ${u.active ? 'desactivado' : 'activado'}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast({ title: 'Usuario eliminado', description: `${deleteTarget.name} ha sido eliminado` });
      setDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error al eliminar', description: msg, variant: 'destructive' });
    }
  };

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(date)
    );

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Usuarios" subtitle="Administración de usuarios y roles" />
        <div className="p-4 md:p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error al cargar usuarios: {error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header title="Usuarios" subtitle="Administración de usuarios y roles" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Depto." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los deptos.</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CreateUserDialog />
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="table-row-hover">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                          u.active ? 'bg-primary' : 'bg-muted-foreground'
                        )}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                        {isSelf(u) && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Tú</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell><UserRoleBadge role={u.role} /></TableCell>
                    <TableCell className="text-sm">{getDepartmentLabel(u.department)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          u.active
                            ? 'border-success/50 text-success bg-success/10'
                            : 'border-destructive/50 text-destructive bg-destructive/10'
                        )}
                      >
                        {u.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditUser(u); setEditOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setResetUser(u); setResetOpen(true); }}>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Restablecer Contraseña
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf(u)}
                          >
                            {u.active ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(u)}
                            className="text-destructive focus:text-destructive"
                            disabled={isSelf(u)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!isLoading && filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          )}
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredUsers.length} de {users?.length || 0} usuarios
        </p>
      </div>

      {/* Edit Dialog */}
      <EditUserDialog
        user={editUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        currentUserId={currentUser?.id || ''}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        userId={resetUser?.id || null}
        userName={resetUser?.name || ''}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
              Esta acción no se puede deshacer y eliminará todos sus datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
