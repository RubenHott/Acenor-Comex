# Implementar Autenticación

## Resumen

Migrar de autenticación mock a Supabase Auth real.

## Pasos Principales

### 1. Crear Tabla de Roles

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  modules TEXT[] DEFAULT ARRAY['comex'],
  UNIQUE(user_id)
);
```

### 2. Crear Trigger Auto-Registro

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Actualizar AuthContext

- Usar `supabase.auth.signInWithPassword()`
- Usar `supabase.auth.onAuthStateChange()`
- Obtener rol de `user_roles` tabla

### 4. Configurar Supabase Dashboard

- Site URL: tu dominio
- Redirect URLs: localhost + producción

Ver documentación completa en [auth-implementation.md](../backend/auth-implementation.md).
