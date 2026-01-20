import { cn } from '@/lib/utils';
import { PIMStatus } from '@/types/comex';

interface PIMStatusBadgeProps {
  status: PIMStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<PIMStatus, { label: string; className: string }> = {
  creado: { label: 'Creado', className: 'bg-muted text-muted-foreground' },
  en_negociacion: { label: 'En Negociación', className: 'bg-info/10 text-info' },
  contrato_pendiente: { label: 'Contrato Pendiente', className: 'bg-warning/10 text-warning' },
  contrato_validado: { label: 'Contrato Validado', className: 'bg-success/10 text-success' },
  apertura_lc: { label: 'Apertura L/C', className: 'bg-info/10 text-info' },
  anticipo_pendiente: { label: 'Anticipo Pendiente', className: 'bg-warning/10 text-warning' },
  en_produccion: { label: 'En Producción', className: 'bg-chart-5/10 text-chart-5' },
  en_transito: { label: 'En Tránsito', className: 'bg-info/10 text-info' },
  en_puerto: { label: 'En Puerto', className: 'bg-accent/10 text-accent' },
  en_aduana: { label: 'En Aduana', className: 'bg-warning/10 text-warning' },
  liberado: { label: 'Liberado', className: 'bg-success/10 text-success' },
  entregado: { label: 'Entregado', className: 'bg-success/10 text-success' },
  cerrado: { label: 'Cerrado', className: 'bg-muted text-muted-foreground' },
};

export function PIMStatusBadge({ status, size = 'md' }: PIMStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      )}
    >
      {config.label}
    </span>
  );
}
