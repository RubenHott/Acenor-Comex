# Acenor COMEX — Sistema de Gestion de Importaciones

Sistema integral para la gestion de operaciones de comercio exterior (COMEX) de Acenor. Permite el seguimiento completo del ciclo de importacion desde la revision de contrato hasta la recepcion y costeo, con visibilidad por departamento, validaciones por etapa (gate validation), gestion documental estructurada, notificaciones en tiempo real y seguimiento DHL automatizado.

---

## Indice

- [Stack Tecnologico](#stack-tecnologico)
- [Inicio Rapido](#inicio-rapido)
- [Arquitectura General](#arquitectura-general)
- [Modulos Disponibles](#modulos-disponibles)
- [Flujo de Trabajo PIM — 6 Etapas](#flujo-de-trabajo-pim--6-etapas)
- [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
- [Visibilidad por Departamento](#visibilidad-por-departamento)
- [Gate Validation (Validacion de Compuerta)](#gate-validation-validacion-de-compuerta)
- [Documentos Requeridos por Etapa](#documentos-requeridos-por-etapa)
- [No Conformidades (NCs)](#no-conformidades-ncs)
- [Cuenta Bancaria — Flujo Condicional](#cuenta-bancaria--flujo-condicional)
- [Catalogo de Bancos para Carta de Credito](#catalogo-de-bancos-para-carta-de-credito)
- [Seguimiento DHL](#seguimiento-dhl)
- [Notificaciones (In-App + Email)](#notificaciones-in-app--email)
- [Base de Datos (Supabase)](#base-de-datos-supabase)
- [Edge Functions](#edge-functions)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Hooks Personalizados](#hooks-personalizados)
- [Componentes Principales](#componentes-principales)
- [Tipos de Datos](#tipos-de-datos)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| **Frontend** | React 18 + TypeScript + Vite 5 |
| **Estilos** | Tailwind CSS 3 + shadcn/ui (48 componentes Radix) |
| **Estado** | TanStack React Query v5 + Context API |
| **Routing** | React Router v6 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Edge Functions** | Deno (TypeScript serverless) |
| **Formularios** | React Hook Form + Zod (validacion) |
| **Graficos** | Recharts |
| **Animaciones** | Framer Motion |
| **Email** | Resend API (via Edge Functions) |
| **Integraciones** | DHL Shipment Tracking API |
| **Testing** | Vitest + Testing Library |
| **Excel** | SheetJS (xlsx) |

---

## Inicio Rapido

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd Acenor-Comex-main

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env con las variables necesarias (ver seccion Variables de Entorno)

# 4. Iniciar servidor de desarrollo
npm run dev
# La app estara disponible en http://localhost:8080

# 5. Build de produccion
npm run build
```

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  React 18 + TypeScript + Vite + Tailwind/shadcn     │
│                                                     │
│  ┌──────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  Pages   │  │ Components │  │   Contexts      │  │
│  │ (Router) │  │ (UI + Biz) │  │  (Auth, Theme)  │  │
│  └────┬─────┘  └─────┬──────┘  └───────┬────────┘  │
│       │              │                  │            │
│  ┌────┴──────────────┴──────────────────┴────────┐  │
│  │            React Query Hooks                   │  │
│  │  usePIMTracking, useNotifications, etc.        │  │
│  └────────────────────┬──────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                  SUPABASE BACKEND                      │
│                                                        │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │PostgreSQL│  │  Auth   │  │ Storage  │  │Realtime│  │
│  │ (20+ tbl)│  │(JWT/RLS)│  │(pim-docs)│  │(notif) │  │
│  └──────────┘  └─────────┘  └──────────┘  └────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Edge Functions (Deno)                │  │
│  │  dhl-tracking | dhl-daily-check | dashboard-stats│  │
│  │  create-work-order | get-work-order-stats        │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## Modulos Disponibles

| Modulo | Estado | Ruta Base | Descripcion |
|--------|--------|-----------|-------------|
| **COMEX** | Activo | `/comex` | Gestion completa de importaciones: PIMs, seguimiento por etapas, tracking DHL, NCs |
| **Ordenes de Trabajo** | Activo | `/work-orders` | Gestion de OTs de mantenimiento industrial |
| **Produccion** | Pendiente | — | Control de produccion |
| **Mantenimiento** | Pendiente | — | Programacion de mantenimiento preventivo/correctivo |
| **Analytics** | Pendiente | — | Reportes, metricas y KPIs |
| **Logistica** | Pendiente | — | Gestion de almacenes e inventario |

---

## Flujo de Trabajo PIM — 6 Etapas

El sistema gestiona el ciclo completo de una importacion a traves de 6 etapas secuenciales. Cada etapa ES el proceso (sin subprocesos). Cada etapa tiene: checklist con items asignados por departamento, documentos requeridos con recuadros definidos, responsable asignado, y gate validation para avanzar.

### Etapa 1: Revision de Contrato

| Propiedad | Valor |
|-----------|-------|
| **Key** | `revision_contrato` |
| **Departamentos** | COMEX |
| **SLA** | 5 dias |
| **Docs requeridos** | Contrato, Cierre de Compra |

- Revision y comparacion del contrato recibido vs cierre de compra
- Validacion de datos del proveedor, precios, cantidades, Incoterms, condiciones de pago
- **Verificacion de cuenta bancaria** (obligatoria si nuevo proveedor)
- Badge de tipo de compra (read-only, definido al crear el PIM)

### Etapa 2: Firma de Contrato

| Propiedad | Valor |
|-----------|-------|
| **Key** | `firma_contrato` |
| **Departamentos** | COMEX + Gerencia |
| **SLA** | 3 dias |
| **Docs requeridos** | Contrato firmado |

- COMEX envia contrato a Gerencia para firma
- Gerencia firma y devuelve
- COMEX envia contrato firmado al proveedor
- Confirmacion de recepcion del proveedor

### Etapa 3: Gestion Financiera

| Propiedad | Valor |
|-----------|-------|
| **Key** | `gestion_financiera` |
| **Departamentos** | Finanzas + Gerencia |
| **SLA** | 10 dias |
| **Docs requeridos** | SWIFT (si LC), Comprobante de pago (si contado/anticipo) |

- Checklist condicional segun modalidad de pago:
  - **Carta de Credito**: Preparacion L/C, firmas bancarias, emision SWIFT, cotizaciones bancarias
  - **Pago Contado**: Solicitud de pago, autorizacion gerencia, ejecucion
  - **Anticipo**: Calculo porcentaje, solicitud, autorizacion gerencia, envio comprobante
- **Panel de cotizaciones bancarias** (solo para Carta de Credito): registro de banco, tasa, monto, seleccion de ganador

### Etapa 4: Documentacion y Embarque

| Propiedad | Valor |
|-----------|-------|
| **Key** | `documentacion_embarque` |
| **Departamentos** | COMEX |
| **SLA** | 30 dias |
| **Docs requeridos** | Factura, B/L, Packing List, Certificado Calidad, Certificado Origen |

- Seguimiento DHL integrado con consulta automatica diaria
- Consolidacion de documentos de embarque
- Al llegar documentacion: notificacion automatica a TODAS las areas

### Etapa 5: Internacion y Aduana

| Propiedad | Valor |
|-----------|-------|
| **Key** | `internacion_aduana` |
| **Departamentos** | COMEX + Finanzas |
| **SLA** | 10 dias |
| **Docs requeridos** | Comprobante de pago, DUS |

- COMEX: Entrega docs al banco, solicita retiro a agente aduanero, solicita pago a Finanzas
- Finanzas: Ejecuta pago de internacion, retira documentos del banco
- Gerencia: Valida alzamiento
- COMEX: Confirma liberacion de carga

### Etapa 6: Recepcion y Costeo

| Propiedad | Valor |
|-----------|-------|
| **Key** | `recepcion_costeo` |
| **Departamentos** | COMEX + Finanzas + Gerencia |
| **SLA** | 7 dias |
| **Docs requeridos** | Costeo, Acta de recepcion |

- COMEX: Recepcion en bodega, ingreso al ERP
- Finanzas: Costeo de productos, validacion de cantidades y valores
- Gerencia: Aprobacion final del costeo
- **PIM CERRADO** al completar esta etapa

---

## Sistema de Roles y Permisos

### Roles Disponibles

| Rol | Departamento | Descripcion |
|-----|-------------|-------------|
| `admin` | Sistemas | Acceso total a todas las funciones |
| `manager` | Gerencia | Acceso total excepto eliminar PIMs |
| `gerente` | Gerencia | Firma contratos, autoriza pagos, valida cuentas bancarias |
| `jefe_comex` | COMEX | Gestiona importaciones, asigna responsables, crea NCs |
| `analista_comex` | COMEX | Ejecuta tareas de COMEX: checklist, documentos, notas |
| `jefe_finanzas` | Finanzas | Gestiona pagos, L/C, costeo |
| `analista_finanzas` | Finanzas | Ejecuta tareas financieras |
| `viewer` | Cualquiera | Solo lectura |

### Acciones por Rol

| Accion | Admin/Manager | Gerente | Jefe | Analista | Viewer |
|--------|:---:|:---:|:---:|:---:|:---:|
| Ver PIM | Si | Si | Si | Si | Si |
| Toggle checklist | Si | Si | Si | Si | — |
| Subir documentos | Si | Si | Si | Si | — |
| Eliminar documentos | Si | Si | Si | — | — |
| Agregar notas | Si | Si | Si | Si | — |
| Avanzar etapa | Si | Si | Si | — | — |
| Retroceder etapa | Si | Si | Si | — | — |
| Dividir PIM | Si | Si | Si | — | — |
| Crear NC | Si | Si | Si | — | — |
| Resolver NC | Si | Si | Si | — | — |
| Asignar responsable | Si | Si | Si | — | — |
| Validar cuenta bancaria | Si | Si | — | — | — |
| Enviar email | Si | Si | Si | Si | — |
| Eliminar PIM | Si | — | — | — | — |

---

## Visibilidad por Departamento

Cada item de checklist tiene un campo `department` que indica que departamento es responsable de completarlo. Esto determina la experiencia del usuario:

### Usuario participa en la etapa

Si el departamento del usuario esta incluido en `stageDef.departments` (o si el rol es admin/manager/gerente):

- **Checklist**: Solo ve y puede marcar items de su departamento
- **Seccion colapsable**: "Progreso de otras areas" con indicadores del resto de departamentos
- **Documentos**: Puede subir sus documentos + ver los de otros (read-only)
- **NCs**: Puede crear y ver NCs de la etapa

### Usuario NO participa en la etapa

Si el departamento del usuario NO esta en `stageDef.departments`:

- Ve un **StageReadOnlyCard** compacto con:
  - Nombre de la etapa + estado (pendiente/en_progreso/completado)
  - Departamento responsable + responsable asignado
  - Fechas inicio/fin
  - Indicadores: X docs subidos, X NCs abiertas, X% checklist
  - Sin acciones interactivas

### Indicadores en la barra de etapas

- Etapas donde el usuario participa: icono normal con opacidad completa
- Etapas donde NO participa: `opacity-60` con label "Solo lectura" en italica

---

## Gate Validation (Validacion de Compuerta)

Para avanzar de una etapa a la siguiente, el sistema valida 5 condiciones (blockers):

| # | Tipo | Descripcion | Aplica en |
|---|------|-------------|-----------|
| 1 | `checklist` | Todos los items criticos del checklist deben estar completados | Todas las etapas |
| 2 | `document` | Todos los documentos requeridos deben estar subidos | Todas las etapas |
| 3 | `nc` | No debe haber NCs abiertas o en revision (si `ncBlocks = true`) | Todas las etapas |
| 4 | `bank_account` | Proveedor nuevo debe tener cuenta bancaria validada por Gerencia | `revision_contrato` |
| 5 | `lc_bank` | Debe haber un banco seleccionado con cotizacion (si modalidad = carta_credito) | `gestion_financiera` |

El componente **StageGateSummary** muestra visualmente los blockers activos con mensajes descriptivos.

---

## Documentos Requeridos por Etapa

Cada etapa define documentos requeridos con recuadros individuales (`RequiredDocumentsPanel`):

| Tipo de Documento | Clave | Etapas |
|-------------------|-------|--------|
| Contrato | `contrato` | Revision Contrato |
| Cierre de Compra | `cierre_compra` | Revision Contrato |
| Contrato Firmado | `contrato` | Firma Contrato |
| SWIFT | `swift` | Gestion Financiera (LC) |
| Comprobante de Pago | `comprobante_pago` | Gestion Financiera (contado/anticipo) |
| Factura | `factura` | Documentacion Embarque |
| B/L (Bill of Lading) | `bl` | Documentacion Embarque |
| Packing List | `packing_list` | Documentacion Embarque |
| Certificado Calidad | `certificado_calidad` | Documentacion Embarque |
| Certificado Origen | `certificado_origen` | Documentacion Embarque |
| DUS | `dus` | Internacion Aduana |
| Costeo | `costeo` | Recepcion Costeo |
| Acta de Recepcion | `acta_recepcion` | Recepcion Costeo |

Cada recuadro muestra: nombre del documento, estado (subido/pendiente), archivo con fecha y autor, botones de subir/ver/descargar/eliminar. Seccion adicional "Otros documentos" para archivos no definidos.

---

## No Conformidades (NCs)

Sistema de gestion de no conformidades que permite documentar y resolver problemas durante el proceso:

- **Crear NC**: Titulo, descripcion, prioridad (baja/media/alta/critica), departamento asignado, evidencia fotografica
- **Estados**: `abierta` → `en_revision` → `cerrada` (o `reabierta`)
- **Bloqueo**: Si `ncBlocks = true` para la etapa actual, no se puede avanzar con NCs abiertas
- **Notificaciones**: Al crear NC se notifica via email e in-app al departamento asignado

---

## Cuenta Bancaria — Flujo Condicional

En la etapa de **Revision de Contrato**, la verificacion de cuenta bancaria depende del tipo de proveedor:

### Proveedor existente (con cuentas validadas)
- Badge verde "Cuenta verificada" con resumen
- Boton "Ver detalle" colapsable
- NO es blocker para avanzar

### Proveedor nuevo (sin cuentas validadas)
1. **COMEX** crea la cuenta bancaria (formulario con datos del banco)
2. Cuenta queda en estado "Pendiente autorizacion Gerencia"
3. **Gerencia** revisa y autoriza/valida la cuenta
4. **Es BLOCKER** para avanzar etapa hasta que la cuenta este validada

---

## Catalogo de Bancos para Carta de Credito

Cuando la modalidad de pago es **Carta de Credito**, la Etapa 3 (Gestion Financiera) incluye un panel de cotizaciones bancarias:

### Tablas involucradas

- **`bancos_carta_credito`**: Catalogo de bancos (nombre, pais, SWIFT code)
- **`cotizaciones_lc`**: Cotizaciones por PIM (banco, tasa, monto USD, archivo PDF, seleccionado)

### Flujo
1. Finanzas agrega cotizaciones de diferentes bancos (tasa ofrecida, monto, PDF de cotizacion)
2. Se puede crear un nuevo banco si no existe en el catalogo
3. Se selecciona el banco ganador (tasa mas conveniente)
4. El sistema genera historial de cotizaciones por PIM
5. **Es BLOCKER**: No se puede avanzar de etapa sin banco seleccionado

---

## Seguimiento DHL

### Tracking en tiempo real
- Panel `DHLTrackingPanel` en la Etapa 4 (Documentacion y Embarque)
- Consulta la API de DHL Shipment Tracking
- Muestra eventos del envio con timeline visual

### Consulta diaria automatica
- **Edge Function `dhl-daily-check`**: Se ejecuta 1 vez al dia (cron)
- Busca PIMs en estado `en_proceso` con tracking code
- Para cada PIM: consulta DHL API, actualiza estado, registra en activity log
- **Al detectar llegada**: Crea notificacion in-app para TODOS los usuarios activos + envia email a todas las areas

---

## Notificaciones (In-App + Email)

### Notificaciones In-App

- **Campana en Header** con badge de conteo de no leidas
- **Dropdown** con lista de notificaciones recientes (hasta 8)
- **Click** en notificacion: navega al PIM correspondiente + marca como leida
- **Realtime**: Suscripcion a Supabase Realtime (postgres_changes INSERT)
- **Polling**: Contador de no leidas se actualiza cada 30 segundos

### Tipos de notificacion

| Tipo | Icono | Trigger |
|------|-------|---------|
| `stage_advance` | Reciclar | Al avanzar una etapa |
| `responsable_change` | Persona | Al asignar nuevo responsable |
| `nc_created` | Advertencia | Al crear una NC |
| `dhl_arrived` | Paquete | Al llegar documentacion DHL |
| `nc_resolved` | Check | Al resolver una NC |

### Emails automaticos

| Evento | Destinatarios | Template |
|--------|--------------|----------|
| Avance de etapa | Departamento de la siguiente etapa | `buildStageAdvanceEmail()` |
| Creacion de NC | Departamento asignado a la NC | `buildNCCreatedEmail()` |
| Recepcion SWIFT | Equipo COMEX | `buildSwiftReceivedEmail()` |
| Iteracion de NC | Involucrados en la NC | `buildNCIterationEmail()` |
| Llegada documentacion DHL | Todas las areas | `buildDocumentacionArrivedEmail()` |

---

## Base de Datos (Supabase)

### Tablas principales

| Tabla | Descripcion |
|-------|-------------|
| `pims` | Importaciones (PIMs): codigo, estado, proveedor, modalidad pago, montos, tracking DHL |
| `pim_items` | Items/productos de cada PIM con cantidades, precios, parcialidades |
| `pim_tracking_stages` | Etapas de seguimiento por PIM: estado, responsable, fechas, checklist |
| `pim_documents` | Documentos subidos organizados por etapa y tipo |
| `pim_activity_log` | Bitacora de actividad: notas, cambios, acciones del sistema |
| `no_conformidades` | No conformidades: estado, prioridad, departamento, evidencia |
| `notificaciones` | Notificaciones in-app: tipo, titulo, mensaje, leido, destinatario |
| `bancos_carta_credito` | Catalogo de bancos para Carta de Credito |
| `cotizaciones_lc` | Cotizaciones bancarias por PIM (tasa, monto, archivo) |
| `cuentas_bancarias` | Cuentas bancarias de proveedores con estado de validacion |
| `user_profiles` | Perfiles de usuario: nombre, email, rol, departamento, activo |
| `products` | Catalogo de productos con codigos, categorias, precios |
| `suppliers` | Proveedores con datos de contacto y pais |
| `requirements` | Requerimientos mensuales de importacion |
| `requirement_items` | Items de requerimiento con cantidades y precios |
| `cuadros` | Cuadros/lineas de produccion |
| `fabricas_molinos` | Fabricas y molinos de proveedores |
| `work_orders` | Ordenes de trabajo de mantenimiento |

### Bucket de Storage

- **`pim-documentos`**: Almacena todos los documentos subidos (contratos, facturas, B/L, etc.)
- Organizado por: `{pim_id}/{stage_key}/{filename}`

---

## Edge Functions

| Funcion | Ruta | Descripcion |
|---------|------|-------------|
| `dhl-tracking` | `/functions/v1/dhl-tracking` | Consulta tracking DHL por numero, actualiza PIM |
| `dhl-daily-check` | `/functions/v1/dhl-daily-check` | Cron diario: verifica PIMs con tracking, notifica llegadas |
| `get-dashboard-stats` | `/functions/v1/get-dashboard-stats` | Estadisticas del dashboard COMEX |
| `create-work-order` | `/functions/v1/create-work-order` | Crear orden de trabajo |
| `get-work-order-stats` | `/functions/v1/get-work-order-stats` | Estadisticas de ordenes de trabajo |

---

## Estructura del Proyecto

```
Acenor-Comex-main/
├── public/                          # Assets estaticos
├── src/
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Enrutamiento principal
│   ├── index.css                    # Estilos globales (Tailwind)
│   │
│   ├── components/
│   │   ├── layout/                  # Layout principal
│   │   │   ├── ComexLayout.tsx      # Layout modulo COMEX (sidebar + header)
│   │   │   ├── ComexSidebar.tsx     # Sidebar navegacion COMEX
│   │   │   ├── Header.tsx           # Header con notificaciones (campana)
│   │   │   ├── WorkOrdersLayout.tsx # Layout modulo OTs
│   │   │   └── WorkOrdersSidebar.tsx
│   │   │
│   │   ├── tracking/                # Componentes de seguimiento PIM
│   │   │   ├── TrackingStageBar.tsx        # Barra de etapas (navegacion)
│   │   │   ├── TrackingChecklist.tsx       # Checklist con filtro por departamento
│   │   │   ├── TrackingTimeline.tsx        # Timeline de actividad
│   │   │   ├── TrackingProgressMini.tsx    # Progreso mini (sidebar)
│   │   │   ├── TrackingNoteDialog.tsx      # Dialog para agregar notas
│   │   │   ├── StageGateSummary.tsx        # Resumen de blockers
│   │   │   ├── StageReadOnlyCard.tsx       # Card solo lectura (otro departamento)
│   │   │   ├── StageResponsableCard.tsx    # Card asignar responsable
│   │   │   ├── RequiredDocumentsPanel.tsx  # Documentos con recuadros definidos
│   │   │   ├── DocumentUploadPanel.tsx     # Upload generico de documentos
│   │   │   ├── NonConformityPanel.tsx      # Panel de NCs
│   │   │   ├── NonConformityCreateDialog.tsx # Dialog crear NC
│   │   │   ├── BankAccountPanel.tsx        # Panel cuenta bancaria (condicional)
│   │   │   ├── LCBankQuotesPanel.tsx       # Cotizaciones bancarias LC
│   │   │   ├── DHLTrackingPanel.tsx        # Panel seguimiento DHL
│   │   │   └── SplitPIMDialog.tsx          # Dialog dividir PIM
│   │   │
│   │   ├── pim/                     # Componentes de creacion/edicion PIM
│   │   │   ├── PIMForm.tsx
│   │   │   ├── PIMItemSelector.tsx
│   │   │   ├── PIMEditItemsTable.tsx
│   │   │   ├── PIMDetailItems.tsx
│   │   │   ├── PIMDetailContract.tsx
│   │   │   ├── PIMContractConditions.tsx
│   │   │   ├── PIMExtraProductSelector.tsx
│   │   │   ├── AddFromRequirementDialog.tsx
│   │   │   ├── AddSupplierDialog.tsx
│   │   │   └── AddFabricaMolinoDialog.tsx
│   │   │
│   │   ├── dashboard/               # Componentes del dashboard
│   │   │   ├── StatCard.tsx
│   │   │   ├── RecentPIMsTable.tsx
│   │   │   ├── PIMStatusBadge.tsx
│   │   │   └── SLAIndicator.tsx
│   │   │
│   │   ├── users/                   # Gestion de usuarios
│   │   │   ├── CreateUserDialog.tsx
│   │   │   ├── EditUserDialog.tsx
│   │   │   ├── ResetPasswordDialog.tsx
│   │   │   └── UserRoleBadge.tsx
│   │   │
│   │   ├── requirements/            # Requerimientos de importacion
│   │   │   ├── RequirementEntryForm.tsx
│   │   │   └── ProductAutocomplete.tsx
│   │   │
│   │   ├── maestros/                # Datos maestros
│   │   │   ├── TableStructureCard.tsx
│   │   │   └── tableSchemas.ts
│   │   │
│   │   ├── workOrders/              # Ordenes de trabajo
│   │   │   ├── PriorityBadge.tsx
│   │   │   └── WorkOrderStatusBadge.tsx
│   │   │
│   │   └── ui/                      # shadcn/ui (48 componentes)
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── toast.tsx
│   │       └── ... (35 mas)
│   │
│   ├── pages/
│   │   ├── Index.tsx                # Pagina principal (redirect)
│   │   ├── LoginPage.tsx            # Login
│   │   ├── RegisterPage.tsx         # Registro
│   │   ├── ModulesPage.tsx          # Seleccion de modulos
│   │   ├── DashboardPage.tsx        # Dashboard COMEX
│   │   ├── PIMsPage.tsx             # Lista de PIMs
│   │   ├── ProductsPage.tsx         # Catalogo de productos
│   │   ├── SuppliersPage.tsx        # Catalogo de proveedores
│   │   ├── RequirementsPage.tsx     # Requerimientos mensuales
│   │   ├── MaestrosPage.tsx         # Datos maestros
│   │   ├── UsersPage.tsx            # Gestion de usuarios
│   │   ├── ComingSoonPage.tsx       # Placeholder para modulos pendientes
│   │   ├── NotFound.tsx             # 404
│   │   │
│   │   ├── comex/
│   │   │   ├── CreatePIMPage.tsx    # Crear nuevo PIM
│   │   │   ├── EditPIMPage.tsx      # Editar PIM existente
│   │   │   └── PIMTrackingPage.tsx  # Seguimiento de PIM (pagina principal de tracking)
│   │   │
│   │   └── workOrders/
│   │       ├── WorkOrdersDashboardPage.tsx
│   │       ├── WorkOrdersListPage.tsx
│   │       ├── WorkOrderDetailPage.tsx
│   │       └── CreateWorkOrderPage.tsx
│   │
│   ├── hooks/                       # React Query hooks
│   │   ├── usePIMTracking.ts        # Tracking: stages, checklist, gate validation, advance
│   │   ├── usePIMs.ts              # CRUD de PIMs
│   │   ├── usePIMCreation.ts       # Creacion de PIM con items
│   │   ├── usePIMItems.ts          # Items de PIM
│   │   ├── usePIMDocuments.ts      # Documentos de PIM (storage)
│   │   ├── useNotifications.ts     # Notificaciones in-app + realtime
│   │   ├── useNoConformidades.ts   # NCs: crear, resolver, reabrir
│   │   ├── useBancosLC.ts          # Bancos y cotizaciones LC
│   │   ├── useCuentasBancarias.ts  # Cuentas bancarias de proveedores
│   │   ├── usePermissions.ts       # Permisos por rol/departamento
│   │   ├── useEmailNotification.ts # Envio de emails via Edge Function
│   │   ├── useProducts.ts          # CRUD productos
│   │   ├── useSuppliers.ts         # CRUD proveedores
│   │   ├── useRequirements.ts      # CRUD requerimientos
│   │   ├── useDashboardStats.ts    # Stats del dashboard
│   │   ├── useSLAData.ts           # Datos SLA
│   │   ├── useCuadros.ts           # Cuadros/lineas de produccion
│   │   ├── useMolinos.ts           # Fabricas y molinos
│   │   ├── useUserProfiles.ts      # Perfiles de usuario
│   │   ├── useWorkOrders.ts        # CRUD ordenes de trabajo
│   │   ├── use-mobile.tsx          # Deteccion de pantalla movil
│   │   └── use-toast.ts            # Hook para toasts (sonner)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx          # Autenticacion (Supabase Auth + user_profiles)
│   │
│   ├── lib/
│   │   ├── trackingChecklists.ts   # Definiciones de etapas, checklists, departamentos
│   │   ├── permissions.ts          # Roles, acciones, permisos
│   │   ├── emailTriggers.ts        # Templates de email HTML
│   │   ├── userConstants.ts        # Constantes de usuario
│   │   ├── cuadrosUnidad.ts        # Mapeo cuadros-unidades
│   │   ├── parseCsvExcel.ts        # Parser CSV/Excel
│   │   └── utils.ts                # Utilidades (cn, etc.)
│   │
│   ├── types/
│   │   ├── comex.ts                # Tipos COMEX (PIM, Product, Supplier, etc.)
│   │   └── workOrders.ts           # Tipos Ordenes de Trabajo
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts           # Cliente Supabase configurado
│   │       └── types.ts            # Tipos generados de Supabase
│   │
│   └── test/                       # Tests
│
├── supabase/
│   ├── config.toml                 # Configuracion local Supabase
│   ├── migrations/                 # 12 migraciones SQL
│   │   ├── 20260126*.sql          # Migraciones iniciales
│   │   ├── 20260204*.sql          # Tablas adicionales
│   │   ├── 20260205*.sql          # Funciones y triggers
│   │   ├── 20260206*.sql          # Politicas RLS
│   │   └── 20260209*.sql          # Fabricas y molinos
│   └── functions/
│       ├── dhl-tracking/index.ts   # Tracking DHL manual
│       ├── dhl-daily-check/        # Cron diario DHL (deployed)
│       ├── get-dashboard-stats/index.ts
│       ├── create-work-order/index.ts
│       └── get-work-order-stats/index.ts
│
├── package.json
├── vite.config.ts                  # Vite (puerto 8080, alias @)
├── tailwind.config.ts              # Tailwind CSS
├── tsconfig.json
├── tsconfig.app.json
├── postcss.config.js
├── eslint.config.js
└── components.json                 # Configuracion shadcn/ui
```

---

## Hooks Personalizados

### Tracking y Seguimiento

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `useInitializeTracking` | `usePIMTracking.ts` | Crea 6 etapas + checklist filtrado por modalidad de pago |
| `useCanAdvanceStage` | `usePIMTracking.ts` | Valida gate conditions (5 blockers) |
| `useAdvanceStage` | `usePIMTracking.ts` | Avanza etapa + notifica siguiente departamento |
| `useReturnStage` | `usePIMTracking.ts` | Retrocede etapa (para resolver NCs) |
| `useToggleChecklistItem` | `usePIMTracking.ts` | Marca/desmarca items del checklist |
| `useSplitPIM` | `usePIMTracking.ts` | Divide PIM en sub-PIMs |
| `useAssignStageResponsable` | `usePIMTracking.ts` | Asigna responsable a etapa |

### Notificaciones

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `useNotifications` | `useNotifications.ts` | Lista notificaciones del usuario (ultimas 20) |
| `useUnreadNotificationsCount` | `useNotifications.ts` | Conteo no leidas (polling 30s) |
| `useMarkNotificationRead` | `useNotifications.ts` | Marcar notificacion individual como leida |
| `useMarkAllNotificationsRead` | `useNotifications.ts` | Marcar todas como leidas |
| `useCreateNotificacion` | `useNotifications.ts` | Crear notificacion para un usuario |
| `useNotifyDepartment` | `useNotifications.ts` | Notificar a todo un departamento |
| `useNotificacionesRealtime` | `useNotifications.ts` | Suscripcion realtime a nuevas notificaciones |

### No Conformidades

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `useNoConformidades` | `useNoConformidades.ts` | Lista NCs por PIM/etapa |
| `useCreateNC` | `useNoConformidades.ts` | Crear NC + notificar departamento |
| `useResolveNC` | `useNoConformidades.ts` | Resolver/cerrar NC |
| `useReopenNC` | `useNoConformidades.ts` | Reabrir NC cerrada |

### Bancos y Cotizaciones LC

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `useBancosLC` | `useBancosLC.ts` | Listar bancos activos del catalogo |
| `useCreateBancoLC` | `useBancosLC.ts` | Crear nuevo banco |
| `useCotizacionesLC` | `useBancosLC.ts` | Cotizaciones de un PIM (con datos del banco) |
| `useCreateCotizacionLC` | `useBancosLC.ts` | Crear cotizacion |
| `useSeleccionarBancoLC` | `useBancosLC.ts` | Seleccionar banco ganador |
| `useHasSelectedBank` | `useBancosLC.ts` | Verificar si hay banco seleccionado (gate) |

### Otros

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `usePermissions` | `usePermissions.ts` | Permisos del usuario actual por rol |
| `usePIMDocuments` | `usePIMDocuments.ts` | Documentos por PIM/etapa (storage) |
| `useUploadDocument` | `usePIMDocuments.ts` | Subir documento a storage |
| `useDeleteDocument` | `usePIMDocuments.ts` | Eliminar documento |
| `useCuentasBancarias` | `useCuentasBancarias.ts` | Cuentas bancarias de proveedores |
| `useEmailNotification` | `useEmailNotification.ts` | Enviar email via Edge Function |
| `useDashboardStats` | `useDashboardStats.ts` | Estadisticas del dashboard |
| `useSLAData` | `useSLAData.ts` | Datos SLA del PIM |
| `usePIMs` | `usePIMs.ts` | CRUD de PIMs |
| `useProducts` | `useProducts.ts` | CRUD de productos |
| `useSuppliers` | `useSuppliers.ts` | CRUD de proveedores |

---

## Componentes Principales

### Layout

| Componente | Descripcion |
|------------|-------------|
| `ComexLayout` | Layout del modulo COMEX: sidebar izquierdo + header + area de contenido |
| `ComexSidebar` | Sidebar con navegacion: Dashboard, Requerimientos, PIMs, Productos, Proveedores, Maestros, Usuarios |
| `Header` | Header con titulo, buscador, campana de notificaciones (con badge y dropdown), ajustes |

### Tracking (Seguimiento)

| Componente | Descripcion |
|------------|-------------|
| `TrackingStageBar` | Barra horizontal con las 6 etapas, indicador de etapa activa, opacidad para etapas de otro departamento |
| `TrackingChecklist` | Checklist interactivo filtrado por departamento, con seccion colapsable "Progreso de otras areas" |
| `StageGateSummary` | Resumen de blockers para avanzar etapa (verde = libre, rojo = bloqueado) |
| `StageReadOnlyCard` | Card compacta solo lectura para departamentos que no participan en la etapa |
| `StageResponsableCard` | Card para asignar/ver responsable de la etapa |
| `RequiredDocumentsPanel` | Grid de recuadros individuales por documento requerido (subido/pendiente) con upload integrado |
| `NonConformityPanel` | Panel para listar, crear y gestionar NCs de una etapa |
| `BankAccountPanel` | Panel de cuenta bancaria con flujo condicional (proveedor nuevo vs existente) |
| `LCBankQuotesPanel` | Panel de cotizaciones bancarias para Carta de Credito |
| `DHLTrackingPanel` | Panel de seguimiento DHL con timeline de eventos |
| `SplitPIMDialog` | Dialog para dividir un PIM en sub-PIMs |
| `TrackingTimeline` | Timeline de actividad del PIM |
| `TrackingNoteDialog` | Dialog para agregar notas al activity log |
| `TrackingProgressMini` | Indicador de progreso compacto |

---

## Tipos de Datos

### Tipos principales (`src/types/comex.ts`)

```typescript
type UserRole = 'admin' | 'manager' | 'jefe_comex' | 'analista_comex' |
  'jefe_finanzas' | 'analista_finanzas' | 'gerente' | 'viewer';

type Department = 'comex' | 'finanzas' | 'gerencia' | 'sistemas';

type PIMStatus = 'creado' | 'en_negociacion' | 'contrato_pendiente' |
  'contrato_validado' | 'apertura_lc' | 'anticipo_pendiente' |
  'en_produccion' | 'en_transito' | 'en_puerto' | 'en_aduana' |
  'liberado' | 'entregado' | 'cerrado';

type PaymentModality = 'carta_credito' | 'anticipo' | 'pago_contado' | 'credito';

type DocumentType = 'contrato' | 'cierre_compra' | 'factura' | 'bl' |
  'packing_list' | 'swift' | 'comprobante_pago' | 'certificado_calidad' |
  'certificado_origen' | 'enmienda' | 'costeo' | 'acta_recepcion' |
  'dus' | 'alzamiento' | 'otro';
```

### Interfaces clave

- **`PIM`**: Importacion completa con items, montos, estado, modalidad de pago, SLA
- **`StageDef`**: Definicion de etapa con checklist, departamentos, documentos, SLA
- **`ChecklistItemDef`**: Item de checklist con id, texto, criticidad, departamento, condicional
- **`StageBlocker`**: Blocker para gate validation (tipo + mensaje)
- **`Notification`**: Notificacion in-app (tipo, titulo, mensaje, leido, destinatario)
- **`BancoLC`**: Banco del catalogo LC (nombre, pais, SWIFT)
- **`CotizacionLC`**: Cotizacion bancaria (banco, tasa, monto, archivo, seleccionado)

---

## Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJI...
VITE_SUPABASE_PROJECT_ID=xxxxxx

# Edge Functions (configuradas en Supabase Dashboard > Secrets)
# DHL_API_KEY          - API key de DHL Developer Portal
# RESEND_API_KEY       - API key de Resend para envio de emails
# SUPABASE_URL         - URL del proyecto (auto-configurada)
# SUPABASE_SERVICE_ROLE_KEY - Service role key (auto-configurada)
```

---

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo (puerto 8080)
npm run build        # Build de produccion (vite build)
npm run build:dev    # Build en modo desarrollo
npm run preview      # Preview del build de produccion
npm run lint         # ESLint
npm run test         # Ejecutar tests (vitest)
npm run test:watch   # Tests en modo watch
```

---

## Rutas de la Aplicacion

### Autenticacion
| Ruta | Pagina |
|------|--------|
| `/login` | Login |
| `/register` | Registro |

### COMEX (`/comex`)
| Ruta | Pagina |
|------|--------|
| `/comex/dashboard` | Dashboard principal |
| `/comex/requirements` | Requerimientos de importacion |
| `/comex/pims` | Lista de PIMs |
| `/comex/pim/crear` | Crear nuevo PIM |
| `/comex/pim/editar/:id` | Editar PIM |
| `/comex/pim/seguimiento/:id` | Seguimiento de PIM (tracking) |
| `/comex/products` | Catalogo de productos |
| `/comex/suppliers` | Catalogo de proveedores |
| `/comex/maestros` | Datos maestros |
| `/comex/users` | Gestion de usuarios |

### Ordenes de Trabajo (`/work-orders`)
| Ruta | Pagina |
|------|--------|
| `/work-orders/dashboard` | Dashboard OTs |
| `/work-orders/orders` | Lista de ordenes |
| `/work-orders/orders/:id` | Detalle de orden |
| `/work-orders/create` | Crear orden de trabajo |

---

*Ultima actualizacion: Marzo 2026*
