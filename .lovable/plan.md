
# Plan de Documentacion Exhaustiva del Sistema Plant Management

## Resumen del Proyecto

Este es un **Sistema de Gestion de Planta** modular construido con React + TypeScript + Tailwind CSS + Supabase. Actualmente tiene dos modulos funcionales:
- **COMEX**: Seguimiento de importaciones y PIMs
- **Ordenes de Trabajo**: Gestion de OTs de mantenimiento/produccion

---

## Seccion 1: Documentacion de Arquitectura General

### 1.1 Crear `docs/architecture/README.md`

Contenido a documentar:
- Diagrama de la arquitectura del sistema (modulos, capas, flujo de datos)
- Tecnologias utilizadas: React 18, Vite, TypeScript, Tailwind CSS, Supabase, React Query, React Router
- Estructura de carpetas del proyecto
- Patron de navegacion: Login -> Seleccion de Modulos -> Dashboard del Modulo

### 1.2 Crear `docs/architecture/module-system.md`

Contenido a documentar:
- Como funciona el sistema de modulos
- Como agregar nuevos modulos
- Configuracion de acceso por rol (`hasModuleAccess`)
- Estructura de un modulo (Layout, Sidebar, Pages)

---

## Seccion 2: Documentacion del Frontend

### 2.1 Crear `docs/frontend/routing.md`

Documentar:
- Estructura de rutas en `App.tsx`
- Rutas protegidas y layouts anidados
- Flujo de navegacion
- Redireccionamientos automaticos

**Rutas actuales:**
```
/ -> ModulesPage (requiere auth)
/login -> LoginPage
/comex/* -> ComexLayout
  /comex/dashboard
  /comex/requirements
  /comex/pims
  /comex/products
  /comex/suppliers
  /comex/contracts (Coming Soon)
  /comex/payments (Coming Soon)
  /comex/prices (Coming Soon)
/work-orders/* -> WorkOrdersLayout
  /work-orders/dashboard
  /work-orders/orders
  /work-orders/orders/:id
  /work-orders/create
  /work-orders/maintenance (Coming Soon)
```

### 2.2 Crear `docs/frontend/components.md`

Documentar componentes reutilizables:

| Componente | Ubicacion | Proposito |
|------------|-----------|-----------|
| `Header` | `layout/Header.tsx` | Encabezado con busqueda y notificaciones |
| `ComexSidebar` | `layout/ComexSidebar.tsx` | Navegacion del modulo COMEX |
| `WorkOrdersSidebar` | `layout/WorkOrdersSidebar.tsx` | Navegacion del modulo OTs |
| `StatCard` | `dashboard/StatCard.tsx` | Tarjeta de estadisticas con variantes |
| `PIMStatusBadge` | `dashboard/PIMStatusBadge.tsx` | Badge de estados de PIM |
| `SLAIndicator` | `dashboard/SLAIndicator.tsx` | Indicador visual de SLA |
| `RecentPIMsTable` | `dashboard/RecentPIMsTable.tsx` | Tabla de PIMs recientes |
| `PriorityBadge` | `workOrders/PriorityBadge.tsx` | Badge de prioridad de OT |
| `WorkOrderStatusBadge` | `workOrders/WorkOrderStatusBadge.tsx` | Badge de estado de OT |

Para cada componente documentar:
- Props (tipos, valores por defecto)
- Variantes disponibles
- Ejemplos de uso
- Dependencias

### 2.3 Crear `docs/frontend/ui-library.md`

Documentar los 40+ componentes de shadcn/ui en `src/components/ui/`:
- Button, Input, Card, Table, Badge, Dialog, Select, Tabs, etc.
- Referencia a documentacion oficial de shadcn
- Personalizaciones aplicadas via `tailwind.config.ts`

### 2.4 Crear `docs/frontend/state-management.md`

Documentar:
- **AuthContext**: Manejo de autenticacion mock
  - `User`, `UserRole`, `modules[]`
  - Funciones: `login()`, `logout()`, `hasModuleAccess()`
- **React Query**: Configuracion del QueryClient
- **Estado local**: Uso de useState en componentes

### 2.5 Crear `docs/frontend/styling.md`

Documentar:
- Sistema de colores (variables CSS en `index.css`)
- Clases utilitarias personalizadas: `gradient-primary`, `gradient-accent`, `card-hover`, etc.
- Responsive design patterns
- Modo oscuro (configurado via `next-themes`)

---

## Seccion 3: Documentacion de Tipos de Datos

### 3.1 Crear `docs/types/comex-types.md`

Documentar `src/types/comex.ts`:

| Tipo | Descripcion |
|------|-------------|
| `UserRole` | admin, manager, operator, viewer |
| `User` | Usuario con id, email, name, role, modules[] |
| `Product` | Producto/MP con codigo, categoria, precios |
| `Supplier` | Proveedor con datos de contacto |
| `PIM` | Proceso de importacion con estado, items, SLA |
| `PIMStatus` | 13 estados posibles de un PIM |
| `PaymentModality` | carta_credito, anticipo, pago_contado, credito |
| `MonthlyRequirement` | Requerimiento mensual con productos |
| `SLAData` | Metricas de tiempo por etapa |
| `Contract` | Contrato con validaciones |
| `Notification` | Notificacion del sistema |

