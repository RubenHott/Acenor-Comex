# Agregar Tabla, Función SQL o Edge Function

Guía para agregar nuevos elementos al backend Supabase.

---

## Agregar Tabla

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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

---

## Agregar Función SQL

Para agregar cálculos que se ejecuten en el servidor PostgreSQL.

### 1. Crear Migración con la Función

```sql
CREATE OR REPLACE FUNCTION public.fn_mi_calculo(param_id TEXT)
RETURNS TABLE (
  total INTEGER,
  promedio NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total,
    AVG(valor)::NUMERIC as promedio
  FROM mi_tabla
  WHERE id = param_id;
END;
$$;
```

### 2. Llamar desde Frontend

```typescript
const { data, error } = await supabase.rpc('fn_mi_calculo', {
  param_id: 'abc-123'
});
```

### 3. O desde Edge Function

```typescript
const { data, error } = await supabase.rpc('fn_mi_calculo', {
  param_id: 'abc-123'
});
```

---

## Agregar Edge Function

Para lógica de negocio compleja, orquestación o llamadas a APIs externas.

### 1. Crear Carpeta y Archivo

```
supabase/functions/mi-funcion/
└── index.ts
```

### 2. Escribir el Código

```typescript
// supabase/functions/mi-funcion/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Lógica de negocio
    const { data, error } = await supabase.rpc('fn_mi_calculo');
    
    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

### 3. Agregar Configuración

```toml
# supabase/config.toml

[functions.mi-funcion]
verify_jwt = false  # Cambiar a true si requiere autenticación
```

### 4. Crear Hook en Frontend

```typescript
// src/hooks/useMiFuncion.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMiFuncion() {
  return useQuery({
    queryKey: ['mi-funcion'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('mi-funcion');
      if (error) throw error;
      return data;
    },
  });
}
```

### 5. Usar en Componente

```typescript
const { data, isLoading, error } = useMiFuncion();
```

---

## Agregar Trigger

Para ejecutar lógica automáticamente cuando cambian datos.

### 1. Crear Función del Trigger

```sql
CREATE OR REPLACE FUNCTION public.trg_mi_funcion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Lógica del trigger
  NEW.updated_at = now();
  
  -- Ejemplo: calcular campo derivado
  NEW.total_calculado = NEW.cantidad * NEW.precio;
  
  RETURN NEW;
END;
$$;
```

### 2. Crear el Trigger

```sql
CREATE TRIGGER trg_mi_tabla_update
BEFORE INSERT OR UPDATE ON public.mi_tabla
FOR EACH ROW
EXECUTE FUNCTION public.trg_mi_funcion();
```

---

## Cuándo Usar Cada Opción

| Necesidad | Solución |
|-----------|----------|
| Almacenar datos | Tabla |
| Cálculos pesados sobre datos | Función SQL |
| Lógica automática al cambiar datos | Trigger |
| Orquestar múltiples operaciones | Edge Function |
| Llamar APIs externas | Edge Function |
| Lógica de negocio compleja | Edge Function |

---

## Checklist

- [ ] Tabla creada con migración SQL
- [ ] RLS habilitado y políticas creadas
- [ ] Función SQL probada con `supabase.rpc()`
- [ ] Edge Function desplegada y probada
- [ ] Trigger funcionando correctamente
- [ ] Hook de React Query creado
- [ ] Documentación actualizada

---

*Última actualización: Enero 2026*
