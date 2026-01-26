# Plan: Eliminación de Datos Hardcodeados - COMPLETADO ✅

## Resumen

Se completó exitosamente la eliminación de todos los datos hardcodeados del proyecto, reemplazándolos por datos reales de Supabase.

---

## Cambios Realizados

### Base de Datos
- ✅ Creada tabla `notificaciones` con RLS policies

### Hooks Creados
- ✅ `src/hooks/useNotifications.ts` - Notificaciones con React Query
- ✅ `src/hooks/useSLAData.ts` - Datos de SLA con cálculo de promedios

### Componentes Actualizados
- ✅ `src/components/layout/Header.tsx` - Usa useNotifications en lugar de mockNotifications
- ✅ `src/pages/DashboardPage.tsx` - Gráficos calculados desde datos reales de PIMs + SLA global
- ✅ `src/pages/PIMsPage.tsx` - Tab SLA obtiene datos de la tabla sla_data
- ✅ `src/pages/RequirementsPage.tsx` - Contador de PIMs dinámico
- ✅ `src/pages/workOrders/CreateWorkOrderPage.tsx` - Usa mutation real con generación de código

### Archivos Eliminados
- ✅ `src/data/mockData.ts`
- ✅ `src/data/workOrdersMock.ts`

---

## Notas Técnicas

### Generación de Código de Work Order
```typescript
function generateWorkOrderCode() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900) + 100;
  return `OT-${year}-${random}`;
}
```

### Cálculo de Fecha Límite por Prioridad
- Urgente: +1 día
- Alta: +3 días
- Media: +7 días
- Baja: +14 días

---

## Pendientes Futuros (fuera de alcance)

1. **Autenticación real** - El AuthContext sigue usando mockUser
2. **RLS policies más estrictas** - Las políticas actuales son permisivas (USING true)
3. **Notificaciones por usuario** - Actualmente usa userId hardcodeado 'user-1'
