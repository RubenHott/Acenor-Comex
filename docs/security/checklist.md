# Checklist de Seguridad

## ⚠️ Problemas Críticos

### 1. Autenticación Mock
- Cualquier email/password funciona
- Sin verificación real de credenciales
- **Acción**: Migrar a Supabase Auth

### 2. RLS Permisivo
- Varias tablas tienen `USING (true)` - acceso público
- **Acción**: Cambiar a `auth.role() = 'authenticated'`

### 3. Tablas Sin RLS
- `diferencia_contrato`
- `sla_data`
- `pim_requirement_items`
- `validacion_contrato_pim`
- **Acción**: Crear políticas RLS

### 4. Sin Tabla de Roles
- Roles en memoria, no persistidos
- **Acción**: Crear tabla `user_roles`

## Plan de Remediación

1. Implementar Supabase Auth
2. Crear tabla `user_roles` con función `has_role()`
3. Actualizar todas las políticas RLS
4. Eliminar políticas con `USING (true)`
5. Agregar políticas DELETE donde corresponda

Ver [Implementar Autenticación](../guides/implementing-auth.md) y [Políticas RLS](../backend/rls-policies.md).
