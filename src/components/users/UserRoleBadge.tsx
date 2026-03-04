import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/userConstants';

const roleColors: Record<string, string> = {
  admin: 'border-red-500/50 text-red-600 bg-red-500/10',
  gerente: 'border-purple-500/50 text-purple-600 bg-purple-500/10',
  manager: 'border-purple-500/50 text-purple-600 bg-purple-500/10',
  jefe_comex: 'border-blue-500/50 text-blue-600 bg-blue-500/10',
  analista_comex: 'border-sky-500/50 text-sky-600 bg-sky-500/10',
  jefe_finanzas: 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10',
  analista_finanzas: 'border-teal-500/50 text-teal-600 bg-teal-500/10',
  viewer: 'border-gray-400/50 text-gray-500 bg-gray-400/10',
};

interface UserRoleBadgeProps {
  role: string;
  className?: string;
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(roleColors[role] || 'border-muted-foreground/50', className)}
    >
      {getRoleLabel(role)}
    </Badge>
  );
}
