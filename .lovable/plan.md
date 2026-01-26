
# Plan: Actualización de Documentación del Proyecto

## Resumen

Actualizar la documentación existente para reflejar los cambios realizados en la migración de cálculos del frontend a Edge Functions y SQL, así como la eliminación de datos mock y la integración real con Supabase.

---

## Documentos a Actualizar

### 1. `docs/README.md` (Principal)

**Cambios necesarios:**

| Sección | Estado Actual | Estado Nuevo |
|---------|---------------|--------------|
| Hallazgos Críticos | Dice "Datos Mock: La app usa datos hardcoded" | Eliminar - ya usa Supabase real |
| Stack Tecnológico | Falta Edge Functions | Agregar Edge Functions (Deno) |
| Última actualización | Enero 2025 | Enero 2026 |

---

### 2. `docs/architecture/README.md` (Arquitectura)

**Cambios necesarios:**

- Actualizar diagrama de arquitectura para incluir la capa de Edge Functions
- Actualizar sección "Capa de Datos" eliminando referencias a Mock Data
- Actualizar sección "Próximos Pasos" eliminando items completados
- Agregar nueva sección describiendo la arquitectura de 3 capas (Frontend → Edge Functions → SQL)

**Nuevo diagrama propuesto:**

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  React Query Hooks → supabase.functions.invoke()                │
│  useDashboardStats, useWorkOrders, usePIMs, etc.                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE FUNCTIONS (Deno)                        │
├─────────────────────────────────────────────────────────────────┤
│  get-dashboard-stats  │  get-work-order-stats  │ create-work-order│
│  Orquesta funciones SQL y retorna JSON consolidado               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│  Funciones SQL: fn_pim_stats, fn_sla_global_stats, etc.         │
│  Triggers: trg_calculate_sla_alerts                              │
│  Tablas: pims, work_orders, sla_data, notificaciones, etc.      │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. `docs/backend/api-integration.md` (Integración API)

**Cambios necesarios:**

- Agregar nueva sección "Edge Functions" explicando cómo invocarlas
- Agregar sección "Funciones SQL (RPC)" con ejemplos de llamadas
- Actualizar tabla "Estado Actual vs Ideal" para reflejar estado completado
- Eliminar sección "Próximos Pasos" obsoleta

**Nuevas secciones a agregar:**

```markdown
## Edge Functions

### Invocar Edge Functions

Las edge functions se llaman usando `supabase.functions.invoke()`:

```typescript
const { data, error } = await supabase.functions.invoke('get-dashboard-stats');
```

### Edge Functions Disponibles

| Función | Propósito | Método |
|---------|-----------|--------|
| `get-dashboard-stats` | Estadísticas consolidadas del dashboard | GET |
| `get-work-order-stats` | Estadísticas de órdenes de trabajo | GET |
| `create-work-order` | Crear nueva orden de trabajo | POST |

## Funciones SQL (RPC)

Las funciones SQL se invocan con `supabase.rpc()`:

```typescript
const { data, error } = await supabase.rpc('fn_pim_stats');
```

### Funciones Disponibles

| Función | Retorna | Descripción |
|---------|---------|-------------|
| `fn_pim_stats()` | TABLE | Estadísticas de PIMs |
| `fn_pim_status_distribution()` | TABLE | Distribución por estado |
| `fn_pim_monthly_trend(months_back)` | TABLE | Tendencia mensual |
| `fn_sla_global_stats()` | JSONB | Estadísticas SLA globales |
| `fn_work_order_stats()` | TABLE | Estadísticas de OTs |
| `fn_generate_work_order_code()` | TEXT | Genera código OT |
| `fn_calculate_due_date(priority)` | TIMESTAMPTZ | Calcula fecha límite |
| `fn_requirement_pim_count(id)` | INTEGER | Cuenta PIMs por requerimiento |
| `fn_get_critical_pim()` | TABLE | Obtiene PIM crítico |
```

---

### 4. `docs/frontend/state-management.md` (Manejo de Estado)

**Cambios necesarios:**

- Actualizar sección "React Query" con ejemplos reales implementados
- Actualizar tabla "Estado Actual vs Ideal" para reflejar estado completado
- Agregar hook `useDashboardStats` como ejemplo principal
- Agregar sección sobre hooks que consumen Edge Functions

---

### 5. `docs/backend/database-schema.md` (Esquema de BD)

**Cambios necesarios:**

- Agregar nueva sección "Funciones SQL" listando las 9 funciones creadas
- Agregar nueva sección "Triggers" documentando el trigger de SLA
- Agregar tabla `notificaciones` al esquema
- Agregar tabla `work_orders` al esquema (módulo OTs)

**Nueva sección propuesta:**

