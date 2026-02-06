# Arquitectura del Sistema

## Visión General

El Sistema de Gestión de Planta es una aplicación web modular diseñada para gestionar operaciones industriales. Funciona como un "lanzador" que permite acceder a diferentes módulos según los permisos del usuario.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  LoginPage   │───▶│ ModulesPage  │───▶│   Módulos    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                │                │
│                      ┌─────────────────────────┼───────┐        │
│                      ▼                         ▼       ▼        │
│               ┌───────────┐            ┌───────────┐   ...      │
│               │   COMEX   │            │Work Orders│            │
│               │  Layout   │            │  Layout   │            │
│               └───────────┘            └───────────┘            │
│                      │                         │                 │
│              ┌───────┴───────┐         ┌───────┴───────┐        │
│              ▼               ▼         ▼               ▼        │
│         ┌─────────┐   ┌─────────┐ ┌─────────┐   ┌─────────┐   │
│         │Dashboard│   │  PIMs   │ │Dashboard│   │ Orders  │   │
│         │         │   │Tracking │ │         │   │         │   │
│         └─────────┘   └─────────┘ └─────────┘   └─────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     CAPA DE ESTADO                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  AuthContext   │  │  React Query   │  │  Estado Local  │    │
│  │  (Mock Auth)   │  │  (QueryClient) │  │   (useState)   │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                     CAPA DE DATOS                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               React Query Hooks (15+)                   │    │
│  │  useDashboardStats, usePIMs, usePIMTracking,           │    │
│  │  usePIMCreation, usePIMDocuments, useWorkOrders, etc.  │    │
│  └────────────────────────────────────────────────────────┘    │
│           │                                      │              │
│           ▼                                      ▼              │
│  ┌────────────────┐                    ┌────────────────┐      │
│  │supabase.func   │                    │ supabase.from  │      │
│  │  .invoke()     │                    │   .select()    │      │
│  └────────────────┘                    └────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE FUNCTIONS (Deno)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────┐ │
│  │get-dashboard-    │ │get-work-order-   │ │ create-work-    │ │
│  │    stats         │ │    stats         │ │    order        │ │
│  └────────┬─────────┘ └────────┬─────────┘ └────────┬────────┘ │
│           │                    │                     │          │
│  ┌────────┴───────────────────┬┘                     │          │
│  │                            │                      │          │
│  │  ┌──────────────────┐     │                      │          │
│  │  │  dhl-tracking    │     │                      │          │
│  │  │  (API externa)   │     │                      │          │
│  │  └────────┬─────────┘     │                      │          │
│  │           │               │                      │          │
│  └───────────┴───────────────┴──────────────────────┘          │
│                       supabase.rpc('fn_*')                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    FUNCIONES SQL (9)                      │  │
│  │  fn_pim_stats, fn_sla_global_stats, fn_work_order_stats  │  │
│  │  fn_generate_work_order_code, fn_calculate_due_date      │  │
│  │  fn_pim_status_distribution, fn_pim_monthly_trend        │  │
│  │  fn_requirement_pim_count, fn_get_critical_pim           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      TRIGGERS                             │  │
│  │  trg_sla_auto_alerts → Calcula alertas automáticamente   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    TABLAS (17+)                           │  │
│  │  pims, pim_items, pim_tracking_stages,                   │  │
│  │  pim_checklist_items, pim_activity_log, pim_documentos,  │  │
│  │  pim_requirement_items, productos, proveedores,          │  │
│  │  requerimientos_mensuales, requerimiento_items,           │  │
│  │  cuadros_importacion, sla_data, validacion_contrato_pim, │  │
│  │  diferencia_contrato, work_orders, notificaciones        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │     Auth     │  │   Storage    │  │     RLS      │         │
│  │  (Mock)      │  │ pim-docs ✅  │  │   (Activo)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │────▶│ React Query │────▶│    Edge     │────▶│     SQL     │
│   (React)   │     │    Hook     │     │  Function   │     │  Function   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │ useDashboard      │ invoke()          │ rpc()             │ Cálculo
       │ Stats()           │                   │                   │ en BD
       ▼                   ▼                   ▼                   ▼
    Render             Cache 30s           Orquesta          Retorna datos
       ▲                   ▲                   ▲                   ▲
       │                   │                   │                   │
       └───────────────────┴───────────────────┴───────────────────┘
                              JSON Response
