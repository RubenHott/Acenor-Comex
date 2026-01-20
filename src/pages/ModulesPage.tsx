import { Ship, ClipboardList, Factory, Wrench, BarChart3, Truck, LogOut } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface ModuleCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  available: boolean;
}

const allModules: ModuleCard[] = [
  {
    id: 'comex',
    name: 'COMEX',
    description: 'Seguimiento de importaciones y PIMs',
    icon: Ship,
    path: '/comex',
    color: 'from-blue-600 to-cyan-500',
    available: true,
  },
  {
    id: 'work-orders',
    name: 'Órdenes de Trabajo',
    description: 'Gestión de órdenes de producción',
    icon: ClipboardList,
    path: '/work-orders',
    color: 'from-emerald-600 to-teal-500',
    available: false,
  },
  {
    id: 'production',
    name: 'Producción',
    description: 'Control de líneas y eficiencia',
    icon: Factory,
    path: '/production',
    color: 'from-orange-600 to-amber-500',
    available: false,
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento',
    description: 'Mantenimiento preventivo y correctivo',
    icon: Wrench,
    path: '/maintenance',
    color: 'from-purple-600 to-pink-500',
    available: false,
  },
  {
    id: 'analytics',
    name: 'Analítica',
    description: 'Reportes e indicadores clave',
    icon: BarChart3,
    path: '/analytics',
    color: 'from-indigo-600 to-violet-500',
    available: false,
  },
  {
    id: 'logistics',
    name: 'Logística',
    description: 'Almacén e inventarios',
    icon: Truck,
    path: '/logistics',
    color: 'from-rose-600 to-red-500',
    available: false,
  },
];

export default function ModulesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasModuleAccess } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Filter modules based on user access
  const visibleModules = allModules.filter(module => hasModuleAccess(module.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-accent shadow-md">
                <Factory className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Plant Management</h1>
                <p className="text-xs text-muted-foreground">Sistema de gestión de planta</p>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-base font-medium text-foreground">Módulos</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => module.available && navigate(module.path)}
                disabled={!module.available}
                className={cn(
                  'group flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                  module.available
                    ? 'bg-card hover:bg-accent/50 border-border hover:border-primary/30 cursor-pointer'
                    : 'bg-muted/20 border-border/50 cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm flex-shrink-0',
                    module.color
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{module.name}</h3>
                    {!module.available && (
                      <span className="text-[9px] font-medium uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Pronto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{module.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {visibleModules.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tienes acceso a ningún módulo.</p>
            <p className="text-sm text-muted-foreground mt-1">Contacta al administrador.</p>
          </div>
        )}
      </main>
    </div>
  );
}
