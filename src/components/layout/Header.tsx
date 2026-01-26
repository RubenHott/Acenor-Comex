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
import { useNotifications, useUnreadNotificationsCount, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  // Using 'user-1' as mock user ID until auth is implemented
  const userId = 'user-1';
  const { data: notifications, isLoading } = useNotifications(userId);
  const { data: unreadCount } = useUnreadNotificationsCount(userId);
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkAllRead = () => {
    markAllRead.mutate(userId);
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
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs text-muted-foreground"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
              >
                Marcar todas como leídas
              </Button>
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
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        notification.prioridad === 'alta' || notification.prioridad === 'urgente'
                          ? 'bg-destructive'
                          : notification.prioridad === 'media'
                          ? 'bg-warning'
                          : 'bg-muted-foreground'
                      )}
                    />
                    <span className="font-medium text-sm flex-1">{notification.titulo}</span>
                    {!notification.leido && (
                      <span className="h-2 w-2 rounded-full bg-info" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground pl-4">{notification.mensaje}</p>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No hay notificaciones
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary font-medium">
              Ver todas las notificaciones
            </DropdownMenuItem>
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