### 3.2 Crear `docs/types/work-orders-types.md`

Documentar `src/types/workOrders.ts`:

| Tipo | Descripcion |
|------|-------------|
| `WorkOrderStatus` | pendiente, en_progreso, completada, cancelada |
| `WorkOrderPriority` | baja, media, alta, urgente |
| `WorkOrderType` | correctivo, preventivo, mejora |
| `WorkOrder` | Orden de trabajo completa |

---

## Seccion 4: Documentacion del Backend (Supabase)

### 4.1 Crear `docs/backend/database-schema.md`

Documentar las 11 tablas de Supabase:

**Tablas principales:**
| Tabla | Proposito | Columnas clave |
|-------|-----------|----------------|
| `pims` | Procesos de importacion | codigo, estado, proveedor_id, total_usd |
| `productos` | Catalogo de productos | codigo, categoria, precio_usd |
| `proveedores` | Proveedores y fabricas | nombre, pais, tipo_proveedor |
| `requerimientos_mensuales` | Requerimientos por mes | mes, cuadro_id, total_toneladas |
| `requerimiento_items` | Items de requerimiento | producto_id, cantidad_requerida |
| `pim_items` | Items de un PIM | pim_id, cantidad, precio |
| `pim_documentos` | Documentos adjuntos a PIM | tipo, url, pim_id |
| `pim_requirement_items` | Vinculo PIM-Requerimiento | kilos_consumidos |
| `sla_data` | Datos de SLA por PIM | tiempos estimados/reales |
| `cuadros_importacion` | Cuadros de importacion | codigo, nombre |
| `validacion_contrato_pim` | Validaciones de contrato | estado, validado_por |
| `diferencia_contrato` | Diferencias en validacion | campo, coincide |

**Incluir para cada tabla:**
- Esquema completo de columnas
- Relaciones (foreign keys)
- Indices
- Valores por defecto

### 4.2 Crear `docs/backend/rls-policies.md`

**CRITICO - SEGURIDAD**

Documentar politicas RLS actuales:

| Tabla | Politica | Comando | Expresion |
|-------|----------|---------|-----------|
| `pims` | SELECT | `auth.role() = 'authenticated'` o `true` |
| `productos` | SELECT, INSERT, UPDATE | Permisivas |
| `proveedores` | SELECT, INSERT, UPDATE | Permisivas |
| ... | ... | ... |

**Advertencias de seguridad:**
- Varias tablas tienen `USING (true)` - acceso publico
- Tablas sin DELETE permitido
- `diferencia_contrato`, `sla_data`, `pim_requirement_items` sin RLS configurado

### 4.3 Crear `docs/backend/api-integration.md`

Documentar:
- Configuracion del cliente Supabase (`client.ts`)
- Uso de `supabase.from()` para queries
- Patron de fetching con React Query (pendiente de implementar)
- Manejo de errores

### 4.4 Crear `docs/backend/auth-implementation.md`

**Estado actual: Autenticacion Mock**

Documentar:
- El AuthContext actual usa datos mock (no Supabase Auth)
- Pasos para migrar a Supabase Auth real
- Estructura de la tabla `user_roles` (pendiente de crear)
- Flujo de autenticacion recomendado

---

## Seccion 5: Documentacion de Modulos

### 5.1 Crear `docs/modules/comex/README.md`

Contenido:
- Proposito del modulo
- Flujo de trabajo: Requerimiento -> PIM -> Contrato -> Tracking -> Entrega
- Estados del ciclo de vida de un PIM
- Metricas de SLA

**Paginas del modulo:**
| Pagina | Funcionalidad | Estado |
|--------|---------------|--------|
| Dashboard | KPIs, graficos, alertas SLA | Implementado (mock) |
| Requerimientos | CRUD requerimientos mensuales | Implementado (mock) |
| PIMs | Gestion completa de PIMs | Implementado (mock) |
| Productos | Catalogo de productos | Implementado (mock) |
| Proveedores | Gestion de proveedores | Implementado (mock) |
| Contratos | Validacion de contratos | Coming Soon |
| Pagos | Control de pagos | Coming Soon |
| Precios | Historico de precios | Coming Soon |

### 5.2 Crear `docs/modules/work-orders/README.md`

Contenido:
- Proposito del modulo
- Tipos de OT: correctivo, preventivo, mejora
- Estados y prioridades
- Asignacion de tecnicos

**Paginas del modulo:**
| Pagina | Funcionalidad | Estado |
|--------|---------------|--------|
| Dashboard | KPIs, OTs recientes | Implementado (mock) |
| Lista OTs | Tabla con filtros | Implementado (mock) |
| Detalle OT | Vista individual | Implementado (mock) |
| Crear OT | Formulario nuevo | Implementado (mock) |
| Mantenimiento | Programacion | Coming Soon |

