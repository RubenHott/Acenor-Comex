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
│  ┌────────────────┐  ┌────────────────┐                        │
│  │   Mock Data    │  │Supabase Client │                        │
│  │ (mockData.ts)  │  │  (client.ts)   │                        │
│  └────────────────┘  └────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Database   │  │     Auth     │  │   Storage    │          │
│  │ (PostgreSQL) │  │  (Pendiente) │  │  (Pendiente) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  Tablas: pims, productos, proveedores, requerimientos, etc.    │
└─────────────────────────────────────────────────────────────────┘
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
| **Animaciones** | Framer Motion | 12.27.5 | Animaciones fluidas |
| **Formularios** | React Hook Form | 7.61.1 | Manejo de formularios |
| **Validación** | Zod | 3.25.76 | Schema validation |
| **Fechas** | date-fns | 3.6.0 | Manipulación de fechas |
| **Iconos** | Lucide React | 0.462.0 | Iconografía |

## Estructura de Carpetas

```
src/
├── components/
│   ├── dashboard/          # Componentes del dashboard (StatCard, PIMStatusBadge, etc.)
│   ├── layout/             # Layouts y sidebars (ComexSidebar, WorkOrdersSidebar, Header)
│   ├── ui/                 # Componentes shadcn/ui (40+ componentes)
│   └── workOrders/         # Componentes específicos de OTs
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación (mock)
├── data/
│   ├── mockData.ts         # Datos mock de COMEX
│   └── workOrdersMock.ts   # Datos mock de OTs
├── hooks/
│   ├── use-mobile.tsx      # Hook para detección de móvil
│   └── use-toast.ts        # Hook para notificaciones
├── integrations/
│   └── supabase/
│       ├── client.ts       # Cliente Supabase configurado
│       └── types.ts        # Tipos auto-generados
├── lib/
│   └── utils.ts            # Utilidades (cn, etc.)
├── pages/
│   ├── workOrders/         # Páginas del módulo OTs
│   ├── DashboardPage.tsx   # Dashboard COMEX
│   ├── LoginPage.tsx       # Página de login
│   ├── ModulesPage.tsx     # Selector de módulos
│   └── ...                 # Otras páginas
├── types/
│   ├── comex.ts            # Tipos del módulo COMEX
│   └── workOrders.ts       # Tipos del módulo OTs
├── App.tsx                 # Configuración de rutas
├── index.css               # Variables CSS y estilos globales
└── main.tsx                # Entry point
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

## Próximos Pasos de Arquitectura

1. **Migrar a Supabase Auth real** (ver [Implementar Autenticación](../guides/implementing-auth.md))
2. **Conectar datos reales** de Supabase en lugar de mocks
3. **Implementar RLS robusto** para seguridad por usuario/rol
4. **Agregar Edge Functions** para lógica de negocio compleja
