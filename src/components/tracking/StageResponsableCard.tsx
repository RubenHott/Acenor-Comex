import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserCircle, ArrowRight, Users } from 'lucide-react';
import { TRACKING_STAGES, getStageByKey } from '@/lib/trackingChecklists';
import { useUsersByDepartment } from '@/hooks/useNoConformidades';
import { useAssignStageResponsable, type TrackingStage } from '@/hooks/usePIMTracking';
import { toast } from 'sonner';
import type { UserRole } from '@/types/comex';

const deptLabels: Record<string, string> = {
  comex: 'COMEX',
  finanzas: 'Finanzas',
  gerencia: 'Gerencia',
  sistemas: 'Sistemas',
};

interface Props {
  pimId: string;
  activeStageKey: string;
  stages: TrackingStage[];
  canAssign: boolean;
  usuario: string;
  usuarioId?: string;
  userRole?: UserRole;
}

export function StageResponsableCard({
  pimId,
  activeStageKey,
  stages,
  canAssign,
  usuario,
  usuarioId,
  userRole,
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const assignMutation = useAssignStageResponsable();

  const activeStage = stages.find((s) => s.stage_key === activeStageKey);
  const activeStageDef = getStageByKey(activeStageKey);

  // Next stage info
  const currentIdx = TRACKING_STAGES.findIndex((s) => s.key === activeStageKey);
  const nextStageDef = currentIdx < TRACKING_STAGES.length - 1
    ? TRACKING_STAGES[currentIdx + 1]
    : null;

  // Users from the department for the active stage
  const { data: deptUsers = [] } = useUsersByDepartment(activeStageDef?.primaryDepartment);

  const handleAssign = () => {
    if (!selectedUserId || !activeStage) return;
    const selectedUser = deptUsers.find((u) => u.id === selectedUserId);
    if (!selectedUser) return;

    assignMutation.mutate(
      {
        stageId: activeStage.id,
        pimId,
        stageKey: activeStageKey,
        assignedUserId: selectedUser.id,
        assignedUserName: selectedUser.name,
        usuario,
        usuarioId,
        userRole,
      },
      {
        onSuccess: () => {
          toast.success(`${selectedUser.name} asignado como responsable`);
          setSelectedUserId('');
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Responsables
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Responsable */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UserCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Responsable actual</p>
            <p className="font-medium text-sm">
              {activeStage?.responsable || 'Sin asignar'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                {deptLabels[activeStageDef?.primaryDepartment || ''] || activeStageDef?.primaryDepartment}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {activeStageDef?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Next Stage Info */}
        {nextStageDef && (
          <div className="flex items-start gap-3 opacity-60">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Siguiente etapa</p>
              <p className="font-medium text-sm">{nextStageDef.name}</p>
              <Badge variant="outline" className="text-[10px] mt-0.5">
                {deptLabels[nextStageDef.primaryDepartment] || nextStageDef.primaryDepartment}
              </Badge>
            </div>
          </div>
        )}

        {/* Assign control */}
        {canAssign && activeStage?.status === 'en_progreso' && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs text-muted-foreground">Asignar responsable</p>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue placeholder="Seleccionar usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {deptUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8"
                onClick={handleAssign}
                disabled={!selectedUserId || assignMutation.isPending}
              >
                {assignMutation.isPending ? '...' : 'Asignar'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
