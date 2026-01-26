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
| [Estilos](./frontend/styling.md) | Sistema de diseño y Tailwind CSS |

### Tipos de Datos

| Documento | Descripción |
|-----------|-------------|
| [Tipos COMEX](./types/comex-types.md) | Interfaces del módulo de importaciones |
| [Tipos Órdenes de Trabajo](./types/work-orders-types.md) | Interfaces del módulo de OTs |

### Backend (Supabase)

| Documento | Descripción |
|-----------|-------------|
| [Esquema de Base de Datos](./backend/database-schema.md) | Tablas, columnas y relaciones |
| [Políticas RLS](./backend/rls-policies.md) | Seguridad a nivel de fila |
| [Integración API](./backend/api-integration.md) | Cliente Supabase y queries |
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
| [Agregar Tabla Supabase](./guides/adding-supabase-table.md) | Migraciones y RLS |
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
- **Backend**: Supabase (PostgreSQL)
- **Routing**: React Router v6

## 📦 Módulos Disponibles

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| COMEX | ✅ Activo | Seguimiento de importaciones y PIMs |
| Órdenes de Trabajo | ✅ Activo | Gestión de OTs de mantenimiento |
| Producción | 🚧 Pendiente | Control de producción |
| Mantenimiento | 🚧 Pendiente | Programación de mantenimiento |
| Analytics | 🚧 Pendiente | Reportes y métricas |
| Logística | 🚧 Pendiente | Gestión de almacenes |

## ⚠️ Hallazgos Críticos

> **Importante**: Revisa el [Checklist de Seguridad](./security/checklist.md) antes de desplegar a producción.

1. **Autenticación Mock**: La autenticación actual es simulada
2. **Datos Mock**: La app usa datos hardcoded, no conecta a Supabase
3. **RLS Incompleto**: Algunas tablas no tienen políticas de seguridad

---

*Última actualización: Enero 2025*
