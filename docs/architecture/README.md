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
│                                                │                 │
│                      ┌─────────────────────────┼───────┐        │
│                      ▼                         ▼       ▼        │
│               ┌───────────┐            ┌───────────┐   ...      │
│               │   COMEX   │            │Work Orders│            │
│               │  Layout   │            │  Layout   │            │
│               └───────────┘            └───────────┘            │
│                      │                         │                 │
│              ┌───────┴───────┐         ┌───────┴───────┐        │
│              ▼               ▼         ▼               ▼        │
│         ┌─────────┐   ┌─────────┐ ┌─────────┐   ┌─────────┐    │
│         │Dashboard│   │  PIMs   │ │Dashboard│   │ Orders  │    │
│         └─────────┘   └─────────┘ └─────────┘   └─────────┘    │
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
│  │               React Query Hooks                         │    │
│  │  useDashboardStats, usePIMs, useWorkOrders, etc.       │    │
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
│           └────────────────────┴─────────────────────┘          │
│                                │                                 │
│                       supabase.rpc('fn_*')                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    FUNCIONES SQL                          │  │
│  │  fn_pim_stats, fn_sla_global_stats, fn_work_order_stats  │  │
│  │  fn_generate_work_order_code, fn_calculate_due_date      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      TRIGGERS                             │  │
│  │  trg_sla_auto_alerts → Calcula alertas automáticamente   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                       TABLAS                              │  │
│  │  pims, productos, proveedores, requerimientos, sla_data  │  │
│  │  work_orders, notificaciones, pim_items, etc.            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │   Storage    │  │     RLS      │          │
│  │  (Pendiente) │  │  (Pendiente) │  │   (Activo)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
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

## Estructura de Carpetas

```
src/
├── components/
│   ├── dashboard/          # Componentes del dashboard (StatCard, etc.)
│   ├── layout/             # Layouts y sidebars
│   ├── ui/                 # Componentes shadcn/ui (40+)
│   └── workOrders/         # Componentes de OTs
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación (mock)
├── hooks/
│   ├── useDashboardStats.ts  # Stats del dashboard (Edge Function)
│   ├── usePIMs.ts            # Lista de PIMs
│   ├── useWorkOrders.ts      # Órdenes de trabajo
│   ├── useProducts.ts        # Productos
│   ├── useSuppliers.ts       # Proveedores
│   ├── useRequirements.ts    # Requerimientos
│   ├── useNotifications.ts   # Notificaciones
│   └── useSLAData.ts         # Datos SLA
├── integrations/
│   └── supabase/
│       ├── client.ts       # Cliente Supabase
│       └── types.ts        # Tipos auto-generados
├── lib/
│   └── utils.ts            # Utilidades (cn, etc.)
├── pages/
│   ├── workOrders/         # Páginas módulo OTs
│   ├── DashboardPage.tsx   # Dashboard COMEX
│   ├── LoginPage.tsx       # Login
│   └── ModulesPage.tsx     # Selector de módulos
├── types/
│   ├── comex.ts            # Tipos COMEX
│   └── workOrders.ts       # Tipos OTs
├── App.tsx                 # Rutas
├── index.css               # Variables CSS
└── main.tsx                # Entry point

supabase/
├── functions/
│   ├── get-dashboard-stats/  # Stats dashboard
│   ├── get-work-order-stats/ # Stats OTs
│   └── create-work-order/    # Crear OT
├── migrations/               # Migraciones SQL
└── config.toml               # Configuración
```

## Flujo de Navegación

```
Usuario no autenticado:
  /login ──▶ Introduce credenciales ──▶ Autenticación (mock)

Usuario autenticado:
  / (ModulesPage) ──▶ Selecciona módulo ──▶ /[modulo]/dashboard
                                                    │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                     /comex/*          /work-orders/*
```

## Principios de Diseño

1. **Modularidad**: Cada módulo es independiente con su propio layout, rutas y componentes
2. **Reutilización**: Componentes UI compartidos vía shadcn/ui
3. **Type Safety**: TypeScript en todo el código
4. **Responsive**: Diseño adaptable a diferentes tamaños de pantalla
5. **Accesibilidad**: Componentes accesibles con soporte para teclado y screen readers
6. **Cálculos en Servidor**: Lógica pesada ejecutada en SQL/Edge Functions

## Próximos Pasos

1. **Migrar a Supabase Auth real** (ver [Implementar Autenticación](../guides/implementing-auth.md))
2. **Implementar RLS robusto** para seguridad por usuario/rol
3. **Integrar Supabase Storage** para documentos

---

*Última actualización: Enero 2026*
