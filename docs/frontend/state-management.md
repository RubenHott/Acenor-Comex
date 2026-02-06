# Manejo de Estado

El proyecto utiliza tres niveles de manejo de estado.

## 1. AuthContext (Autenticación)

**Ubicación**: `src/contexts/AuthContext.tsx`

> ⚠️ **Nota**: Actualmente la autenticación es mock (simulada). Ver [Implementar Autenticación](../guides/implementing-auth.md) para el plan de migración.

### Interface del Contexto

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasModuleAccess: (moduleId: string) => boolean;
}
```

---

## 2. React Query (Estado del Servidor)

**Configuración**: `src/App.tsx`

### Hooks Implementados (15+)

| Hook | Propósito | Fuente de Datos |
|------|-----------|-----------------|
| `useDashboardStats()` | Estadísticas consolidadas | Edge Function |
| `usePIMs()` | Lista de PIMs | Supabase directo |
| `usePIMCreation()` | Crear PIM completo | Supabase (mutation) |
| `usePIMItems()` | Items de un PIM | Supabase directo |
| `usePIMDocuments()` | Documentos de PIM | Supabase + Storage |
| `usePIMTracking()` | Seguimiento por etapas | Supabase directo |
| `useWorkOrders()` | Lista de OTs | Supabase directo |
| `useWorkOrderStats()` | Stats de OTs | Edge Function |
| `useCreateWorkOrder()` | Crear OT | Edge Function (mutation) |
| `useProducts()` | Catálogo de productos | Supabase directo |
| `useSuppliers()` | Lista de proveedores | Supabase directo |
| `useRequirements()` | Requerimientos mensuales | Supabase + RPC |
| `useCuadros()` | Cuadros de importación | Supabase directo |
| `useNotifications()` | Notificaciones | Supabase directo |
| `useSLAData()` | Datos SLA | Supabase directo |

Ver [Hooks](./hooks.md) para documentación completa.

---

## 3. Estado Local (useState)

Para estado que solo necesita un componente: modals, filtros, selección, sidebar colapsado.

---

## Buenas Prácticas

1. **AuthContext**: Solo para datos de sesión del usuario
2. **React Query**: Para datos del servidor (Supabase/Edge Functions)
3. **useState**: Para UI local (modals, filtros, selección)
4. **Invalidar cache**: Después de mutaciones para mantener datos actualizados

---

*Última actualización: Febrero 2026*
