import type { ActivityLog } from '@/hooks/usePIMTracking';
import {
  CheckCircle,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Scissors,
  Settings,
  AlertTriangle,
  XCircle,
  Eye,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  PlayCircle,
  Ban,
  Unlock,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStageByKey } from '@/lib/trackingChecklists';

interface Props {
  logs: ActivityLog[];
}

const typeConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  checklist_check: { icon: CheckCircle, color: 'text-green-500' },
  note: { icon: MessageSquare, color: 'text-blue-500' },
  status_change: { icon: Settings, color: 'text-purple-500' },
  stage_advance: { icon: ArrowRight, color: 'text-indigo-500' },
  stage_return: { icon: ArrowLeft, color: 'text-red-500' },
  split: { icon: Scissors, color: 'text-orange-500' },
  nc_created: { icon: XCircle, color: 'text-red-500' },
  nc_status_change: { icon: Eye, color: 'text-yellow-500' },
  nc_resolved: { icon: ShieldCheck, color: 'text-green-600' },
  nc_closed: { icon: CheckCircle, color: 'text-gray-500' },
  nc_assigned: { icon: UserCheck, color: 'text-blue-600' },
  permission_denied: { icon: ShieldAlert, color: 'text-red-600' },
  stage_assigned: { icon: UserCheck, color: 'text-teal-600' },
  subprocess_started: { icon: PlayCircle, color: 'text-blue-500' },
  subprocess_completed: { icon: CheckCircle, color: 'text-green-600' },
  subprocess_blocked: { icon: Ban, color: 'text-red-500' },
  subprocess_unblocked: { icon: Unlock, color: 'text-green-500' },
  subprocess_assigned: { icon: UserCheck, color: 'text-cyan-600' },
  nc_iteration: { icon: MessageSquare, color: 'text-amber-500' },
  email_sent: { icon: Mail, color: 'text-violet-500' },
};

export function TrackingTimeline({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Sin actividad registrada aún.
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />

      {logs.map((log) => {
        const config = typeConfig[log.tipo] || { icon: AlertTriangle, color: 'text-muted-foreground' };
        const Icon = config.icon;
        const stage = log.stage_key ? getStageByKey(log.stage_key) : null;

        return (
          <div key={log.id} className="relative flex gap-3 py-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full bg-card border flex items-center justify-center flex-shrink-0 z-10',
                config.color
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm">{log.descripcion}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {log.usuario}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(log.created_at).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {stage && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: stage.color + '20', color: stage.color }}
                  >
                    {stage.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
