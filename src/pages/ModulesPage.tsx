import { Ship, ClipboardList, Factory, Wrench, BarChart3, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ModuleCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  available: boolean;
}

const modules: ModuleCard[] = [
  {
    id: 'comex',
    name: 'COMEX',
    description: 'Seguimiento de importaciones, PIMs, contratos y pagos internacionales',
    icon: Ship,
    path: '/comex',
    color: 'from-blue-600 to-cyan-500',
    available: true,
  },
  {
    id: 'work-orders',
    name: 'Órdenes de Trabajo',
    description: 'Gestión y seguimiento de órdenes de trabajo de producción',
    icon: ClipboardList,
    path: '/work-orders',
    color: 'from-emerald-600 to-teal-500',
    available: false,
  },
  {
    id: 'production',
    name: 'Producción',
    description: 'Control de líneas de producción y eficiencia operativa',
    icon: Factory,
    path: '/production',
    color: 'from-orange-600 to-amber-500',
    available: false,
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento',
    description: 'Gestión de mantenimiento preventivo y correctivo',
    icon: Wrench,
    path: '/maintenance',
    color: 'from-purple-600 to-pink-500',
    available: false,
  },
  {
    id: 'analytics',
    name: 'Analítica',
    description: 'Dashboards y reportes de indicadores clave',
    icon: BarChart3,
    path: '/analytics',
    color: 'from-indigo-600 to-violet-500',
    available: false,
  },
  {
    id: 'logistics',
    name: 'Logística',
    description: 'Control de almacén, inventarios y distribución',
    icon: Truck,
    path: '/logistics',
    color: 'from-rose-600 to-red-500',
    available: false,
  },
];

export default function ModulesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent shadow-lg">
              <Factory className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Plant Management System</h1>
              <p className="text-sm text-muted-foreground">Sistema integral de gestión de planta</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-1">Módulos Disponibles</h2>
          <p className="text-sm text-muted-foreground">Selecciona un módulo para acceder a sus funcionalidades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => module.available && navigate(module.path)}
                disabled={!module.available}
                className={cn(
                  'group relative flex flex-col p-6 rounded-2xl border text-left transition-all duration-300',
                  module.available
                    ? 'bg-card hover:bg-card/80 border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 cursor-pointer hover:-translate-y-1'
                    : 'bg-muted/30 border-border/50 cursor-not-allowed opacity-60'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg mb-4 transition-transform duration-300',
                    module.color,
                    module.available && 'group-hover:scale-110'
                  )}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">{module.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>

                {/* Status Badge */}
                {!module.available && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    Próximamente
                  </span>
                )}

                {/* Arrow indicator for available modules */}
                {module.available && (
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Acceder</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
