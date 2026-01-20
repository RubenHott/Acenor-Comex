import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SLAIndicatorProps {
  label: string;
  diasEstimados: number;
  diasReales?: number;
  alerta: 'verde' | 'amarillo' | 'rojo';
  showDetails?: boolean;
}

export function SLAIndicator({ label, diasEstimados, diasReales, alerta, showDetails = true }: SLAIndicatorProps) {
  const alertStyles = {
    verde: {
      bg: 'bg-success/10',
      border: 'border-success/30',
      text: 'text-success',
      icon: CheckCircle,
    },
    amarillo: {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      icon: Clock,
    },
    rojo: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      text: 'text-destructive',
      icon: AlertTriangle,
    },
  };

  const style = alertStyles[alerta];
  const Icon = style.icon;
  const progress = diasReales !== undefined ? Math.min((diasReales / diasEstimados) * 100, 100) : 0;
  const isOver = diasReales !== undefined && diasReales > diasEstimados;

  return (
    <div className={cn('rounded-lg p-3 border', style.bg, style.border)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Icon className={cn('h-4 w-4', style.text)} />
      </div>
      
      {showDetails && (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className={cn('text-2xl font-bold', style.text)}>
              {diasReales ?? '-'}
            </span>
            <span className="text-sm text-muted-foreground">/ {diasEstimados} días</span>
          </div>

          {diasReales !== undefined && (
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isOver ? 'bg-destructive' : alerta === 'amarillo' ? 'bg-warning' : 'bg-success'
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
