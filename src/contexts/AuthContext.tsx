import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types/comex';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasModuleAccess: (moduleId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo - admin with all modules
const mockUser: User = {
  id: 'user-1',
  email: 'admin@planta.com',
  name: 'Carlos Mendoza',
  role: 'admin',
  modules: ['comex', 'work-orders', 'production', 'maintenance', 'analytics', 'logistics'],
  avatar: undefined,
  createdAt: new Date('2024-01-01'),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    if (email && password.length >= 4) {
      // Assign modules based on email domain or role simulation
      const isAdmin = email.includes('admin');
      const modules = isAdmin 
        ? ['comex', 'work-orders', 'production', 'maintenance', 'analytics', 'logistics']
        : ['comex']; // Regular users only get COMEX for now

      setUser({
        ...mockUser,
        email,
        name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: isAdmin ? 'admin' : 'operator',
        modules,
      });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const hasModuleAccess = useCallback((moduleId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.modules.includes(moduleId);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasModuleAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
