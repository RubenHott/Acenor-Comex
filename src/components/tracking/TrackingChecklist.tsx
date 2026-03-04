import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import type { ChecklistItem } from '@/hooks/usePIMTracking';
import type { Department, UserRole } from '@/types/comex';
import { cn } from '@/lib/utils';

interface Props {
  items: ChecklistItem[];
  onToggle: (item: ChecklistItem) => void;
  disabled?: boolean;
  /** If set, only shows items matching this department. Shows summary for other departments. */
  userDepartment?: Department;
  /** Map of checklist_key → department from ChecklistItemDef */
  itemDepartments?: Map<string, Department>;
  /** User role — admin/manager bypasses department filtering and sees all items */
  userRole?: UserRole;
}

const DEPT_LABELS: Record<string, string> = {
  comex: 'COMEX',
  finanzas: 'Finanzas',
  gerencia: 'Gerencia',
  sistemas: 'Sistemas',
};

export function TrackingChecklist({ items, onToggle, disabled, userDepartment, itemDepartments, userRole }: Props) {
  const [showOtherDepts, setShowOtherDepts] = useState(false);

  // Admin and manager see ALL items without department filtering
  const isFullAccess = userRole === 'admin' || userRole === 'manager';

  // Split items by department if filtering is active (skip for admin/manager)
  let myItems = items;
  let otherDeptGroups: Map<string, ChecklistItem[]> = new Map();

  if (!isFullAccess && userDepartment && itemDepartments && itemDepartments.size > 0) {
    myItems = items.filter((i) => {
      const dept = itemDepartments.get(i.checklist_key);
      return !dept || dept === userDepartment;
    });

    // Group other items by department
    const otherItems = items.filter((i) => {
      const dept = itemDepartments.get(i.checklist_key);
      return dept && dept !== userDepartment;
    });

    for (const item of otherItems) {
      const dept = itemDepartments.get(item.checklist_key) || 'otro';
      if (!otherDeptGroups.has(dept)) otherDeptGroups.set(dept, []);
      otherDeptGroups.get(dept)!.push(item);
    }
  }

  const completed = myItems.filter((i) => i.completado).length;
  const total = myItems.length;
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

      {/* My department's checklist items */}
      <div className="space-y-1">
        {myItems.map((item) => (
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
                    Critico
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

      {/* Other departments summary */}
      {otherDeptGroups.size > 0 && (
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={() => setShowOtherDepts(!showOtherDepts)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full"
          >
            {showOtherDepts ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium">Progreso de otras areas</span>
            <div className="flex gap-2 ml-auto">
              {Array.from(otherDeptGroups.entries()).map(([dept, deptItems]) => {
                const deptCompleted = deptItems.filter((i) => i.completado).length;
                return (
                  <Badge key={dept} variant="outline" className="text-[10px]">
                    {DEPT_LABELS[dept] || dept}: {deptCompleted}/{deptItems.length}
                  </Badge>
                );
              })}
            </div>
          </button>

          {showOtherDepts && (
            <div className="mt-2 space-y-1 pl-6">
              {Array.from(otherDeptGroups.entries()).map(([dept, deptItems]) => (
                <div key={dept}>
                  <p className="text-xs font-medium text-muted-foreground mt-2 mb-1">
                    {DEPT_LABELS[dept] || dept}
                  </p>
                  {deptItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2 py-1.5 px-2 rounded text-xs',
                        item.completado ? 'text-muted-foreground' : 'text-foreground'
                      )}
                    >
                      <div className={cn(
                        'h-3 w-3 rounded-full border flex-shrink-0',
                        item.completado ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
                      )} />
                      <span className={item.completado ? 'line-through' : ''}>{item.texto}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
