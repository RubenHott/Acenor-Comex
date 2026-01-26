# Sistema de Gestión de Planta

Sistema modular para la gestión de operaciones industriales, incluyendo comercio exterior (COMEX) y órdenes de trabajo.

## Descripción

Aplicación web empresarial que funciona como un "lanzador" de módulos para gestionar diferentes áreas operativas de una planta industrial.

## Módulos Disponibles

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| COMEX | ✅ Activo | Gestión de importaciones, PIMs y seguimiento de SLA |
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
- **PostgreSQL** - Base de datos
- **Edge Functions** (Deno) - Lógica serverless
- **Funciones SQL** - Cálculos en servidor
- **Triggers** - Automatización de datos

## Arquitectura

El sistema utiliza una arquitectura de 3 capas:

1. **Frontend (React)** → Componentes y hooks
2. **Edge Functions (Deno)** → Orquestación de lógica
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
│   ├── dashboard/    # Componentes del dashboard
│   ├── layout/       # Layouts y sidebars
│   ├── ui/           # shadcn/ui (40+ componentes)
│   └── workOrders/   # Componentes de OTs
├── contexts/         # React Context (Auth)
├── hooks/            # React Query hooks
├── integrations/     # Cliente Supabase
├── pages/            # Páginas/rutas
├── types/            # TypeScript interfaces
└── lib/              # Utilidades

supabase/
├── functions/        # Edge Functions (Deno)
│   ├── get-dashboard-stats/
│   ├── get-work-order-stats/
│   └── create-work-order/
├── migrations/       # Migraciones SQL
└── config.toml       # Configuración
```

## Documentación

La documentación técnica completa está disponible en la carpeta `/docs`:

- [Arquitectura General](./docs/architecture/README.md)
- [Edge Functions](./docs/backend/edge-functions.md)
- [Esquema de Base de Datos](./docs/backend/database-schema.md)
- [Hooks de React Query](./docs/frontend/hooks.md)
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

## Licencia

Proyecto privado - Todos los derechos reservados.

---

*Última actualización: Enero 2026*
