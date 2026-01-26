# Agregar Tabla Supabase

## Pasos

### 1. Crear Migración SQL

```sql
CREATE TABLE public.nueva_tabla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_policy" ON public.nueva_tabla
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "write_policy" ON public.nueva_tabla
FOR ALL USING (public.has_role('operator'));
```

### 2. Tipos se Actualizan Automáticamente

`src/integrations/supabase/types.ts` se regenera.

### 3. Crear Hook

```typescript
// src/hooks/useNuevaTabla.ts
export function useNuevaTabla() {
  return useQuery({
    queryKey: ['nueva_tabla'],
    queryFn: async () => {
      const { data, error } = await supabase.from('nueva_tabla').select('*');
      if (error) throw error;
      return data;
    },
  });
}
```

### 4. Usar en Componente

```typescript
const { data, isLoading } = useNuevaTabla();
```
