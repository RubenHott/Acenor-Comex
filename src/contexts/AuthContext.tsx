import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole, Department } from '@/types/comex';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasModuleAccess: (moduleId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map roles to default module access
function getModulesForRole(role: UserRole, modules?: string[]): string[] {
  if (modules && modules.length > 0) return modules;
  switch (role) {
    case 'admin':
      return ['comex', 'work-orders', 'production', 'maintenance', 'analytics', 'logistics'];
    case 'manager':
    case 'gerente':
      return ['comex', 'analytics'];
    case 'jefe_comex':
    case 'analista_comex':
      return ['comex'];
    case 'jefe_finanzas':
    case 'analista_finanzas':
      return ['comex'];
    default:
      return ['comex'];
  }
}

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const role = data.role as UserRole;
  const department = data.department as Department;
  const modules = getModulesForRole(role, data.modules as string[]);

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role,
    department,
    avatar: data.avatar_url || undefined,
    modules,
    createdAt: new Date(data.created_at),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: check existing session
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) setUser(profile);
        }
      } catch (err) {
        console.error('Error initializing session:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;

    const profile = await fetchUserProfile(data.user.id);
    if (!profile) return false;

    setUser(profile);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const hasModuleAccess = useCallback((moduleId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.modules.includes(moduleId);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasModuleAccess,
    }}>
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
