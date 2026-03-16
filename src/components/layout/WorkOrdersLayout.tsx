import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { WorkOrdersSidebar } from './WorkOrdersSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { MobileSidebarProvider, useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { Button } from '@/components/ui/button';

export function WorkOrdersLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MobileSidebarProvider>
      <WorkOrdersInner />
    </MobileSidebarProvider>
  );
}

function WorkOrdersInner() {
  const { setOpen } = useMobileSidebar();
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <WorkOrdersSidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile-only top bar */}
        <div className="md:hidden flex items-center h-14 px-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-semibold text-base">Ordenes de Trabajo</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
