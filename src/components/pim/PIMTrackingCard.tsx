import { TRACKING_STAGES } from '@/lib/trackingChecklists';
import { PIMStatusBadge } from '@/components/pim/PIMStatusBadge';
import { cn } from '@/lib/utils';
import { Clock, User, ChevronRight } from 'lucide-react';
import type { PIMTrackingInfo } from '@/hooks/useTrackingDashboard';
import type { PIMStatus } from '@/types/comex';

interface PIMData {
  id: string;
  codigo: string;
  descripcion: string;
  estado: string;
  proveedor_nombre: string | null;
  total_usd: number;
  total_toneladas: number;
}

interface Props {
  pim: PIMData;
  tracking: PIMTrackingInfo | undefined;
  isSelected?: boolean;
  onClick?: () => void;
}

const slaColors = {
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-500',
  rojo: 'bg-red-500',
};

const slaTextColors = {
  verde: 'text-green-700',
  amarillo: 'text-yellow-700',
  rojo: 'text-red-700',
};

const slaBgColors = {
  verde: 'bg-green-50',
  amarillo: 'bg-yellow-50',
  rojo: 'bg-red-50',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function StageTimeline({ tracking }: { tracking: PIMTrackingInfo | undefined }) {
  if (!tracking) {
    return (
      <div className="flex items-center gap-1 opacity-40">
        {TRACKING_STAGES.map((_, idx) => (
          <div key={idx} className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            {idx < TRACKING_STAGES.length - 1 && (
              <div className="w-6 h-0.5 bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {TRACKING_STAGES.map((def, idx) => {
        const isComplete = idx < tracking.completedStages;
        const isCurrent = idx === tracking.stageIndex;
        const isPending = !isComplete && !isCurrent;

        return (
          <div key={def.key} className="flex items-center">
            <div
              className={cn(
                'rounded-full transition-all flex items-center justify-center',
                isComplete && 'w-3.5 h-3.5 bg-green-500',
                isCurrent && 'w-4 h-4 ring-2 ring-blue-400 ring-offset-1',
                isCurrent && 'bg-blue-500',
                isPending && 'w-3 h-3 bg-gray-300',
              )}
              title={`${def.name}: ${isComplete ? 'Completado' : isCurrent ? 'En progreso' : 'Pendiente'}`}
            />
            {idx < TRACKING_STAGES.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-5',
                  isComplete ? 'bg-green-400' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PIMTrackingCard({ pim, tracking, isSelected, onClick }: Props) {
  const sla = tracking?.slaStatus || 'verde';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 transition-all hover:bg-muted/50 border-b border-border',
        isSelected && 'bg-muted',
        tracking && !tracking.allComplete && sla === 'rojo' && !isSelected && 'bg-red-50/30',
      )}
    >
      {/* Row 1: Code, Status, Amount */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm">{pim.codigo}</span>
          <PIMStatusBadge status={pim.estado as PIMStatus} size="sm" />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {pim.total_usd > 0 && <span>{formatCurrency(pim.total_usd)}</span>}
          {pim.total_toneladas > 0 && <span>{pim.total_toneladas.toLocaleString('es-CL', { maximumFractionDigits: 1 })} t</span>}
        </div>
      </div>

      {/* Row 2: Description + Proveedor */}
      <p className="text-xs text-muted-foreground truncate mb-2.5">
        {pim.proveedor_nombre && <span className="font-medium text-foreground/70">{pim.proveedor_nombre} — </span>}
        {pim.descripcion}
      </p>

      {/* Row 3: Timeline + Stage label */}
      {tracking && !tracking.allComplete && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <StageTimeline tracking={tracking} />
            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              Proceso {tracking.stageIndex + 1}/{TRACKING_STAGES.length}
            </span>
          </div>

          {/* Row 4: Stage name + step */}
          <div className="flex items-center gap-1.5">
            {tracking.currentStageColor && (
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: tracking.currentStageColor }}
              />
            )}
            <span className="text-xs font-medium truncate">
              {tracking.currentStageName}
            </span>
            {tracking.currentStepName && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground truncate">
                  {tracking.currentStepName} ({tracking.completedSteps}/{tracking.totalSteps})
                </span>
              </>
            )}
          </div>

          {/* Row 5: Responsable + Days + SLA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px]">
              {tracking.responsable ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{tracking.responsable}</span>
                  {tracking.departamento && (
                    <span className="text-muted-foreground/60">· {tracking.departamento === 'comex' ? 'COMEX' : tracking.departamento === 'finanzas' ? 'Finanzas' : tracking.departamento}</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground/60 italic">
                  <User className="h-3 w-3" />
                  Sin asignar
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded',
                slaBgColors[sla],
                slaTextColors[sla],
              )}>
                <Clock className="h-3 w-3" />
                {tracking.diasEnProceso} d
              </span>
              <div
                className={cn('w-2.5 h-2.5 rounded-full shrink-0', slaColors[sla])}
                title={`SLA: ${sla} (${tracking.diasEnProceso}/${tracking.slaDays} días)`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Completed PIMs */}
      {tracking?.allComplete && (
        <div className="flex items-center gap-2 mt-1">
          <StageTimeline tracking={tracking} />
          <span className="text-[11px] text-green-600 font-medium">Completado</span>
        </div>
      )}

      {/* PIMs without tracking */}
      {!tracking && (
        <div className="text-[11px] text-muted-foreground/60 italic mt-1">
          Sin seguimiento iniciado
        </div>
      )}
    </button>
  );
}
