import { Outlet, Navigate } from 'react-router-dom';
import { ComexSidebar } from './ComexSidebar';
import { useAuth } from '@/contexts/AuthContext';

export function ComexLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ComexSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
