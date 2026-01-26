import { Outlet, Navigate } from 'react-router-dom';
import { WorkOrdersSidebar } from './WorkOrdersSidebar';
import { useAuth } from '@/contexts/AuthContext';

export function WorkOrdersLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <WorkOrdersSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
