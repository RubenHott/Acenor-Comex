import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Package,
  Ship,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ClipboardList,
  FileCheck,
  CreditCard,
  Bell,
  Building2,
  LogOut,
  ArrowLeft,
  Database,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { label: 'PIMs', href: '/comex/pims', icon: Ship },
  { label: 'Requerimientos', href: '/comex/requirements', icon: ClipboardList, badge: 2 },
  { label: 'Procesos', href: '/comex/procesos', icon: GitBranch },
  { label: 'Contratos', href: '/comex/contracts', icon: FileCheck },
  { label: 'Pagos', href: '/comex/payments', icon: CreditCard },
];

const catalogNavItems: NavItem[] = [
  { label: 'Productos', href: '/comex/products', icon: Package },
  { label: 'Proveedores', href: '/comex/suppliers', icon: Building2 },
  { label: 'Precios', href: '/comex/prices', icon: TrendingUp },
];

const mastersNavItems: NavItem[] = [
  { label: 'Maestros', href: '/comex/maestros', icon: Database },
];

const systemNavItems: NavItem[] = [
  { label: 'Usuarios', href: '/comex/users', icon: Users },
  { label: 'Notificaciones', href: '/comex/notifications', icon: Bell, badge: 3 },
  { label: 'Configuración', href: '/comex/settings', icon: Settings },
];

export function ComexSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const { open, setOpen } = useMobileSidebar();

  const handleNavClick = () => {
    if (isMobile) setOpen(false);
  };

  const renderNavItem = (item: NavItem, forceExpanded = false) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    const showLabel = forceExpanded || !collapsed;

    const linkContent = (
      <NavLink
        to={item.href}
        onClick={handleNavClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary',
          !isActive && 'text-sidebar-foreground/80'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
        {showLabel && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground px-1.5">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );

    if (!forceExpanded && collapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.label}
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground px-1.5">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  };

  const renderNavSections = (forceExpanded = false) => {
    const showLabel = forceExpanded || !collapsed;
    return (
      <>
        {/* Main Section */}
        <div className="space-y-1">
          {showLabel && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
              Principal
            </p>
          )}
          {mainNavItems.map((item) => renderNavItem(item, forceExpanded))}
        </div>

        {/* Catalogs Section */}
        <div className="space-y-1">
          {showLabel && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
              Catálogos
            </p>
          )}
          {catalogNavItems.map((item) => renderNavItem(item, forceExpanded))}
        </div>

        {/* Maestros */}
        <div className="space-y-1">
          {showLabel && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
              Maestros
            </p>
          )}
          {mastersNavItems.map((item) => renderNavItem(item, forceExpanded))}
        </div>

        {/* System Section */}
        <div className="space-y-1">
          {showLabel && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
              Sistema
            </p>
          )}
          {systemNavItems.map((item) => renderNavItem(item, forceExpanded))}
        </div>
      </>
    );
  };

  // ── Mobile: Sheet overlay ──
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-accent shadow-md">
                <Ship className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-sidebar-foreground">COMEX</span>
                <span className="text-[10px] text-sidebar-foreground/60 -mt-1">Trade Management</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {renderNavSections(true)}
          </nav>

          {/* User & Logout */}
          <div className="border-t border-sidebar-border p-3">
            {user && (
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-semibold text-sm">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-sidebar-foreground/60 truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => { logout(); setOpen(false); }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── Desktop: Fixed sidebar ──
  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Back Button */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-accent shadow-md">
            <Ship className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">COMEX</span>
              <span className="text-[10px] text-sidebar-foreground/60 -mt-1">Trade Management</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Volver a módulos</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {renderNavSections()}
      </nav>

      {/* User & Collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-3">
        {/* User Info */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-semibold text-sm">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'px-0'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
