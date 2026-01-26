# Implementación de Autenticación

## Estado Actual: Mock

> ⚠️ **Importante**: La autenticación actual es simulada y NO debe usarse en producción.

### Cómo Funciona Ahora

```typescript
// src/contexts/AuthContext.tsx

const login = async (email: string, password: string): Promise<boolean> => {
  // ❌ Mock: cualquier email/password de 4+ caracteres funciona
  if (email && password.length >= 4) {
    const isAdmin = email.includes('admin');
    
    setUser({
      id: 'user-1',
      email,
      name: email.split('@')[0],
      role: isAdmin ? 'admin' : 'operator',
      modules: isAdmin ? ['comex', 'work-orders', ...] : ['comex'],
      createdAt: new Date(),
    });
    
    return true;
  }
  return false;
};
```

### Problemas

1. **No hay verificación real** de credenciales
2. **Sin persistencia** - se pierde al refrescar
3. **Roles en memoria** - no hay tabla de roles
4. **Sin tokens** - no hay JWT ni sesiones

---

## Plan de Migración a Supabase Auth

### Paso 1: Configurar Supabase Auth

En el dashboard de Supabase:

1. Ir a **Authentication** > **Providers**
2. Habilitar **Email** (ya está habilitado por defecto)
3. Configurar **Site URL**: `https://tu-dominio.lovable.app`
4. Configurar **Redirect URLs**: 
   - `https://tu-dominio.lovable.app/`
   - `http://localhost:5173/` (desarrollo)

### Paso 2: Crear Tabla de Roles

```sql
-- Crear tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  modules TEXT[] DEFAULT ARRAY['comex'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can read own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para auto-crear rol al registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, modules)
  VALUES (NEW.id, 'viewer', ARRAY['comex']);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Paso 3: Crear Función Helper

```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_roles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.user_roles
  WHERE user_id = auth.uid();
  
  RETURN user_role = required_role OR user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_modules()
RETURNS TEXT[] AS $$
BEGIN
  RETURN (
    SELECT modules FROM public.user_roles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Paso 4: Actualizar AuthContext

```typescript
// src/contexts/AuthContext.tsx
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface UserRole {
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  modules: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole['role'];
  modules: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  hasModuleAccess: (moduleId: string) => boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener rol del usuario
  const fetchUserRole = async (supabaseUser: SupabaseUser): Promise<UserRole | null> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, modules')
      .eq('user_id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data;
  };

  // Construir objeto User
  const buildUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const roleData = await fetchUserRole(supabaseUser);
    if (!roleData) return null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
      role: roleData.role,
      modules: roleData.modules,
    };
  };

  // Escuchar cambios de autenticación
  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = await buildUser(session.user);
        setUser(user);
      }
      setIsLoading(false);
    });

    // Listener para cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await buildUser(session.user);
          setUser(user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }, []);

  // Signup
  const signup = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Verificar acceso a módulo
  const hasModuleAccess = useCallback((moduleId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.modules.includes(moduleId);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        hasModuleAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### Paso 5: Actualizar LoginPage

```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await login(email, password);
    
    if (error) {
      setError(error);
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert variant="destructive">{error}</Alert>}
      
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  );
}
```

### Paso 6: Crear Página de Registro (Opcional)

```typescript
// src/pages/SignupPage.tsx
function SignupPage() {
  const { signup } = useAuth();
  
  const handleSubmit = async (data) => {
    const { error } = await signup(data.email, data.password, data.name);
    if (!error) {
      // Redirigir o mostrar mensaje de confirmación
    }
  };
  
  // ... resto del componente
}
```

---

## Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                      Usuario                                 │
│                         │                                    │
│              ┌──────────┴──────────┐                        │
│              ▼                     ▼                        │
│         /login               /signup                        │
│              │                     │                        │
│              ▼                     ▼                        │
│   supabase.auth.signIn    supabase.auth.signUp             │
│              │                     │                        │
│              │                     ▼                        │
│              │           Trigger: handle_new_user           │
│              │                     │                        │
│              │                     ▼                        │
│              │           user_roles insert                  │
│              │                     │                        │
│              └──────────┬──────────┘                        │
│                         ▼                                   │
│              onAuthStateChange                              │
│                         │                                   │
│                         ▼                                   │
│              fetchUserRole(user.id)                         │
│                         │                                   │
│                         ▼                                   │
│              setUser({ ...user, role, modules })           │
│                         │                                   │
│                         ▼                                   │
│              Navigate to /                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist de Migración

- [ ] Configurar Supabase Auth en dashboard
- [ ] Crear tabla `user_roles`
- [ ] Crear trigger `on_auth_user_created`
- [ ] Crear funciones `has_role()`, `get_user_role()`
- [ ] Actualizar `AuthContext.tsx`
- [ ] Actualizar `LoginPage.tsx`
- [ ] Crear `SignupPage.tsx` (opcional)
- [ ] Agregar ruta `/signup` en `App.tsx`
- [ ] Actualizar políticas RLS para usar `auth.uid()`
- [ ] Probar flujo completo
- [ ] Configurar emails de Supabase
- [ ] Implementar recuperación de contraseña