---

## Seccion 6: Documentacion de Configuracion

### 6.1 Crear `docs/setup/development.md`

Contenido:
- Prerrequisitos (Node.js 18+, npm/bun)
- Instalacion de dependencias
- Variables de entorno (`.env`)
- Comandos de desarrollo (`npm run dev`)
- Conexion a Supabase

### 6.2 Crear `docs/setup/deployment.md`

Contenido:
- Build de produccion
- Configuracion de Lovable Cloud
- URLs del proyecto (preview, produccion)
- Configuracion de dominio personalizado

---

## Seccion 7: Documentacion de Seguridad

### 7.1 Crear `docs/security/checklist.md`

**Problemas identificados:**

1. **Autenticacion Mock** - No hay autenticacion real
   - Cualquier email/password funciona
   - Roles asignados por patron de email

2. **RLS Permisivo** - Algunas tablas tienen `USING (true)`
   - Acceso publico a datos sensibles
   - Sin restriccion por usuario

3. **Tablas sin RLS**
   - `diferencia_contrato`
   - `sla_data`
   - `pim_requirement_items`
   - `validacion_contrato_pim`

4. **Sin tabla de roles** - Roles en memoria, no persistidos

**Plan de remediacion:**
- Implementar Supabase Auth
- Crear tabla `user_roles` con funcion `has_role()`
- Configurar RLS restrictivo por usuario/rol
- Auditar todas las policies

---

## Seccion 8: Guias de Desarrollo

### 8.1 Crear `docs/guides/adding-new-module.md`

Pasos:
1. Definir tipos en `src/types/`
2. Crear datos mock en `src/data/`
3. Crear Sidebar en `src/components/layout/`
4. Crear Layout con proteccion de rutas
5. Crear paginas en `src/pages/[modulo]/`
6. Agregar rutas en `App.tsx`
7. Agregar modulo en `ModulesPage.tsx`
8. Configurar acceso por rol en `AuthContext`

### 8.2 Crear `docs/guides/adding-supabase-table.md`

Pasos:
1. Crear migracion SQL
2. Configurar RLS policies
3. Actualizar `types.ts` (auto-generado)
4. Crear hooks con React Query
5. Integrar en componentes

### 8.3 Crear `docs/guides/implementing-auth.md`

Pasos para migrar a Supabase Auth:
1. Crear tabla `user_roles`
2. Crear funcion `has_role()`
3. Actualizar AuthContext para usar Supabase Auth
4. Configurar listeners `onAuthStateChange`
5. Crear pagina de registro
6. Configurar Site URL y Redirect URLs

---

## Archivos a Crear

| Archivo | Prioridad |
|---------|-----------|
| `docs/README.md` | Alta |
| `docs/architecture/README.md` | Alta |
| `docs/architecture/module-system.md` | Alta |
| `docs/frontend/routing.md` | Alta |
| `docs/frontend/components.md` | Alta |
| `docs/frontend/ui-library.md` | Media |
| `docs/frontend/state-management.md` | Alta |
| `docs/frontend/styling.md` | Media |
| `docs/types/comex-types.md` | Alta |
| `docs/types/work-orders-types.md` | Alta |
| `docs/backend/database-schema.md` | Alta |
| `docs/backend/rls-policies.md` | Alta |
| `docs/backend/api-integration.md` | Alta |
| `docs/backend/auth-implementation.md` | Alta |
| `docs/modules/comex/README.md` | Media |
| `docs/modules/work-orders/README.md` | Media |
| `docs/setup/development.md` | Alta |
| `docs/setup/deployment.md` | Media |
| `docs/security/checklist.md` | Alta |
| `docs/guides/adding-new-module.md` | Media |
| `docs/guides/adding-supabase-table.md` | Media |
| `docs/guides/implementing-auth.md` | Alta |

---

## Hallazgos Criticos Durante el Analisis

1. **La autenticacion es completamente mock** - No hay conexion real con Supabase Auth

2. **Los datos son mock** - Aunque hay 11 tablas en Supabase, la app usa datos hardcoded en `mockData.ts` y `workOrdersMock.ts`

3. **Varias tablas sin RLS configurado** - Riesgo de seguridad si se conecta a datos reales

4. **Warn en consola** - React Router muestra warnings sobre `forwardRef` que deben corregirse

5. **Modulos "Coming Soon"** - Contratos, Pagos, Precios, Mantenimiento no estan implementados

---

## Orden de Implementacion Recomendado

1. Crear carpeta `docs/` y `docs/README.md` como indice
2. Documentar arquitectura y modulos (entender el sistema)
3. Documentar esquema de base de datos y tipos (fuente de verdad)
4. Documentar seguridad y RLS (critico antes de produccion)
5. Crear guias de desarrollo (onboarding de nuevos desarrolladores)
6. Documentar componentes UI (referencia para desarrollo)

