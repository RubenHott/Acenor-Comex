# Sistema de Gestión de Planta - Documentación

Documentación exhaustiva del Sistema de Gestión de Planta, una aplicación modular para la gestión de operaciones industriales.

## 📋 Índice de Documentación

### Arquitectura

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura General](./architecture/README.md) | Visión general del sistema, tecnologías y estructura |
| [Sistema de Módulos](./architecture/module-system.md) | Cómo funcionan y se agregan módulos |

### Frontend

| Documento | Descripción |
|-----------|-------------|
| [Enrutamiento](./frontend/routing.md) | Estructura de rutas y navegación |
| [Componentes](./frontend/components.md) | Componentes reutilizables del sistema |
| [Librería UI](./frontend/ui-library.md) | Componentes shadcn/ui disponibles |
| [Estado](./frontend/state-management.md) | Manejo de estado con Context y React Query |
| [Hooks](./frontend/hooks.md) | React Query hooks disponibles |
| [Estilos](./frontend/styling.md) | Sistema de diseño y Tailwind CSS |

### Tipos de Datos

| Documento | Descripción |
|-----------|-------------|
| [Tipos COMEX](./types/comex-types.md) | Interfaces del módulo de importaciones |
| [Tipos Órdenes de Trabajo](./types/work-orders-types.md) | Interfaces del módulo de OTs |

### Backend (Supabase)

| Documento | Descripción |
|-----------|-------------|
| [Esquema de Base de Datos](./backend/database-schema.md) | Tablas, columnas, funciones SQL y triggers |
| [Edge Functions](./backend/edge-functions.md) | Funciones serverless en Deno |
| [Políticas RLS](./backend/rls-policies.md) | Seguridad a nivel de fila |
| [Integración API](./backend/api-integration.md) | Cliente Supabase, Edge Functions y RPC |
| [Autenticación](./backend/auth-implementation.md) | Estado actual y plan de migración |

### Módulos

| Documento | Descripción |
|-----------|-------------|
| [COMEX](./modules/comex/README.md) | Módulo de comercio exterior |
| [Órdenes de Trabajo](./modules/work-orders/README.md) | Módulo de gestión de OTs |

### Configuración

| Documento | Descripción |
|-----------|-------------|
| [Desarrollo](./setup/development.md) | Configuración del entorno local |
| [Despliegue](./setup/deployment.md) | Build y publicación |

### Seguridad

| Documento | Descripción |
|-----------|-------------|
| [Checklist de Seguridad](./security/checklist.md) | Problemas identificados y remediación |

### Guías de Desarrollo

| Documento | Descripción |
|-----------|-------------|
| [Agregar Nuevo Módulo](./guides/adding-new-module.md) | Pasos para crear un módulo |
| [Agregar Tabla Supabase](./guides/adding-supabase-table.md) | Migraciones, funciones SQL y Edge Functions |
| [Implementar Autenticación](./guides/implementing-auth.md) | Migración a Supabase Auth |

---

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🏗️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: React Query + Context API
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Edge Functions**: Deno (TypeScript serverless)
- **Routing**: React Router v6
- **Integraciones**: DHL Shipment Tracking API

## 📦 Módulos Disponibles

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| COMEX | ✅ Activo | Seguimiento de importaciones, PIMs, tracking DHL |
| Órdenes de Trabajo | ✅ Activo | Gestión de OTs de mantenimiento |
| Producción | 🚧 Pendiente | Control de producción |
| Mantenimiento | 🚧 Pendiente | Programación de mantenimiento |
| Analytics | 🚧 Pendiente | Reportes y métricas |
| Logística | 🚧 Pendiente | Gestión de almacenes |

## ⚠️ Estado del Sistema

### ✅ Implementado

- **Base de datos Supabase**: 17+ tablas con datos reales
- **Funciones SQL**: 9 funciones para cálculos en servidor
- **Edge Functions**: 4 funciones (dashboard stats, work orders, DHL tracking)
- **Trigger SLA**: Cálculo automático de alertas
- **Sistema de seguimiento por etapas**: Checklist, timeline, documentos
- **Integración DHL**: Tracking de envíos en tiempo real
- **Gestión documental**: Organizado por etapa y categoría con versionamiento
- **Storage**: Bucket `pim-documentos` para archivos

### 🚧 Pendiente

1. **Autenticación Real**: La autenticación actual es mock (simulada)
2. **RLS Robusto**: Políticas permisivas para desarrollo, ajustar para producción
3. **Notificaciones push**: Sistema de alertas en tiempo real

> **Importante**: Revisa el [Checklist de Seguridad](./security/checklist.md) antes de desplegar a producción.

---

*Última actualización: Febrero 2026*