```

## Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| **Framework** | React | 18.3.1 | Biblioteca UI |
| **Build Tool** | Vite | 5.x | Bundler y dev server |
| **Lenguaje** | TypeScript | 5.x | Type safety |
| **Estilos** | Tailwind CSS | 3.x | Utility-first CSS |
| **Componentes** | shadcn/ui | Latest | Componentes accesibles |
| **Routing** | React Router | 6.30.1 | Navegación SPA |
| **Estado Server** | React Query | 5.83.0 | Cache y fetching |
| **Backend** | Supabase | 2.93.1 | BaaS (PostgreSQL) |
| **Edge Functions** | Deno | Latest | Funciones serverless |
| **Animaciones** | Framer Motion | 12.27.5 | Animaciones fluidas |
| **Formularios** | React Hook Form | 7.61.1 | Manejo de formularios |
| **Validación** | Zod | 3.25.76 | Schema validation |
| **Fechas** | date-fns | 3.6.0 | Manipulación de fechas |
| **Iconos** | Lucide React | 0.462.0 | Iconografía |
| **Excel** | xlsx | 0.18.5 | Importar/exportar Excel/CSV |

## Estructura de Carpetas

```
src/
├── components/
│   ├── dashboard/          # StatCard, SLAIndicator, PIMStatusBadge, RecentPIMsTable
│   ├── layout/             # ComexLayout, WorkOrdersLayout, Sidebars, Header
│   ├── maestros/           # TableStructureCard, tableSchemas
│   ├── pim/                # PIMForm, PIMEditItemsTable, PIMItemSelector, AddSupplierDialog, etc.
│   ├── requirements/       # RequirementEntryForm, ProductAutocomplete
│   ├── tracking/           # TrackingStageBar, TrackingChecklist, TrackingTimeline, DHLTrackingPanel, etc.
│   ├── ui/                 # shadcn/ui (40+ componentes)
│   └── workOrders/         # PriorityBadge, WorkOrderStatusBadge
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación (mock)
├── hooks/
│   ├── useDashboardStats.ts  # Stats del dashboard (Edge Function)
│   ├── usePIMs.ts            # Lista de PIMs
│   ├── usePIMCreation.ts     # Crear PIM con items y consumo
│   ├── usePIMItems.ts        # Items de un PIM
│   ├── usePIMDocuments.ts    # Documentos de un PIM
│   ├── usePIMTracking.ts     # Etapas, checklist, timeline, operaciones
│   ├── useWorkOrders.ts      # Órdenes de trabajo
│   ├── useProducts.ts        # Productos
│   ├── useSuppliers.ts       # Proveedores
│   ├── useRequirements.ts    # Requerimientos
│   ├── useCuadros.ts         # Cuadros de importación
│   ├── useNotifications.ts   # Notificaciones
│   └── useSLAData.ts         # Datos SLA
├── integrations/
│   └── supabase/
│       ├── client.ts       # Cliente Supabase
│       └── types.ts        # Tipos auto-generados
├── lib/
│   ├── utils.ts            # Utilidades (cn, etc.)
│   ├── trackingChecklists.ts # Definición de etapas y checklist items
│   ├── cuadrosUnidad.ts    # Mapeo de cuadros y unidades
│   └── parseCsvExcel.ts    # Parser de archivos CSV/Excel
├── pages/
│   ├── comex/
│   │   ├── CreatePIMPage.tsx     # Crear nuevo PIM
│   │   ├── EditPIMPage.tsx       # Editar PIM existente
│   │   └── PIMTrackingPage.tsx   # Seguimiento de PIM por etapas
│   ├── workOrders/
│   │   ├── WorkOrdersDashboardPage.tsx
│   │   ├── WorkOrdersListPage.tsx
│   │   ├── WorkOrderDetailPage.tsx
│   │   └── CreateWorkOrderPage.tsx
│   ├── DashboardPage.tsx   # Dashboard COMEX
│   ├── LoginPage.tsx       # Login
│   ├── ModulesPage.tsx     # Selector de módulos
│   ├── PIMsPage.tsx        # Lista de PIMs
│   ├── ProductsPage.tsx    # Catálogo de productos
│   ├── SuppliersPage.tsx   # Proveedores
│   ├── RequirementsPage.tsx # Requerimientos
│   └── MaestrosPage.tsx    # Tablas maestras
├── types/
│   ├── comex.ts            # Tipos COMEX
│   └── workOrders.ts       # Tipos OTs
├── test/                   # Tests
├── App.tsx                 # Rutas
├── index.css               # Variables CSS
└── main.tsx                # Entry point

supabase/
├── functions/
│   ├── get-dashboard-stats/  # Stats dashboard COMEX
│   ├── get-work-order-stats/ # Stats OTs
│   ├── create-work-order/    # Crear OT
│   └── dhl-tracking/         # Tracking DHL (API externa)
├── migrations/               # Migraciones SQL
└── config.toml               # Configuración
```

## Principios de Diseño

1. **Modularidad**: Cada módulo es independiente con su propio layout, rutas y componentes
2. **Reutilización**: Componentes UI compartidos vía shadcn/ui
3. **Type Safety**: TypeScript en todo el código
4. **Responsive**: Diseño adaptable a diferentes tamaños de pantalla
5. **Accesibilidad**: Componentes accesibles con soporte para teclado y screen readers
6. **Cálculos en Servidor**: Lógica pesada ejecutada en SQL/Edge Functions
7. **Separación de Concerns**: Hooks para datos, componentes para UI, libs para utilidades

## Próximos Pasos

1. **Migrar a Supabase Auth real** (ver [Implementar Autenticación](../guides/implementing-auth.md))
2. **Implementar RLS robusto** para seguridad por usuario/rol
3. **Notificaciones push** en tiempo real

---

*Última actualización: Febrero 2026*
