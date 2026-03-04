import { TRACKING_STAGES } from '@/lib/trackingChecklists';
import type { TrackingStage } from '@/hooks/usePIMTracking';
import type { Department, UserRole } from '@/types/comex';
import { cn } from '@/lib/utils';
import { Check, Clock, AlertTriangle, Lock } from 'lucide-react';

interface Props {
  stages: TrackingStage[];
  activeStageKey: string;
  onStageClick: (key: string) => void;
  openNCsByStage?: Map<string, number>;
  userDepartment?: Department;
  /** User role — admin/manager bypasses department restrictions */
  userRole?: UserRole;
}

const statusConfig: Record<string, { bg: string; border: string; icon: typeof Check }> = {
  completado: { bg: 'bg-green-500', border: 'border-green-500', icon: Check },
  en_progreso: { bg: 'bg-blue-500', border: 'border-blue-500', icon: Clock },
  bloqueado: { bg: 'bg-red-500', border: 'border-red-500', icon: AlertTriangle },
  pendiente: { bg: 'bg-muted', border: 'border-muted-foreground/30', icon: Lock },
};

const deptLabels: Record<string, string> = {
  comex: 'COMEX',
  finanzas: 'Finanzas',
  gerencia: 'Gerencia',
  sistemas: 'Sistemas',
};

export function TrackingStageBar({ stages, activeStageKey, onStageClick, openNCsByStage, userDepartment, userRole }: Props) {
  const stageMap = new Map(stages.map((s) => [s.stage_key, s]));
  const isFullAccess = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="flex items-center justify-between gap-1 p-4 bg-card rounded-lg border overflow-x-auto">
      {TRACKING_STAGES.map((def, idx) => {
        const stage = stageMap.get(def.key);
        const status = stage?.status || 'pendiente';
        const config = statusConfig[status] || statusConfig.pendiente;
        const Icon = def.icon;
        const isActive = activeStageKey === def.key;
        const openNCs = openNCsByStage?.get(def.key) || 0;
        const isMyStage = isFullAccess || !userDepartment || def.departments.includes(userDepartment);

        return (
          <div key={def.key} className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => onStageClick(def.key)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all flex-1 min-w-0',
                isActive
                  ? 'bg-muted ring-2 ring-primary'
                  : 'hover:bg-muted/50',
                !isMyStage && !isActive && 'opacity-60'
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-white',
                    config.bg
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {status === 'completado' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {openNCs > 0 && (
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[9px] text-white font-bold">{openNCs}</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-center truncate w-full leading-tight">
                {def.name}
              </span>
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full capitalize',
                    status === 'completado' && 'bg-green-100 text-green-700',
                    status === 'en_progreso' && 'bg-blue-100 text-blue-700',
                    status === 'bloqueado' && 'bg-red-100 text-red-700',
                    status === 'pendiente' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {status.replace('_', ' ')}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {def.departments.map((d) => deptLabels[d] || d).join(' + ')}
                </span>
                {!isMyStage && (
                  <span className="text-[8px] text-muted-foreground/60 italic">Solo lectura</span>
                )}
                {stage?.responsable && (
                  <span className="text-[9px] text-primary font-medium truncate max-w-[80px]" title={stage.responsable}>
                    {stage.responsable}
                  </span>
                )}
              </div>
            </button>
            {idx < TRACKING_STAGES.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-3 flex-shrink-0',
                  status === 'completado' ? 'bg-green-500' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
