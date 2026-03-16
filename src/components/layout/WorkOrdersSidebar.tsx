import { Link, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  LayoutDashboard,
  List,
  Plus,
  Wrench,
  Factory,
  CheckSquare,
  FileText,
  Bell,
  Users,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/work-orders/dashboard' },
  { icon: List, label: 'Ordenes de Trabajo', path: '/work-orders/orders' },
  { icon: Plus, label: 'Nueva OT', path: '/work-orders/create' },
  { icon: Wrench, label: 'Mantenimiento', path: '/work-orders/maintenance' },
  { icon: Factory, label: 'Produccion', path: '/work-orders/production' },
  { icon: CheckSquare, label: 'Calidad', path: '/work-orders/quality' },
  { icon: FileText, label: 'Reportes', path: '/work-orders/reports' },
];

const configItems = [
  { icon: Bell, label: 'Notificaciones', path: '/work-orders/notifications' },
  { icon: Users, label: 'Tecnicos', path: '/work-orders/users' },
  { icon: Settings, label: 'Configuracion', path: '/work-orders/settings' },
];

export function WorkOrdersSidebar() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { open, setOpen } = useMobileSidebar();

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    if (isMobile) setOpen(false);
  };

  const navContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Ordenes de Trabajo</h2>
            <p className="text-xs text-muted-foreground">Gestion de OTs</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive(item.path)
                ? 'bg-emerald-500/10 text-emerald-600 font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-border">
          <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Configuracion
          </p>
          {configItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive(item.path)
                  ? 'bg-emerald-500/10 text-emerald-600 font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Link
          to="/"
          onClick={handleNavClick}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Modulos
        </Link>
      </div>
    </>
  );

  // Mobile: Sheet overlay
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-card flex flex-col">
          <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
          {navContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col h-full">
      {navContent}
    </aside>
  );
}
