# Políticas RLS (Row Level Security)

> ⚠️ **CRÍTICO**: Este documento describe el estado actual de seguridad. Se requieren mejoras significativas antes de producción.

## Estado Actual por Tabla

### Tablas con RLS Configurado

#### cuadros_importacion

| Política | Comando | Expresión | ⚠️ Riesgo |
|----------|---------|-----------|-----------|
| Usuarios autenticados pueden ver cuadros | SELECT | `auth.role() = 'authenticated'` | Bajo |
| Permitir lectura de cuadros activos | SELECT | `activo = true` | Bajo |
| Permitir lectura de cuadros | SELECT | `true` | 🔴 Alto - Público |
| Permitir inserción de cuadros | INSERT | `true` | 🔴 Alto - Público |
| Permitir actualización de cuadros | UPDATE | `true` | 🔴 Alto - Público |

**❌ No permite**: DELETE

---

#### pim_documentos

| Política | Comando | Expresión | ⚠️ Riesgo |
|----------|---------|-----------|-----------|
| Usuarios autenticados pueden ver documentos | SELECT | `auth.role() = 'authenticated'` | Medio |

**❌ No permite**: INSERT, UPDATE, DELETE

---

#### pim_items

| Política | Comando | Expresión | ⚠️ Riesgo |
|----------|---------|-----------|-----------|
| Usuarios autenticados pueden ver items | SELECT | `auth.role() = 'authenticated'` | Bajo |
| Permitir lectura de pim items | SELECT | `true` | 🔴 Alto - Público |
| Permitir inserción de pim items | INSERT | `true` | 🔴 Alto - Público |

**❌ No permite**: UPDATE, DELETE

---

#### pims

| Política | Comando | Expresión | ⚠️ Riesgo |
|----------|---------|-----------|-----------|
| Usuarios autenticados pueden ver PIMs | SELECT | `auth.role() = 'authenticated'` | Bajo |
| Permitir lectura de pims | SELECT | `true` | 🔴 Alto - Público |
| Permitir inserción de pims | INSERT | `true` | 🔴 Alto - Público |
| Permitir actualización de pims | UPDATE | `true` | 🔴 Alto - Público |

**❌ No permite**: DELETE

---

#### productos

| Política | Comando | Expresión | ⚠️ Riesgo |
|----------|---------|-----------|-----------|
| Usuarios autenticados pueden ver productos | SELECT | `auth.role() = 'authenticated'` | Bajo |
| Permitir lectura de productos | SELECT | `true` | 🔴 Alto - Público |
| Permitir inserción de productos | INSERT | `true` | 🔴 Alto - Público |
| Permitir actualización de productos | UPDATE | `true` | 🔴 Alto - Público |

**❌ No permite**: DELETE

---

#### proveedores

| Política | Comando | Expresión | ⚠️ Riesgo |
|----------|---------|-----------|-----------|
| Usuarios autenticados pueden ver proveedores | SELECT | `auth.role() = 'authenticated'` | Bajo |
| Permitir lectura de proveedores | SELECT | `true` | 🔴 Alto - Público |
| Permitir inserción de proveedores | INSERT | `true` | 🔴 Alto - Público |
| Permitir actualización de proveedores | UPDATE | `true` | 🔴 Alto - Público |

**❌ No permite**: DELETE

---

#### requerimiento_items

| Política | Comando | Expresión | ⚠️ Riesgo |
|----------|---------|-----------|-----------|
| Usuarios autenticados pueden ver items | SELECT | `auth.role() = 'authenticated'` | Bajo |
| Permitir lectura de items requerimiento | SELECT | `true` | 🔴 Alto - Público |
| Permitir inserción de items requerimiento | INSERT | `true` | 🔴 Alto - Público |
| Permitir actualización de items requerimiento | UPDATE | `true` | 🔴 Alto - Público |

**❌ No permite**: DELETE

---

#### requerimientos_mensuales

| Política | Comando | Expresión | ⚠️ Riesgo |
|----------|---------|-----------|-----------|
| Usuarios autenticados pueden ver requerimientos | SELECT | `auth.role() = 'authenticated'` | Bajo |
| Permitir lectura de requerimientos | SELECT | `true` | 🔴 Alto - Público |
| Permitir inserción de requerimientos | INSERT | `true` | 🔴 Alto - Público |
| Permitir actualización de requerimientos | UPDATE | `true` | 🔴 Alto - Público |

