import { Header } from '@/components/layout/Header';
import { useLocation } from 'react-router-dom';
import { 
  Construction, 
  FileCheck, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Bell, 
  Settings 
} from 'lucide-react';

const pageConfig: Record<string, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = {
  '/contracts': { title: 'Contratos', subtitle: 'Gestión y validación de contratos', icon: FileCheck },
  '/payments': { title: 'Pagos', subtitle: 'Control de pagos y cartas de crédito', icon: CreditCard },
  '/prices': { title: 'Lista de Precios', subtitle: 'Historial y gestión de precios de importación', icon: TrendingUp },
  '/users': { title: 'Usuarios', subtitle: 'Administración de usuarios y permisos', icon: Users },
  '/notifications': { title: 'Notificaciones', subtitle: 'Centro de notificaciones y alertas', icon: Bell },
  '/settings': { title: 'Configuración', subtitle: 'Configuración del sistema', icon: Settings },
};

export default function ComingSoonPage() {
  const location = useLocation();
  const config = pageConfig[location.pathname] || { 
    title: 'Próximamente', 
    subtitle: 'Esta funcionalidad estará disponible pronto',
    icon: Construction 
  };
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header title={config.title} subtitle={config.subtitle} />

      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Módulo en Desarrollo</h2>
          <p className="text-muted-foreground mb-6">
            El módulo de {config.title.toLowerCase()} se encuentra actualmente en desarrollo. 
            Pronto estará disponible con todas sus funcionalidades.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Construction className="h-4 w-4 animate-pulse" />
            <span>Trabajando en ello...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
