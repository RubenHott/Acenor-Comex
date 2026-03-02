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

const SUPABASE_URL = 'https://ykzeuukqhliuslycjcxc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlremV1dWtxaGxpdXNseWNqY3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDk4MTAsImV4cCI6MjA4NDQyNTgxMH0.SbBmdah7I86XBtelWgIUJLE30GsEcsTJzA9S3iJPe_c';

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

// Use direct fetch instead of Supabase client query builder for reliability
async function fetchUserProfile(userId: string, accessToken: string): Promise<User | null> {
  console.log('[Auth] fetchUserProfile start:', userId);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `${SUPABASE_URL}/rest/v1/user_profiles?select=*&id=eq.${userId}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Accept-Profile': 'public',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error('[Auth] fetchUserProfile HTTP error:', res.status);
      return null;
    }

    const rows = await res.json();
    console.log('[Auth] fetchUserProfile rows:', rows?.length);
    const data = rows?.[0];
    if (!data) return null;

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
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error('[Auth] fetchUserProfile aborted (timeout)');
    } else {
      console.error('[Auth] fetchUserProfile error:', err);
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: check existing session
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        // Race against a timeout so the app never stays stuck on the spinner
        const timeout = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 4000)
        );
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeout,
        ]);
        if (session?.user && session.access_token && mounted) {
          const profile = await fetchUserProfile(session.user.id, session.access_token);
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
        if (event === 'SIGNED_IN' && session?.user && session.access_token) {
          const profile = await fetchUserProfile(session.user.id, session.access_token);
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
    console.log('[Auth] login start:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[Auth] signIn result:', { user: !!data?.user, error: error?.message });
    if (error || !data.user || !data.session) return false;

    console.log('[Auth] fetching profile for:', data.user.id);
    const profile = await fetchUserProfile(data.user.id, data.session.access_token);
    console.log('[Auth] profile result:', { found: !!profile, name: profile?.name });
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
