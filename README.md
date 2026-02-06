# Sistema de Gestión de Planta

Sistema modular para la gestión de operaciones industriales, incluyendo comercio exterior (COMEX) y órdenes de trabajo.

## Descripción

Aplicación web empresarial que funciona como un "lanzador" de módulos para gestionar diferentes áreas operativas de una planta industrial.

## Módulos Disponibles

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| COMEX | ✅ Activo | Gestión de importaciones, PIMs, seguimiento por etapas, tracking DHL y SLA |
| Órdenes de Trabajo | ✅ Activo | Gestión de OTs de mantenimiento |
| Producción | 🚧 Pendiente | Control de producción |
| Mantenimiento | 🚧 Pendiente | Programación de mantenimiento |

## Stack Tecnológico

### Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS** + shadcn/ui
- **React Query** (TanStack Query v5)
- **React Router v6**
- **Framer Motion** para animaciones

### Backend (Supabase)
- **PostgreSQL** - Base de datos (17+ tablas)
- **Edge Functions** (Deno) - Lógica serverless (4 funciones)
- **Funciones SQL** - Cálculos en servidor (9 funciones)
- **Triggers** - Automatización de datos
- **Storage** - Almacenamiento de documentos (bucket `pim-documentos`)

### Integraciones Externas
- **DHL Shipment Tracking API** - Seguimiento de envíos internacionales

## Arquitectura

El sistema utiliza una arquitectura de 3 capas:

1. **Frontend (React)** → Componentes y hooks
2. **Edge Functions (Deno)** → Orquestación de lógica + APIs externas (DHL)
3. **PostgreSQL** → Funciones SQL y datos

## Inicio Rápido

### Requisitos
- Node.js 18+
- npm o bun

### Instalación

```bash
# Clonar repositorio
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Ejecutar ESLint |

## Estructura del Proyecto

```
src/
├── components/       # Componentes React
│   ├── dashboard/    # Componentes del dashboard (StatCard, SLA, etc.)
│   ├── layout/       # Layouts y sidebars (Comex, WorkOrders)
│   ├── maestros/     # Componentes de tablas maestras
│   ├── pim/          # Formularios y editores de PIM
│   ├── requirements/ # Componentes de requerimientos
│   ├── tracking/     # Sistema de seguimiento de PIMs
│   ├── ui/           # shadcn/ui (40+ componentes)
│   └── workOrders/   # Componentes de OTs
├── contexts/         # React Context (Auth)
├── hooks/            # React Query hooks (15+ hooks)
├── integrations/     # Cliente Supabase
├── lib/              # Utilidades (tracking checklists, CSV parser, etc.)
├── pages/            # Páginas/rutas
│   ├── comex/        # Crear, Editar y Seguimiento de PIMs
│   └── workOrders/   # Páginas del módulo OTs
├── types/            # TypeScript interfaces
└── test/             # Tests

supabase/
├── functions/        # Edge Functions (Deno)
│   ├── get-dashboard-stats/
│   ├── get-work-order-stats/
│   ├── create-work-order/
│   └── dhl-tracking/
├── migrations/       # Migraciones SQL
└── config.toml       # Configuración
```

## Funcionalidades Principales

### Módulo COMEX
- **Dashboard** con KPIs en tiempo real (PIMs activos, alertas SLA, toneladas, USD)
- **Requerimientos mensuales** con autocompletado de productos
- **Gestión de PIMs** — Crear, editar, dividir PIMs
- **Seguimiento por etapas** — Contrato → Financiero → Producción → Embarque → Internación → Entrega
- **Checklist por etapa** con items críticos y opcionales
- **Gestión documental** organizada por etapa y categoría (BL, SWIFT, Certificados, etc.)
- **Tracking DHL** integrado para seguimiento de envíos
- **Timeline de actividad** con historial completo
- **Catálogo de productos** y **proveedores**
- **Tablas maestras** (cuadros de importación)

### Módulo Órdenes de Trabajo
- **Dashboard** con estadísticas
- **CRUD completo** de órdenes de trabajo
- Código auto-generado (OT-YYYY-NNN)
- Fecha límite calculada por prioridad

## Documentación

La documentación técnica completa está disponible en la carpeta `/docs`:

- [Índice General](./docs/README.md)
- [Arquitectura General](./docs/architecture/README.md)
- [Edge Functions](./docs/backend/edge-functions.md)
- [Esquema de Base de Datos](./docs/backend/database-schema.md)
- [Hooks de React Query](./docs/frontend/hooks.md)
- [Componentes](./docs/frontend/components.md)
- [Routing](./docs/frontend/routing.md)
- [Guía: Agregar Nuevo Módulo](./docs/guides/adding-new-module.md)

## Despliegue

### Lovable (Recomendado)
1. Abrir el proyecto en Lovable
2. Ir a Share → Publish

### Dominio Personalizado
Configurar en Project > Settings > Domains

## URLs del Proyecto

- **Preview**: https://id-preview--8c8fe5e1-414b-456a-81f6-aee39f6c7312.lovable.app
- **Producción**: https://acenor-comex.lovable.app

## Secretos Requeridos

| Secreto | Descripción |
|---------|-------------|
| `DHL_API_KEY` | API Key del portal DHL Developer (Shipment Tracking - Unified) |

## Licencia

Proyecto privado - Todos los derechos reservados.

---

*Última actualización: Febrero 2026*
