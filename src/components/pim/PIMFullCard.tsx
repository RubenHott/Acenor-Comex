import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PIMDocumentsSummaryDialog } from './PIMDocumentsSummaryDialog';
import { TRACKING_STAGES } from '@/lib/trackingChecklists';
import { cn } from '@/lib/utils';
import {
  MapPin,
  ArrowRight,
  Clock,
  User,
  BarChart3,
  ClipboardList,
  Pencil,
  Ship,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
} from 'lucide-react';
import type { PIMTrackingInfo } from '@/hooks/useTrackingDashboard';
import type { PIMStatus } from '@/types/comex';

interface PIMData {
  id: string;
  codigo: string;
  codigo_correlativo?: string | null;
  descripcion: string;
  estado: string;
  proveedor_nombre: string | null;
  total_usd: number;
  total_toneladas: number;
  cuadroNombre: string | null;
  origen: string | null;
  fecha_embarque: string | null;
  fecha_creacion: string | null;
}

interface Props {
  pim: PIMData;
  tracking: PIMTrackingInfo | undefined;
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  creado: { label: 'CREADO', color: 'text-slate-600', bgColor: 'bg-slate-100 border-slate-200' },
  en_negociacion: { label: 'EN NEGOCIACIÓN', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  contrato_validado: { label: 'CONTRATO VALIDADO', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  en_produccion: { label: 'EN PRODUCCIÓN', color: 'text-violet-700', bgColor: 'bg-violet-50 border-violet-200' },
  en_transito: { label: 'EN TRÁNSITO', color: 'text-sky-700', bgColor: 'bg-sky-50 border-sky-200' },
  en_puerto: { label: 'EN PUERTO', color: 'text-teal-700', bgColor: 'bg-teal-50 border-teal-200' },
  en_aduana: { label: 'EN ADUANA', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  cerrado: { label: 'CERRADO', color: 'text-gray-600', bgColor: 'bg-gray-100 border-gray-200' },
};

const slaConfig = {
  verde: { label: 'Normal', dotColor: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  amarillo: { label: 'Precaución', dotColor: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  rojo: { label: 'Crítico', dotColor: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
};

// Short stage labels for the timeline
const STAGE_SHORT_LABELS = ['Contrato', 'Pago', 'Documentación', 'Recepción'];

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `USD ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `USD ${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

function StageTimeline({ tracking }: { tracking: PIMTrackingInfo | undefined }) {
  return (
    <div className="flex items-start w-full">
      {TRACKING_STAGES.map((def, idx) => {
        const isComplete = tracking ? idx < tracking.completedStages : false;
        const isCurrent = tracking ? idx === tracking.stageIndex : false;
        const isPending = !isComplete && !isCurrent;
        const isLast = idx === TRACKING_STAGES.length - 1;

        return (
          <div key={def.key} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            <div className="flex items-center w-full">
              {/* Left connector */}
              {idx > 0 && (
                <div
                  className={cn(
                    'h-[3px] flex-1',
                    isComplete || isCurrent ? 'bg-blue-400' : 'bg-gray-200',
                  )}
                />
              )}
              {idx === 0 && <div className="flex-1" />}

              {/* Dot */}
              <div
                className={cn(
                  'rounded-full z-10 flex items-center justify-center shrink-0 transition-all',
                  isComplete && 'w-5 h-5 bg-blue-500',
                  isCurrent && 'w-7 h-7 bg-blue-500 ring-4 ring-blue-100 shadow-md',
                  isPending && 'w-5 h-5 bg-gray-300',
                )}
              >
                {isComplete && (
                  <CheckCircle2 className="w-3 h-3 text-white" />
                )}
                {isCurrent && (
                  <Ship className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              {/* Right connector */}
              {!isLast && (
                <div
                  className={cn(
                    'h-[3px] flex-1',
                    isComplete ? 'bg-blue-400' : 'bg-gray-200',
                  )}
                />
              )}
              {isLast && <div className="flex-1" />}
            </div>

            {/* Label */}
            <span
              className={cn(
                'text-[10px] mt-1.5 font-medium text-center leading-tight',
                isCurrent ? 'text-blue-600 font-semibold' : isComplete ? 'text-blue-500/70' : 'text-gray-400',
              )}
            >
              {STAGE_SHORT_LABELS[idx]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PIMFullCard({ pim, tracking, canEdit, canDelete, onDelete }: Props) {
  const navigate = useNavigate();
  const [showDocs, setShowDocs] = useState(false);
  const status = statusConfig[pim.estado] || statusConfig.creado;
  const sla = tracking ? slaConfig[tracking.slaStatus] : null;
  const isCompleted = tracking?.allComplete;
  const isClosed = pim.estado === 'cerrado';

  // Calculate process health (percentage of completed stages + partial current stage)
  const processHealth = tracking
    ? Math.round(
        ((tracking.completedStages +
          (tracking.totalSteps > 0 ? tracking.completedSteps / tracking.totalSteps : 0)) /
          TRACKING_STAGES.length) *
          100,
      )
    : 0;

  return (
    <Card
      className={cn(
        'group hover:shadow-lg transition-all duration-200 border overflow-hidden',
        !isClosed && !isCompleted && tracking?.slaStatus === 'rojo' && 'border-red-200 shadow-red-50',
        isClosed && 'opacity-75',
      )}
    >
      <CardContent className="p-0">
        {/* Row 1: Header - Code, Description, Priority Badge, Time, ETA */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Code + Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-mono font-bold text-base text-foreground">
                  {pim.codigo_correlativo || pim.codigo}
                </h3>
                {pim.codigo_correlativo && (
                  <span className="text-xs text-muted-foreground font-mono">{pim.codigo}</span>
                )}
                <span className="text-muted-foreground/40">/</span>
                <p className="text-sm text-foreground/80 truncate font-medium">
                  {pim.descripcion}
                </p>
                <Badge
                  className={cn(
                    'shrink-0 text-[10px] font-bold tracking-wider px-2.5 py-0.5 border',
                    status.bgColor,
                    status.color,
                  )}
                  variant="outline"
                >
                  {status.label}
                </Badge>
              </div>
            </div>

            {/* Right: Time in process + USD */}
            <div className="flex items-center gap-5 shrink-0">
              {tracking && !isCompleted && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                    Tiempo en proceso
                  </p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-lg font-bold text-foreground">
                      {tracking.diasEnProceso}d
                    </span>
                  </div>
                </div>
              )}
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                  Monto
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(pim.total_usd)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Origin → Destination, Proveedor, Tons */}
        <div className="px-5 pb-3 flex items-center gap-6 text-sm">
          {/* Origin */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs font-medium">
              {pim.origen || 'Origen N/D'}
            </span>
          </div>

          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />

          {/* Destination */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            <span className="text-xs font-medium">Chile</span>
          </div>

          <div className="h-3 w-px bg-border" />

          {/* Cuadro */}
          {pim.cuadroNombre && (
            <>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                {pim.cuadroNombre}
              </Badge>
              <div className="h-3 w-px bg-border" />
            </>
          )}

          {/* Proveedor */}
          {pim.proveedor_nombre && (
            <>
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/70">{pim.proveedor_nombre}</span>
              </span>
              <div className="h-3 w-px bg-border" />
            </>
          )}

          {/* Toneladas */}
          {pim.total_toneladas > 0 && (
            <span className="text-xs text-muted-foreground">
              {pim.total_toneladas.toLocaleString('es-CL', { maximumFractionDigits: 1 })} t
            </span>
          )}

          {/* Full USD */}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatFullCurrency(pim.total_usd)}
          </span>
        </div>

        {/* Row 3: Timeline */}
        <div className={cn('px-5 py-3 border-t border-b', isClosed ? 'bg-gray-50/50' : 'bg-blue-50/30')}>
          <StageTimeline tracking={tracking} />
        </div>

        {/* Row 4: Process Health, Liaison, Action Buttons */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Process Health */}
            {tracking && !isCompleted && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Avance
                </span>
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${processHealth}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {processHealth}%
                </span>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-semibold text-green-600">Proceso completo</span>
              </div>
            )}

            {!tracking && !isClosed && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-[11px] text-muted-foreground/60 italic">Sin seguimiento iniciado</span>
              </div>
            )}

            {/* Separator */}
            {tracking && !isCompleted && <div className="h-4 w-px bg-border" />}

            {/* Liaison / Responsable */}
            {tracking && !isCompleted && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Responsable
                </span>
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground/80">
                  {tracking.responsable || 'Sin asignar'}
                </span>
                {tracking.departamento && (
                  <span className="text-[10px] text-muted-foreground/60 uppercase">
                    · {tracking.departamento === 'comex' ? 'COMEX' : tracking.departamento === 'finanzas' ? 'FINANZAS' : tracking.departamento}
                  </span>
                )}
              </div>
            )}

            {/* SLA indicator */}
            {sla && !isCompleted && (
              <>
                <div className="h-4 w-px bg-border" />
                <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full', sla.bgColor)}>
                  <div className={cn('w-2 h-2 rounded-full', sla.dotColor)} />
                  <span className={cn('text-[10px] font-semibold', sla.textColor)}>
                    {tracking.diasEnProceso}/{tracking.slaDays}d
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-3"
              onClick={(e) => {
                e.stopPropagation();
                setShowDocs(true);
              }}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Documentos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-3"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/comex/pim/seguimiento/${pim.id}`);
              }}
            >
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
              Seguimiento
            </Button>
            {canEdit !== false && (
              <Button
                size="sm"
                className="text-xs h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/comex/pim/editar/${pim.id}`);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 px-3 text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`¿Eliminar ${pim.codigo}? Esta acción no se puede deshacer.`)) {
                    onDelete(pim.id);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <PIMDocumentsSummaryDialog
        pimId={pim.id}
        pimCodigo={pim.codigo}
        open={showDocs}
        onOpenChange={setShowDocs}
      />
    </Card>
  );
}
