import { TRACKING_STAGES } from '@/lib/trackingChecklists';
import type { TrackingStage } from '@/hooks/usePIMTracking';
import { cn } from '@/lib/utils';
import { Check, Clock, AlertTriangle, Lock } from 'lucide-react';

interface Props {
  stages: TrackingStage[];
  activeStageKey: string;
  onStageClick: (key: string) => void;
}

const statusConfig: Record<string, { bg: string; border: string; icon: typeof Check }> = {
  completado: { bg: 'bg-green-500', border: 'border-green-500', icon: Check },
  en_progreso: { bg: 'bg-blue-500', border: 'border-blue-500', icon: Clock },
  bloqueado: { bg: 'bg-red-500', border: 'border-red-500', icon: AlertTriangle },
  pendiente: { bg: 'bg-muted', border: 'border-muted-foreground/30', icon: Lock },
};

export function TrackingStageBar({ stages, activeStageKey, onStageClick }: Props) {
  const stageMap = new Map(stages.map((s) => [s.stage_key, s]));

  return (
    <div className="flex items-center justify-between gap-1 p-4 bg-card rounded-lg border">
      {TRACKING_STAGES.map((def, idx) => {
        const stage = stageMap.get(def.key);
        const status = stage?.status || 'pendiente';
        const config = statusConfig[status] || statusConfig.pendiente;
        const Icon = def.icon;
        const StatusIcon = config.icon;
        const isActive = activeStageKey === def.key;

        return (
          <div key={def.key} className="flex items-center flex-1">
            <button
              onClick={() => onStageClick(def.key)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all flex-1 min-w-0',
                isActive
                  ? 'bg-muted ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white relative',
                  config.bg
                )}
              >
                <Icon className="h-5 w-5" />
                {status === 'completado' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-center truncate w-full">
                {def.name}
              </span>
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full capitalize',
                  status === 'completado' && 'bg-green-100 text-green-700',
                  status === 'en_progreso' && 'bg-blue-100 text-blue-700',
                  status === 'bloqueado' && 'bg-red-100 text-red-700',
                  status === 'pendiente' && 'bg-muted text-muted-foreground'
                )}
              >
                {status.replace('_', ' ')}
              </span>
            </button>
            {idx < TRACKING_STAGES.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 flex-shrink-0',
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