**❌ No permite**: DELETE

---

### ❌ Tablas SIN Políticas RLS

Estas tablas tienen RLS habilitado pero **sin políticas definidas**, lo que significa que **nadie puede acceder**:

| Tabla | Estado | Acción Requerida |
|-------|--------|------------------|
| `diferencia_contrato` | 🔴 Sin políticas | Crear políticas |
| `pim_requirement_items` | 🔴 Sin políticas | Crear políticas |
| `sla_data` | 🔴 Sin políticas | Crear políticas |
| `validacion_contrato_pim` | 🔴 Sin políticas | Crear políticas |

---

## Problemas de Seguridad

### 1. Políticas `USING (true)`

**Riesgo**: Acceso público sin autenticación.

```sql
-- ❌ Problema actual
CREATE POLICY "Permitir lectura" ON tabla FOR SELECT USING (true);

-- ✅ Corrección recomendada
CREATE POLICY "Solo autenticados" ON tabla FOR SELECT 
USING (auth.role() = 'authenticated');
```

### 2. Tablas sin DELETE

Ninguna tabla permite DELETE, lo que puede causar:
- Acumulación de datos basura
- Incapacidad de cumplir con GDPR/derecho al olvido
- Problemas de integridad referencial

### 3. Sin Restricción por Usuario

Actualmente cualquier usuario autenticado puede ver/editar todos los datos.

```sql
-- ❌ Problema actual
USING (auth.role() = 'authenticated');

-- ✅ Mejora recomendada
USING (
  auth.uid() = creado_por 
  OR has_role('admin')
);
```

---

## Plan de Remediación

### Paso 1: Crear Tabla de Roles

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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
```

### Paso 2: Crear Función Helper

```sql
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND (
      role = required_role
      OR role = 'admin'  -- Admin tiene todos los permisos
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Paso 3: Actualizar Políticas

```sql
-- Ejemplo para tabla pims
DROP POLICY IF EXISTS "Permitir lectura de pims" ON public.pims;
DROP POLICY IF EXISTS "Permitir inserción de pims" ON public.pims;
DROP POLICY IF EXISTS "Permitir actualización de pims" ON public.pims;

-- Solo usuarios autenticados pueden leer
CREATE POLICY "read_pims" ON public.pims FOR SELECT
USING (auth.role() = 'authenticated');

-- Solo operators+ pueden crear
CREATE POLICY "insert_pims" ON public.pims FOR INSERT
WITH CHECK (public.has_role('operator'));

-- Solo managers+ pueden actualizar
CREATE POLICY "update_pims" ON public.pims FOR UPDATE
USING (public.has_role('manager'));

-- Solo admins pueden eliminar
CREATE POLICY "delete_pims" ON public.pims FOR DELETE
USING (public.has_role('admin'));
```

### Paso 4: Agregar Políticas a Tablas Sin RLS

```sql
-- Para sla_data
CREATE POLICY "read_sla_data" ON public.sla_data FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "write_sla_data" ON public.sla_data FOR ALL
USING (public.has_role('operator'));

-- Para diferencia_contrato
CREATE POLICY "read_diferencias" ON public.diferencia_contrato FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "write_diferencias" ON public.diferencia_contrato FOR ALL
USING (public.has_role('operator'));

-- Para pim_requirement_items
CREATE POLICY "read_pim_req_items" ON public.pim_requirement_items FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "write_pim_req_items" ON public.pim_requirement_items FOR ALL
USING (public.has_role('operator'));

-- Para validacion_contrato_pim
CREATE POLICY "read_validaciones" ON public.validacion_contrato_pim FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "write_validaciones" ON public.validacion_contrato_pim FOR ALL
USING (public.has_role('manager'));
```

---

## Checklist de Seguridad

- [ ] Eliminar todas las políticas con `USING (true)`
- [ ] Crear tabla `user_roles`
- [ ] Crear función `has_role()`
- [ ] Agregar políticas a tablas sin RLS
- [ ] Agregar políticas DELETE donde corresponda
- [ ] Implementar auditoría de cambios
- [ ] Revisar políticas de Storage (si se usa)
- [ ] Probar con diferentes roles
