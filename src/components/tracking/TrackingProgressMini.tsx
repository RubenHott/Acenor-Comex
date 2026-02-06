import { TRACKING_STAGES } from '@/lib/trackingChecklists';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StageStatus {
  stage_key: string;
  status: string;
}

interface Props {
  stages: StageStatus[];
  className?: string;
}

const statusColors: Record<string, string> = {
  completado: 'bg-success',
  en_progreso: 'bg-info',
  bloqueado: 'bg-destructive',
  pendiente: 'bg-muted-foreground/25',
};

const statusLabels: Record<string, string> = {
  completado: 'Completado',
  en_progreso: 'En progreso',
  bloqueado: 'Bloqueado',
  pendiente: 'Pendiente',
};

export function TrackingProgressMini({ stages, className }: Props) {
  const stageMap = new Map(stages.map((s) => [s.stage_key, s.status]));
  const completed = stages.filter(s => s.status === 'completado').length;
  const total = TRACKING_STAGES.length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-0.5', className)}>
            {TRACKING_STAGES.map((def) => {
              const status = stageMap.get(def.key) || 'pendiente';
              return (
                <div
                  key={def.key}
                  className={cn(
                    'h-1.5 flex-1 rounded-full min-w-[12px] max-w-[20px]',
                    statusColors[status] || statusColors.pendiente
                  )}
                />
              );
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">{completed}/{total} etapas completadas</p>
            {TRACKING_STAGES.map((def) => {
              const status = stageMap.get(def.key) || 'pendiente';
              return (
                <div key={def.key} className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', statusColors[status])} />
                  <span>{def.name}: {statusLabels[status]}</span>
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
