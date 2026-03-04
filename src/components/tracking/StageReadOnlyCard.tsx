import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Lock, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StageDef } from '@/lib/trackingChecklists';
import type { TrackingStage, ChecklistItem } from '@/hooks/usePIMTracking';

interface Props {
  stageDef: StageDef;
  stage?: TrackingStage;
  checklistItems?: ChecklistItem[];
  docsUploaded?: number;
  docsRequired?: number;
  openNCs?: number;
}

const DEPT_LABELS: Record<string, string> = {
  comex: 'COMEX',
  finanzas: 'Finanzas',
  gerencia: 'Gerencia',
  sistemas: 'Sistemas',
};

const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle; label: string }> = {
  completado: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, label: 'Completado' },
  en_progreso: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock, label: 'En progreso' },
  pendiente: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Lock, label: 'Pendiente' },
};

export function StageReadOnlyCard({
  stageDef,
  stage,
  checklistItems = [],
  docsUploaded = 0,
  docsRequired = 0,
  openNCs = 0,
}: Props) {
  const status = stage?.status || 'pendiente';
  const config = statusConfig[status] || statusConfig.pendiente;
  const StatusIcon = config.icon;

  const completed = checklistItems.filter((i) => i.completado).length;
  const total = checklistItems.length;
  const checklistProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="border-dashed opacity-80">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                config.bg,
                config.text
              )}
            >
              <StatusIcon className="h-4 w-4" />
            </div>
            <div>
              <span>{stageDef.name}</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {stageDef.departments.map((d) => DEPT_LABELS[d] || d).join(' + ')}
              </p>
            </div>
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-xs flex-shrink-0',
              status === 'completado' && 'border-green-300 bg-green-50 text-green-700',
              status === 'en_progreso' && 'border-blue-300 bg-blue-50 text-blue-700',
              status === 'pendiente' && 'border-muted-foreground/30'
            )}
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Checklist progress */}
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Checklist</p>
              <p className="text-sm font-medium">{checklistProgress}% ({completed}/{total})</p>
            </div>
          </div>

          {/* Documents */}
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Documentos</p>
              <p className="text-sm font-medium">{docsUploaded}/{docsRequired}</p>
            </div>
          </div>

          {/* Open NCs */}
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className={cn('h-4 w-4', openNCs > 0 ? 'text-red-500' : 'text-muted-foreground')} />
            <div>
              <p className="text-xs text-muted-foreground">NCs abiertas</p>
              <p className={cn('text-sm font-medium', openNCs > 0 && 'text-red-600')}>{openNCs}</p>
            </div>
          </div>

          {/* Responsable */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Responsable</p>
              <p className="text-sm font-medium truncate">{stage?.responsable || 'Sin asignar'}</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        {(stage?.fecha_inicio || stage?.fecha_fin) && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {stage?.fecha_inicio && (
              <span>Inicio: {new Date(stage.fecha_inicio).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            )}
            {stage?.fecha_fin && (
              <span>Fin: {new Date(stage.fecha_fin).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3 italic">
          Solo lectura — esta etapa no pertenece a tu departamento.
        </p>
      </CardContent>
    </Card>
  );
}
