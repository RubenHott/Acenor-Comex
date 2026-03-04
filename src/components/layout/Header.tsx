import { Bell, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificacionesRealtime,
} from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const TIPO_ICONS: Record<string, string> = {
  stage_advance: '🔄',
  responsable_change: '👤',
  nc_created: '⚠️',
  dhl_arrived: '📦',
  nc_resolved: '✅',
};

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const { data: notifications, isLoading } = useNotifications(userId);
  const { data: unreadCount } = useUnreadNotificationsCount(userId);
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  // Subscribe to realtime notifications
  useNotificacionesRealtime(userId);

  const handleMarkAllRead = () => {
    if (userId) markAllRead.mutate(userId);
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.leido) {
      markRead.mutate(notification.id);
    }
    if (notification.pim_id) {
      navigate(`/comex/pim/seguimiento/${notification.pim_id}`);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar PIMs, productos..."
            className="w-64 pl-9 bg-background border-input"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount! > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              {(unreadCount ?? 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                >
                  Marcar todas leidas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoading ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.slice(0, 8).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    !notification.leido && 'bg-blue-50/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm">
                      {TIPO_ICONS[notification.tipo] || '🔔'}
                    </span>
                    <span className={cn('text-sm flex-1 truncate', !notification.leido && 'font-medium')}>
                      {notification.titulo}
                    </span>
                    {!notification.leido && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground pl-6 line-clamp-2">{notification.mensaje}</p>
                  <p className="text-[10px] text-muted-foreground pl-6">
                    {new Date(notification.fecha_creacion).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No hay notificaciones
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
