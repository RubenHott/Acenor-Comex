import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Clock } from 'lucide-react';
import type { ChecklistItem } from '@/hooks/usePIMTracking';
import { cn } from '@/lib/utils';

interface Props {
  items: ChecklistItem[];
  onToggle: (item: ChecklistItem) => void;
  disabled?: boolean;
}

export function TrackingChecklist({ items, onToggle, disabled }: Props) {
  const completed = items.filter((i) => i.completado).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress summary */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-muted-foreground">
          {completed} de {total} completados
        </span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors',
              item.completado ? 'bg-muted/30' : 'hover:bg-muted/50',
              item.critico && !item.completado && 'border-l-2 border-l-orange-500'
            )}
          >
            <Checkbox
              checked={item.completado}
              onCheckedChange={() => onToggle(item)}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm',
                  item.completado && 'line-through text-muted-foreground'
                )}
              >
                {item.texto}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {item.critico && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1 text-orange-600 border-orange-300">
                    <AlertTriangle className="h-3 w-3" />
                    Crítico
                  </Badge>
                )}
                {item.completado_por && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.completado_por}
                  </span>
                )}
                {item.completado_en && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.completado_en).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
