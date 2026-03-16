import { Outlet, Navigate } from 'react-router-dom';
import { ComexSidebar } from './ComexSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { MobileSidebarProvider } from '@/contexts/MobileSidebarContext';

export function ComexLayout() {
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
      <div className="flex h-screen bg-background overflow-hidden">
        <ComexSidebar />
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </MobileSidebarProvider>
  );
}