```markdown
## Funciones SQL

El sistema utiliza funciones PL/pgSQL para ejecutar cálculos en el servidor:

### Funciones de Estadísticas

| Función | Tipo Retorno | Descripción |
|---------|--------------|-------------|
| `fn_pim_stats()` | TABLE | Estadísticas agregadas de PIMs |
| `fn_pim_status_distribution()` | TABLE | Conteo por estado |
| `fn_pim_monthly_trend(months)` | TABLE | Tendencia mensual |
| `fn_sla_global_stats()` | JSONB | Promedios SLA con alertas |
| `fn_work_order_stats()` | TABLE | Estadísticas de OTs |

### Funciones Utilitarias

| Función | Tipo Retorno | Descripción |
|---------|--------------|-------------|
| `fn_generate_work_order_code()` | TEXT | Genera código OT-YYYY-NNN |
| `fn_calculate_due_date(priority)` | TIMESTAMPTZ | Fecha límite según prioridad |
| `fn_requirement_pim_count(id)` | INTEGER | PIMs asociados a requerimiento |
| `fn_get_critical_pim()` | TABLE | Primer PIM en estado crítico |

## Triggers

| Trigger | Tabla | Evento | Función |
|---------|-------|--------|---------|
| `trg_sla_auto_alerts` | sla_data | BEFORE INSERT/UPDATE | `trg_calculate_sla_alerts()` |

Calcula automáticamente las alertas (verde/amarillo/rojo) cuando se insertan o actualizan datos de SLA.
```

---

### 6. Nuevo Archivo: `docs/backend/edge-functions.md`

**Crear nuevo documento** dedicado a Edge Functions:

```markdown
# Edge Functions

Funciones serverless ejecutadas en Deno para lógica de negocio.

## Configuración

Archivo: `supabase/config.toml`

## Funciones Disponibles

### get-dashboard-stats

Consolida todas las estadísticas del dashboard en una llamada.

**Endpoint**: `supabase.functions.invoke('get-dashboard-stats')`

**Respuesta**:
- `pimStats`: Estadísticas de PIMs
- `statusDistribution`: Distribución por estado
- `monthlyTrend`: Tendencia mensual
- `slaStats`: Estadísticas SLA
- `criticalPim`: PIM crítico actual

### get-work-order-stats

Estadísticas de órdenes de trabajo.

### create-work-order

Crea una nueva orden de trabajo con código auto-generado.

## Desarrollo Local

Las edge functions se despliegan automáticamente al hacer push.

## Debugging

Ver logs en: Supabase Dashboard → Functions → [function] → Logs
```

---

### 7. Actualizar `docs/guides/adding-supabase-table.md`

**Agregar sección** sobre funciones SQL y Edge Functions:

```markdown
## Agregar Función SQL

Para agregar cálculos que se ejecuten en el servidor:

1. Crear migración con la función
2. Llamar desde Edge Function o frontend con `supabase.rpc()`

## Agregar Edge Function

1. Crear carpeta en `supabase/functions/[nombre]/`
2. Crear `index.ts` con la lógica
3. Agregar configuración en `supabase/config.toml`
4. Crear hook en frontend para consumirla
```

---

### 8. Actualizar Hooks Documentation

**Nuevo archivo sugerido**: `docs/frontend/hooks.md`

Documentar todos los hooks disponibles:

| Hook | Propósito | Fuente de Datos |
|------|-----------|-----------------|
| `useDashboardStats()` | Estadísticas consolidadas | Edge Function |
| `usePIMs()` | Lista de PIMs | Supabase directo |
| `useWorkOrders()` | Lista y stats de OTs | Supabase + Edge Function |
| `useSLAData()` | Datos SLA (deprecated) | Supabase directo |
| `useNotifications()` | Notificaciones del usuario | Supabase directo |
| `useProducts()` | Catálogo de productos | Supabase directo |
| `useSuppliers()` | Lista de proveedores | Supabase directo |
| `useRequirements()` | Requerimientos mensuales | Supabase directo |

---

## Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `docs/backend/edge-functions.md` | Documentación de Edge Functions |
| `docs/frontend/hooks.md` | Documentación de React Query hooks |

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| `docs/README.md` | Actualizar estado y fecha |
| `docs/architecture/README.md` | Nuevo diagrama con Edge Functions |
| `docs/backend/api-integration.md` | Agregar Edge Functions y RPC |
| `docs/backend/database-schema.md` | Agregar funciones SQL y triggers |
| `docs/frontend/state-management.md` | Ejemplos reales implementados |
| `docs/guides/adding-supabase-table.md` | Agregar sección Edge Functions |

---

## Orden de Ejecución

1. Crear `docs/backend/edge-functions.md`
2. Crear `docs/frontend/hooks.md`
3. Actualizar `docs/README.md`
4. Actualizar `docs/architecture/README.md`
5. Actualizar `docs/backend/api-integration.md`
6. Actualizar `docs/backend/database-schema.md`
7. Actualizar `docs/frontend/state-management.md`
8. Actualizar `docs/guides/adding-supabase-table.md`

---

## Notas Técnicas

### Cambios Arquitectónicos Documentados

1. **Eliminación de Mock Data**: Los archivos `mockData.ts` y `workOrdersMock.ts` fueron eliminados
2. **Nuevas Edge Functions**: 3 funciones desplegadas en Supabase
3. **Nuevas Funciones SQL**: 9 funciones PL/pgSQL para cálculos
4. **Nuevo Trigger**: Auto-cálculo de alertas SLA
5. **Nueva Tabla**: `notificaciones` para sistema de alertas

### Beneficios a Destacar

- Cálculos ejecutados en servidor (mejor rendimiento)
- Una sola fuente de verdad para lógica de negocio
- Menor transferencia de datos al frontend
- Código más mantenible y testeable
