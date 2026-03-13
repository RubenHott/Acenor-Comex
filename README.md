# Acenor COMEX — Sistema de Gestion de Importaciones

Sistema integral para la gestion de operaciones de comercio exterior (COMEX) de Acenor. Permite el seguimiento completo del ciclo de importacion a traves de 4 procesos con 40 pasos detallados, desde la revision de contrato hasta la recepcion y costeo, con visibilidad por departamento, flujo de pasos por etapa, gestion documental con renombramiento automatico, no conformidades, notificaciones en tiempo real, seguimiento DHL y snapshots de PIM.

---

## Indice

- [Stack Tecnologico](#stack-tecnologico)
- [Inicio Rapido](#inicio-rapido)
- [Arquitectura General](#arquitectura-general)
- [Modulos Disponibles](#modulos-disponibles)
- [Flujo de Trabajo PIM — 4 Procesos / 40 Pasos](#flujo-de-trabajo-pim--4-procesos--40-pasos)
- [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
- [Visibilidad por Departamento](#visibilidad-por-departamento)
- [Gate Validation (Validacion de Compuerta)](#gate-validation-validacion-de-compuerta)
- [Gestion Documental](#gestion-documental)
- [No Conformidades (NCs)](#no-conformidades-ncs)
- [Cuenta Bancaria — Flujo Condicional](#cuenta-bancaria--flujo-condicional)
- [Catalogo de Bancos para Carta de Credito](#catalogo-de-bancos-para-carta-de-credito)
- [Seguimiento DHL](#seguimiento-dhl)
- [Notificaciones (In-App + Email)](#notificaciones-in-app--email)
- [PIM Snapshots](#pim-snapshots)
- [Puertos y Transportistas](#puertos-y-transportistas)
- [Vista Principal de PIMs](#vista-principal-de-pims)
- [Base de Datos (Supabase)](#base-de-datos-supabase)
- [Edge Functions](#edge-functions)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Hooks Personalizados](#hooks-personalizados)
- [Componentes Principales](#componentes-principales)
- [Tipos de Datos](#tipos-de-datos)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)
- [Rutas de la Aplicacion](#rutas-de-la-aplicacion)

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| **Frontend** | React 18 + TypeScript + Vite 5 |
| **Estilos** | Tailwind CSS 3 + shadcn/ui (48+ componentes Radix) |
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
cd Acenor-Comex

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
┌───────────────────────────────────────────────────────┐
│                      FRONTEND                          │
│    React 18 + TypeScript + Vite + Tailwind/shadcn      │
│                                                        │
│  ┌──────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Pages   │  │  Components │  │    Contexts       │  │
│  │ (Router) │  │  (UI + Biz) │  │  (Auth, Theme)    │  │
│  └────┬─────┘  └──────┬──────┘  └────────┬─────────┘  │
│       │               │                  │             │
│  ┌────┴───────────────┴──────────────────┴──────────┐  │
│  │              React Query Hooks (25+)              │  │
│  │  usePIMTracking, useTrackingDashboard,            │  │
│  │  usePIMSnapshots, usePuertos, etc.                │  │
│  └──────────────────────┬───────────────────────────┘  │
└──────────────────────────┼─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                      │
│                                                         │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐ │
│  │PostgreSQL│  │  Auth   │  │ Storage  │  │Realtime │  │
│  │ (20+ tbl)│  │(JWT/RLS)│  │(pim-docs)│  │(notif)  │  │
│  └──────────┘  └─────────┘  └──────────┘  └─────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │               Edge Functions (Deno)                │  │
│  │  dhl-tracking | dhl-daily-check                    │  │
│  │  create-work-order | get-work-order-stats          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Modulos Disponibles

| Modulo | Estado | Ruta Base | Descripcion |
|--------|--------|-----------|-------------|
| **COMEX** | Activo | `/comex` | Gestion completa de importaciones: PIMs, seguimiento por procesos/pasos, tracking DHL, NCs |
| **Ordenes de Trabajo** | Activo | `/work-orders` | Gestion de OTs de mantenimiento industrial |
| **Produccion** | Pendiente | — | Control de produccion |
| **Mantenimiento** | Pendiente | — | Programacion de mantenimiento preventivo/correctivo |
| **Analytics** | Pendiente | — | Reportes, metricas y KPIs |
| **Logistica** | Pendiente | — | Gestion de almacenes e inventario |

---

## Flujo de Trabajo PIM — 4 Procesos / 40 Pasos

El sistema gestiona el ciclo completo de una importacion a traves de **4 procesos secuenciales**. Cada proceso contiene entre 8 y 12 pasos detallados con: responsable por departamento, documentos requeridos, declaracion de no conformidades y gate validation para avanzar. Los procesos deben completarse en orden (no se puede acceder a un proceso si el anterior no esta cerrado).

### Proceso 1: Revision de Contrato (10 pasos)

| Propiedad | Valor |
|-----------|-------|
| **Key** | `revision_contrato` |
| **Departamentos** | COMEX + Gerencia |
| **SLA** | 5 dias |
| **Docs requeridos** | Contrato, Cierre de Compra, Contrato Firmado, Borrador LC |

| # | Paso | Responsable | Descripcion |
|---|------|-------------|-------------|
| 1 | Recepcion de Cierre de Compra | COMEX | Carga del cierre de compra |
| 2 | Recepcion de Contrato | COMEX | Carga del contrato revisado |
| 3 | Declaracion de No Conformidad | COMEX/Gerencia | Evaluacion de conformidad entre contrato y cierre |
| 4 | Subsanacion de No Conformidad | (condicional) | Correccion de la observacion (si aplica) |
| 5 | Revision COMEX | COMEX (condicional) | Revision de la subsanacion |
| 6 | Contrato Firmado y Enviado | COMEX | Carga del contrato firmado enviado al proveedor |
| 7 | Validacion Cuenta Bancaria | COMEX | Seleccion o creacion de cuenta bancaria del proveedor |
| 8 | Aprobacion Gerencia | Gerencia | Aprobacion final de la cuenta bancaria |
| 9 | Borrador Carta de Credito | COMEX | Carga del borrador de L/C |
| 10 | Documentos Iniciales / Cierre | COMEX | Cierre del Proceso 1 |

### Proceso 2: Gestion Financiera de Pago (10 pasos)

| Propiedad | Valor |
|-----------|-------|
| **Key** | `gestion_pago` |
| **Departamentos** | Finanzas + COMEX |
| **SLA** | 10 dias |
| **Docs requeridos** | Contrato Firmado, SWIFT |

| # | Paso | Responsable | Descripcion |
|---|------|-------------|-------------|
| 1 | Encabezado / Antecedentes | — | Informacion consolidada del PIM + documentos disponibles |
| 2 | Revision Financiera | Finanzas | Finanzas revisa la documentacion |
| 3 | Declaracion NC Financiera | Finanzas | Declaracion de no conformidad si hay observaciones |
| 4 | Subsanacion NC Financiera | (condicional) | Correccion de la observacion financiera |
| 5 | Revision Finanzas | Finanzas (condicional) | Re-revision de la subsanacion |
| 6 | Registro Banco y Tasa | Finanzas | Registro del banco seleccionado y tasa de cambio |
| 7 | Solicitud de Firma | COMEX | Solicitud y carga del contrato firmado |
| 8 | Recepcion SWIFT | Finanzas | Recepcion y registro del SWIFT bancario |
| 9 | Gestion COMEX | COMEX | Envio del SWIFT al proveedor + gestion de respuesta |
| 10 | Cierre Proceso 2 | Finanzas | Cierre formal |

### Proceso 3: Seguimiento de Documentacion e Internacion (12 pasos)

| Propiedad | Valor |
|-----------|-------|
| **Key** | `documentacion_internacion` |
| **Departamentos** | COMEX + Finanzas |
| **SLA** | 20 dias |
| **Docs requeridos** | Factura, B/L, Packing List, Comprobante de Pago |

| # | Paso | Responsable | Descripcion |
|---|------|-------------|-------------|
| 1 | Recepcion Docs Digitales | COMEX | Recepcion de BL, factura, packing list |
| 2 | Registro DHL | COMEX | Ingreso del codigo de tracking DHL |
| 3 | Seguimiento Docs Fisicos | Finanzas | Confirmacion de recepcion de documentos fisicos |
| 4 | Revision Documental | COMEX/Finanzas | Revision de conformidad documental |
| 5 | Declaracion Discrepancia | (condicional) | Declaracion de discrepancia si existe |
| 6 | Subsanacion Discrepancia | (condicional) | Resolucion de la discrepancia |
| 7 | Retiro Docs del Banco | Finanzas | Finanzas retira documentos del banco y los envia a COMEX |
| 8 | Preparacion Set Documental | COMEX | COMEX prepara el set para el agente aduanero |
| 9 | Solicitud Pago Internacion | COMEX | Carga de documentos de internacion y monto a pagar |
| 10 | Gestion Pago Internacion | Finanzas | Finanzas revisa, ejecuta pago y sube comprobante |
| 11 | Confirmacion COMEX | COMEX | COMEX confirma recepcion y envia al agente aduanero |
| 12 | Cierre Proceso 3 | COMEX | Cierre formal |

### Proceso 4: Recepcion y Costeo (8 pasos)

| Propiedad | Valor |
|-----------|-------|
| **Key** | `recepcion_costeo` |
| **Departamentos** | COMEX + Finanzas |
| **SLA** | 5 dias |
| **Docs requeridos** | Costeo, Acta de Recepcion |

| # | Paso | Responsable | Descripcion |
|---|------|-------------|-------------|
| 1 | Citacion de Carga | COMEX | Registro de la citacion del transportista |
| 2 | Costeo de Productos | COMEX | Costeo de productos en el sistema |
| 3 | Validacion de Costeo | Finanzas | Finanzas valida el costeo |
| 4 | Declaracion NC Costeo | (condicional) | NC si hay observaciones al costeo |
| 5 | Subsanacion NC Costeo | COMEX (condicional) | COMEX corrige observaciones |
| 6 | Revision Finanzas Costeo | Finanzas (condicional) | Re-revision del costeo |
| 7 | Recepcion en Sistema | COMEX | Recepcion de productos en el sistema/ERP |
| 8 | Cierre Proceso 4 | COMEX | **PIM CERRADO** al completar |

Al cerrar el Proceso 4, el PIM queda en estado `cerrado` y se muestra un resumen de finalizacion (`PIMCompletedSummary`) con todos los documentos, etapas y tiempos.

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

Cada paso tiene un campo `requiredDepartment` que indica que departamentos participan. Esto determina la experiencia del usuario:

### Usuario participa en el proceso

Si el departamento del usuario esta incluido en `stageDef.departments` (o si el rol es admin/manager/gerente):

- **Pasos**: Ve y puede completar pasos asignados a su departamento
- **Seccion colapsable**: "Progreso de otras areas" con indicadores del resto
- **Documentos**: Puede subir sus documentos + ver los de otros (read-only)
- **NCs**: Puede crear y ver NCs de la etapa

### Usuario NO participa en el proceso

Si el departamento del usuario NO esta en `stageDef.departments`:

- Ve un **StageReadOnlyCard** compacto con:
  - Nombre del proceso + estado (pendiente/en_progreso/completado)
  - Departamento responsable + responsable asignado
  - Fechas inicio/fin
  - Indicadores: X docs subidos, X NCs abiertas, X% completado
  - Sin acciones interactivas

---

## Gate Validation (Validacion de Compuerta)

Para avanzar de un proceso al siguiente, el sistema valida condiciones (blockers):

| # | Tipo | Descripcion | Aplica en |
|---|------|-------------|-----------|
| 1 | `checklist` | Todos los pasos criticos deben estar completados | Todos los procesos |
| 2 | `document` | Todos los documentos requeridos deben estar subidos | Todos los procesos |
| 3 | `nc` | No debe haber NCs abiertas o en revision (si `ncBlocks = true`) | Todos los procesos |
| 4 | `bank_account` | Proveedor nuevo debe tener cuenta bancaria validada por Gerencia | Proceso 1 |
| 5 | `lc_bank` | Debe haber un banco seleccionado con cotizacion (si modalidad = carta_credito) | Proceso 2 |

El componente **StageGateSummary** muestra visualmente los blockers activos con mensajes descriptivos.

Ademas, los **procesos estan bloqueados secuencialmente**: no se puede acceder al Proceso 2 si el Proceso 1 no esta completado.

---

## Gestion Documental

### Documentos Requeridos por Proceso

| Tipo de Documento | Clave | Proceso |
|-------------------|-------|---------|
| Contrato | `contrato` | P1 — Revision Contrato |
| Cierre de Compra | `cierre_compra` | P1 — Revision Contrato |
| Contrato Firmado | `contrato_firmado` | P1, P2 |
| Borrador Carta de Credito | `borrador_lc` | P1 — Revision Contrato |
| SWIFT | `swift` | P2 — Gestion Financiera |
| Factura Comercial | `factura` | P3 — Documentacion |
| Bill of Lading (BL) | `bl` | P3 — Documentacion |
| Packing List | `packing_list` | P3 — Documentacion |
| Comprobante de Pago | `comprobante_pago` | P3 — Internacion |
| Costeo | `costeo` | P4 — Recepcion y Costeo |
| Acta de Recepcion | `acta_recepcion` | P4 — Recepcion y Costeo |
| Certificado de Calidad | `certificado_calidad` | P3 (opcional) |
| Certificado de Origen | `certificado_origen` | P3 (opcional) |
| Enmienda | `enmienda` | Varias (versionado) |
| DUS | `dus` | P3 — Internacion |
| Alzamiento | `alzamiento` | P3 — Internacion |

### Renombramiento Automatico

Al subir un documento, el sistema lo renombra automaticamente con el patron:

```
{PIM_CODIGO}-{Tipo_Documento}_{ID_UNICO}.{ext}
```

Ejemplos:
- `PIM-2026-002-Contrato_Firmado_a1b2.pdf`
- `PIM-2026-002-Bill_of_Lading_BL_c3d4.pdf`
- `PIM-2026-002-SWIFT_v2_e5f6.pdf` (cuando es version 2+)

Esto aplica tanto al nombre del archivo en el bucket de Storage como al campo `nombre` en la tabla `pim_documentos`.

### Paneles de Documentos

- **RequiredDocumentsPanel**: Grid de recuadros individuales por documento requerido (subido/pendiente) con upload integrado, versionado y download
- **DocumentUploadPanel**: Panel generico para subir documentos con selector de tipo
- **PIMDocumentsSummaryDialog**: Dialog modal que muestra todos los documentos del PIM agrupados por proceso

---

## No Conformidades (NCs)

Sistema de gestion de no conformidades integrado en cada proceso:

- **Crear NC**: Titulo, descripcion, prioridad (baja/media/alta/critica), departamento asignado, evidencia fotografica
- **Estados**: `abierta` → `en_revision` → `cerrada` (o `reabierta`)
- **Bloqueo**: Si `ncBlocks = true` para el proceso actual, no se puede avanzar con NCs abiertas
- **Notificaciones**: Al crear NC se notifica via email e in-app al departamento asignado
- **Flujo en pasos**: Los Procesos 1-4 tienen pasos dedicados para declaracion, subsanacion y revision de NCs (pasos condicionales que se activan solo si hay observaciones)

---

## Cuenta Bancaria — Flujo Condicional

En el **Proceso 1, Paso 7 (Validacion Cuenta Bancaria)**, la verificacion depende del tipo de proveedor:

### Proveedor existente (con cuentas validadas)
- Badge verde "Cuenta verificada" con resumen
- Boton "Ver detalle" colapsable
- NO es blocker para avanzar

### Proveedor nuevo (sin cuentas validadas)
1. **COMEX** crea la cuenta bancaria (formulario con datos del banco)
2. Cuenta queda en estado "Pendiente autorizacion Gerencia"
3. **Gerencia** revisa y autoriza/valida la cuenta (Paso 8: Aprobacion Gerencia)
4. **Es BLOCKER** para avanzar hasta que la cuenta este validada

---

## Catalogo de Bancos para Carta de Credito

Cuando la modalidad de pago es **Carta de Credito**, el Proceso 2 (Gestion Financiera) incluye un panel de cotizaciones bancarias:

### Tablas involucradas

- **`bancos_carta_credito`**: Catalogo de bancos (nombre, pais, SWIFT code)
- **`cotizaciones_lc`**: Cotizaciones por PIM (banco, tasa, monto USD, archivo PDF, seleccionado)

### Flujo
1. Finanzas agrega cotizaciones de diferentes bancos (tasa ofrecida, monto, PDF de cotizacion)
2. Se puede crear un nuevo banco si no existe en el catalogo
3. Se selecciona el banco ganador (tasa mas conveniente)
4. El sistema genera historial de cotizaciones por PIM
5. **Es BLOCKER**: No se puede avanzar de proceso sin banco seleccionado

---

## Seguimiento DHL

### Tracking en tiempo real
- Panel `DHLTrackingPanel` en el Proceso 3, Paso 2 (Registro DHL)
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
| `stage_advance` | Reciclar | Al avanzar un proceso |
| `responsable_change` | Persona | Al asignar nuevo responsable |
| `nc_created` | Advertencia | Al crear una NC |
| `dhl_arrived` | Paquete | Al llegar documentacion DHL |
| `nc_resolved` | Check | Al resolver una NC |

### Emails automaticos

| Evento | Destinatarios | Template |
|--------|--------------|----------|
| Avance de proceso | Departamento del siguiente proceso | `buildStageAdvanceEmail()` |
| Creacion de NC | Departamento asignado a la NC | `buildNCCreatedEmail()` |
| Recepcion SWIFT | Equipo COMEX | `buildSwiftReceivedEmail()` |
| Iteracion de NC | Involucrados en la NC | `buildNCIterationEmail()` |
| Llegada documentacion DHL | Todas las areas | `buildDocumentacionArrivedEmail()` |

---

## PIM Snapshots

El sistema captura una **foto instantanea** (snapshot) del estado del PIM al momento de su creacion. Esto permite comparar los datos originales vs los actuales para detectar cambios.

- **Hook**: `usePIMSnapshot(pimId)` / `useCreateSnapshot()`
- **Componente**: `PIMHistoryComparison` — muestra la comparacion lado a lado
- **Datos capturados**: Items, cantidades, precios, proveedor, modalidad de pago, condiciones contractuales
- **Tabla**: `pim_snapshots` en Supabase

---

## Puertos y Transportistas

### Puertos
- Seleccion multiple de puertos de destino para cada PIM
- Hook `usePuertos()` para listar puertos disponibles
- Hook `usePIMPuertos()` / `useSavePIMPuertos()` para asignar puertos a un PIM
- Hook `useCreatePuerto()` para crear nuevos puertos
- Tabla: `puertos` + `pim_puertos` (relacion muchos-a-muchos)

### Transportistas
- Registro de transportistas/navieras para el seguimiento
- Hook `useTransportistas()` para listar transportistas
- Hook `useCreateTransportista()` para crear nuevos
- Se utilizan en el Proceso 4 (Citacion de Carga)

---

## Vista Principal de PIMs

La pagina principal del modulo COMEX es la **lista de PIMs** (`/comex/pims`), que reemplaza al antiguo dashboard. Incluye:

### PIMFullCard — Tarjeta completa de PIM
Cada PIM se muestra como una tarjeta horizontal con:
- **Codigo PIM** + badge de cuadro de importacion
- **Descripcion**, proveedor, monto total (USD), tonelaje
- **Puertos** de origen y destino
- **Timeline horizontal** con los 4 procesos y estado visual (completado/en progreso/pendiente)
- **Barra de salud del proceso** con porcentaje de avance
- **SLA**: Indicador de dias transcurridos vs SLA maximo
- **Responsable** actual con avatar
- **Botones de accion**: Documentos (resumen modal), Seguimiento (navega al tracking), Editar, Eliminar

### Filtros y busqueda
- **Busqueda por texto** (codigo, descripcion, proveedor)
- **Filtro por estado** (todos, en proceso, cerrado, etc.)
- **Filtro por cuadro de importacion** (dropdown)
- **Filtro por articulo** (busca en los items/productos del PIM por codigo o descripcion)

### Estadisticas superiores
Barra de estadisticas con conteos: PIMs activos, en proceso, cerrados y total.

---

## Base de Datos (Supabase)

### Tablas principales

| Tabla | Descripcion |
|-------|-------------|
| `pims` | Importaciones (PIMs): codigo, estado, proveedor, modalidad pago, montos, tracking DHL |
| `pim_items` | Items/productos de cada PIM con cantidades, precios, parcialidades |
| `pim_tracking_stages` | Etapas/procesos de seguimiento por PIM: estado, responsable, fechas |
| `pim_documentos` | Documentos subidos organizados por proceso y tipo, con versionado |
| `pim_activity_log` | Bitacora de actividad: notas, cambios, acciones del sistema |
| `pim_snapshots` | Instantaneas del estado del PIM al momento de creacion |
| `pim_puertos` | Relacion muchos-a-muchos entre PIMs y puertos |
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
| `cuadros_importacion` | Cuadros/lineas de importacion |
| `puertos` | Catalogo de puertos |
| `transportistas` | Catalogo de transportistas/navieras |
| `fabricas_molinos` | Fabricas y molinos de proveedores |
| `work_orders` | Ordenes de trabajo de mantenimiento |

### Bucket de Storage

- **`pim-documentos`**: Almacena todos los documentos subidos (contratos, facturas, B/L, etc.)
- Organizado por: `{pim_id}/{stage_key}/{PIM_CODIGO-Tipo_Documento_XXXX.ext}`
- Renombramiento automatico al subir

---

## Edge Functions

| Funcion | Ruta | Descripcion |
|---------|------|-------------|
| `dhl-tracking` | `/functions/v1/dhl-tracking` | Consulta tracking DHL por numero, actualiza PIM |
| `dhl-daily-check` | `/functions/v1/dhl-daily-check` | Cron diario: verifica PIMs con tracking, notifica llegadas |
| `create-work-order` | `/functions/v1/create-work-order` | Crear orden de trabajo |
| `get-work-order-stats` | `/functions/v1/get-work-order-stats` | Estadisticas de ordenes de trabajo |

---

## Estructura del Proyecto

```
Acenor-Comex/
├── public/                              # Assets estaticos
├── src/
│   ├── main.tsx                         # Entry point
│   ├── App.tsx                          # Enrutamiento principal
│   ├── index.css                        # Estilos globales (Tailwind)
│   │
│   ├── components/
│   │   ├── layout/                      # Layout principal
│   │   │   ├── ComexLayout.tsx          # Layout COMEX (sidebar + header)
│   │   │   ├── ComexSidebar.tsx         # Sidebar navegacion COMEX
│   │   │   ├── Header.tsx               # Header con notificaciones
│   │   │   ├── WorkOrdersLayout.tsx     # Layout modulo OTs
│   │   │   └── WorkOrdersSidebar.tsx
│   │   │
│   │   ├── pim/                         # Componentes de PIM (15 archivos)
│   │   │   ├── PIMFullCard.tsx          # Tarjeta completa de PIM (vista principal)
│   │   │   ├── PIMTrackingCard.tsx      # Tarjeta compacta para listas
│   │   │   ├── PIMStatusBadge.tsx       # Badge de estado del PIM
│   │   │   ├── PIMDocumentsSummaryDialog.tsx # Dialog resumen de documentos
│   │   │   ├── PIMHistoryComparison.tsx # Comparacion snapshot vs actual
│   │   │   ├── PIMForm.tsx              # Formulario crear/editar PIM
│   │   │   ├── PIMItemSelector.tsx      # Selector de items
│   │   │   ├── PIMEditItemsTable.tsx    # Tabla editable de items
│   │   │   ├── PIMDetailItems.tsx       # Detalle de items (read-only)
│   │   │   ├── PIMDetailContract.tsx    # Detalle de contrato
│   │   │   ├── PIMContractConditions.tsx # Condiciones contractuales
│   │   │   ├── PIMExtraProductSelector.tsx # Selector productos extra
│   │   │   ├── AddFromRequirementDialog.tsx # Crear PIM desde requerimiento
│   │   │   ├── AddSupplierDialog.tsx    # Agregar proveedor inline
│   │   │   └── AddFabricaMolinoDialog.tsx # Agregar fabrica/molino
│   │   │
│   │   ├── tracking/                    # Componentes de seguimiento (18 archivos)
│   │   │   ├── TrackingStageBar.tsx     # Barra de procesos (navegacion)
│   │   │   ├── StageStepFlow.tsx        # Flujo visual de pasos por proceso
│   │   │   ├── TrackingChecklist.tsx    # Checklist por departamento
│   │   │   ├── TrackingTimeline.tsx     # Timeline de actividad
│   │   │   ├── TrackingProgressMini.tsx # Progreso compacto
│   │   │   ├── TrackingNoteDialog.tsx   # Dialog agregar notas
│   │   │   ├── StageGateSummary.tsx     # Resumen de blockers
│   │   │   ├── StageReadOnlyCard.tsx    # Card solo lectura
│   │   │   ├── StageResponsableCard.tsx # Card responsable
│   │   │   ├── RequiredDocumentsPanel.tsx # Documentos requeridos con upload
│   │   │   ├── DocumentUploadPanel.tsx  # Upload generico de documentos
│   │   │   ├── PIMCompletedSummary.tsx  # Resumen al cerrar PIM
│   │   │   ├── NonConformityPanel.tsx   # Panel de NCs
│   │   │   ├── NonConformityCreateDialog.tsx # Dialog crear NC
│   │   │   ├── BankAccountPanel.tsx     # Panel cuenta bancaria
│   │   │   ├── LCBankQuotesPanel.tsx    # Cotizaciones bancarias LC
│   │   │   ├── DHLTrackingPanel.tsx     # Panel seguimiento DHL
│   │   │   └── SplitPIMDialog.tsx       # Dialog dividir PIM
│   │   │
│   │   ├── tracking/steps/             # Pasos del Proceso 1 (10 archivos)
│   │   │   ├── StepRecepcionContrato.tsx
│   │   │   ├── StepRecepcionCierreCompra.tsx
│   │   │   ├── StepDeclaracionNC.tsx
│   │   │   ├── StepSubsanacionNC.tsx
│   │   │   ├── StepRevisionComex.tsx
│   │   │   ├── StepContratoFirmado.tsx
│   │   │   ├── StepValidacionBancaria.tsx
│   │   │   ├── StepAprobacionGerencia.tsx
│   │   │   ├── StepBorradorCartaCredito.tsx
│   │   │   └── StepDocumentosIniciales.tsx / StepCierreProceso.tsx
│   │   │
│   │   ├── tracking/steps/p2/          # Pasos del Proceso 2 (10 archivos)
│   │   │   ├── StepEncabezadoAntecedentes.tsx
│   │   │   ├── StepRevisionFinanciera.tsx
│   │   │   ├── StepDeclaracionNCFin.tsx
│   │   │   ├── StepSubsanacionNCFin.tsx
│   │   │   ├── StepRevisionFinanzas.tsx
│   │   │   ├── StepRegistroBancoTasa.tsx
│   │   │   ├── StepSolicitudFirma.tsx
│   │   │   ├── StepRecepcionSwift.tsx
│   │   │   └── StepGestionComex.tsx + Cierre
│   │   │
│   │   ├── tracking/steps/p3/          # Pasos del Proceso 3 (12 archivos)
│   │   │   ├── StepRecepcionDocsDigitales.tsx
│   │   │   ├── StepRegistroDHL.tsx
│   │   │   ├── StepSeguimientoDocsFisicos.tsx
│   │   │   ├── StepRevisionDocumental.tsx
│   │   │   ├── StepDeclaracionDiscrepancia.tsx
│   │   │   ├── StepSubsanacionDiscrepancia.tsx
│   │   │   ├── StepRetiroDocsBanco.tsx
│   │   │   ├── StepPreparacionSetDocumental.tsx
│   │   │   ├── StepSolicitudPagoInternacion.tsx
│   │   │   ├── StepGestionPagoInternacion.tsx
│   │   │   └── StepConfirmacionComex.tsx + Cierre
│   │   │
│   │   ├── tracking/steps/p4/          # Pasos del Proceso 4 (8 archivos)
│   │   │   ├── StepCitacionCarga.tsx
│   │   │   ├── StepCosteoProductos.tsx
│   │   │   ├── StepValidacionCosteo.tsx
│   │   │   ├── StepDeclaracionNCCosteo.tsx
│   │   │   ├── StepSubsanacionNCCosteo.tsx
│   │   │   ├── StepRevisionFinanzasCosteo.tsx
│   │   │   └── StepRecepcionSistema.tsx + Cierre
│   │   │
│   │   ├── users/                       # Gestion de usuarios
│   │   │   ├── CreateUserDialog.tsx
│   │   │   ├── EditUserDialog.tsx
│   │   │   ├── ResetPasswordDialog.tsx
│   │   │   └── UserRoleBadge.tsx
│   │   │
│   │   ├── requirements/                # Requerimientos de importacion
│   │   │   ├── RequirementEntryForm.tsx
│   │   │   └── ProductAutocomplete.tsx
│   │   │
│   │   ├── maestros/                    # Datos maestros
│   │   │   ├── TableStructureCard.tsx
│   │   │   └── tableSchemas.ts
│   │   │
│   │   ├── workOrders/                  # Ordenes de trabajo
│   │   │   ├── PriorityBadge.tsx
│   │   │   └── WorkOrderStatusBadge.tsx
│   │   │
│   │   └── ui/                          # shadcn/ui (48+ componentes Radix)
│   │
│   ├── pages/
│   │   ├── Index.tsx                    # Pagina principal (redirect)
│   │   ├── LoginPage.tsx                # Login
│   │   ├── RegisterPage.tsx             # Registro
│   │   ├── ModulesPage.tsx              # Seleccion de modulos
│   │   ├── PIMsPage.tsx                 # Lista de PIMs (pagina principal COMEX)
│   │   ├── ProductsPage.tsx             # Catalogo de productos
│   │   ├── SuppliersPage.tsx            # Catalogo de proveedores
│   │   ├── RequirementsPage.tsx         # Requerimientos mensuales
│   │   ├── MaestrosPage.tsx             # Datos maestros
│   │   ├── UsersPage.tsx                # Gestion de usuarios
│   │   ├── ComingSoonPage.tsx           # Placeholder modulos pendientes
│   │   ├── NotFound.tsx                 # 404
│   │   │
│   │   ├── comex/
│   │   │   ├── CreatePIMPage.tsx        # Crear nuevo PIM
│   │   │   ├── EditPIMPage.tsx          # Editar PIM existente
│   │   │   └── PIMTrackingPage.tsx      # Seguimiento de PIM (4 procesos)
│   │   │
│   │   └── workOrders/
│   │       ├── WorkOrdersDashboardPage.tsx
│   │       ├── WorkOrdersListPage.tsx
│   │       ├── WorkOrderDetailPage.tsx
│   │       └── CreateWorkOrderPage.tsx
│   │
│   ├── hooks/                           # React Query hooks (25 archivos)
│   │   ├── usePIMTracking.ts            # Tracking: stages, checklist, advance, split
│   │   ├── useStageSteps.ts             # Pasos: definiciones y estado por proceso
│   │   ├── useTrackingDashboard.ts      # Info de tracking en bulk para lista
│   │   ├── usePIMs.ts                   # CRUD y consultas de PIMs
│   │   ├── usePIMCreation.ts            # Creacion de PIM con items
│   │   ├── usePIMItems.ts              # Items de PIM
│   │   ├── usePIMDocuments.ts           # Documentos (storage + auto-rename)
│   │   ├── usePIMSnapshots.ts           # Snapshots de PIM
│   │   ├── usePuertos.ts               # Puertos y asignacion a PIMs
│   │   ├── useTransportistas.ts         # Transportistas/navieras
│   │   ├── useNotifications.ts          # Notificaciones in-app + realtime
│   │   ├── useNoConformidades.ts        # NCs: crear, resolver, reabrir
│   │   ├── useBancosLC.ts              # Bancos y cotizaciones LC
│   │   ├── useCuentasBancarias.ts       # Cuentas bancarias de proveedores
│   │   ├── usePermissions.ts            # Permisos por rol/departamento
│   │   ├── useEmailNotification.ts      # Envio de emails via Edge Function
│   │   ├── useProducts.ts              # CRUD productos
│   │   ├── useSuppliers.ts             # CRUD proveedores
│   │   ├── useRequirements.ts          # CRUD requerimientos
│   │   ├── useCuadros.ts              # Cuadros de importacion
│   │   ├── useMolinos.ts              # Fabricas y molinos
│   │   ├── useUserProfiles.ts          # Perfiles de usuario
│   │   ├── useWorkOrders.ts            # CRUD ordenes de trabajo
│   │   ├── use-mobile.tsx              # Deteccion pantalla movil
│   │   └── use-toast.ts               # Hook para toasts (sonner)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx              # Autenticacion (Supabase Auth + user_profiles)
│   │
│   ├── lib/
│   │   ├── trackingChecklists.ts        # Definiciones de procesos, departamentos, SLAs
│   │   ├── stageStepDefinitions.ts      # Definiciones de 40 pasos (4 procesos)
│   │   ├── permissions.ts               # Roles, acciones, permisos
│   │   ├── emailTriggers.ts             # Templates de email HTML
│   │   ├── userConstants.ts             # Constantes de usuario
│   │   ├── cuadrosUnidad.ts             # Mapeo cuadros-unidades
│   │   ├── parseCsvExcel.ts             # Parser CSV/Excel
│   │   └── utils.ts                     # Utilidades (cn, etc.)
│   │
│   ├── types/
│   │   ├── comex.ts                     # Tipos COMEX (PIM, Product, Supplier, etc.)
│   │   └── workOrders.ts               # Tipos Ordenes de Trabajo
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts               # Cliente Supabase configurado
│   │       └── types.ts                # Tipos generados de Supabase
│   │
│   └── test/                           # Tests
│
├── supabase/
│   ├── config.toml                     # Configuracion local Supabase
│   ├── migrations/                     # Migraciones SQL
│   └── functions/
│       ├── dhl-tracking/index.ts       # Tracking DHL manual
│       ├── dhl-daily-check/            # Cron diario DHL
│       ├── create-work-order/index.ts
│       └── get-work-order-stats/index.ts
│
├── .claude/
│   └── launch.json                     # Configuracion de servidores de desarrollo
│
├── package.json
├── vite.config.ts                      # Vite (puerto 8080, alias @)
├── tailwind.config.ts                  # Tailwind CSS
├── tsconfig.json
├── tsconfig.app.json
├── postcss.config.js
├── eslint.config.js
└── components.json                     # Configuracion shadcn/ui
```

---

## Hooks Personalizados

### Tracking y Seguimiento

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `useTrackingStages` | `usePIMTracking.ts` | Obtiene las etapas/procesos de un PIM |
| `useChecklistItems` | `usePIMTracking.ts` | Items del checklist por proceso |
| `useActivityLog` | `usePIMTracking.ts` | Bitacora de actividad del PIM |
| `useInitializeTracking` | `usePIMTracking.ts` | Crea 4 procesos + checklist |
| `useCanAdvanceStage` | `usePIMTracking.ts` | Valida gate conditions (5 blockers) |
| `useAdvanceStage` | `usePIMTracking.ts` | Avanza proceso + notifica siguiente departamento |
| `useToggleChecklistItem` | `usePIMTracking.ts` | Marca/desmarca items del checklist |
| `useAddNote` | `usePIMTracking.ts` | Agrega nota al activity log |
| `useSplitPIM` | `usePIMTracking.ts` | Divide PIM en sub-PIMs |
| `useChildPIMs` / `useParentPIM` | `usePIMTracking.ts` | Navegacion jerarquica de PIMs divididos |
| `useStageSteps` | `useStageSteps.ts` | Definiciones y estado de pasos por proceso |
| `useCompleteStep` | `useStageSteps.ts` | Completar un paso individual |
| `useTrackingDashboard` | `useTrackingDashboard.ts` | Info de tracking en bulk para la lista de PIMs |

### Documentos

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `usePIMDocuments` | `usePIMDocuments.ts` | Documentos por PIM/proceso |
| `useUploadDocument` | `usePIMDocuments.ts` | Subir documento con auto-rename |
| `useDeleteDocument` | `usePIMDocuments.ts` | Eliminar documento |
| `useStageDocumentStatus` | `usePIMDocuments.ts` | Estado de docs requeridos por proceso |
| `useDHLTracking` | `usePIMDocuments.ts` | Consulta tracking DHL |

### Snapshots

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `usePIMSnapshot` | `usePIMSnapshots.ts` | Obtiene snapshot de creacion del PIM |
| `useCreateSnapshot` | `usePIMSnapshots.ts` | Crea snapshot al momento de crear PIM |

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
| `useNoConformidades` | `useNoConformidades.ts` | Lista NCs por PIM/proceso |
| `useCreateNC` | `useNoConformidades.ts` | Crear NC + notificar departamento |
| `useResolveNC` | `useNoConformidades.ts` | Resolver/cerrar NC |
| `useReopenNC` | `useNoConformidades.ts` | Reabrir NC cerrada |

### Bancos y Cotizaciones LC

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `useBancosLC` | `useBancosLC.ts` | Listar bancos activos del catalogo |
| `useCreateBancoLC` | `useBancosLC.ts` | Crear nuevo banco |
| `useCotizacionesLC` | `useBancosLC.ts` | Cotizaciones de un PIM |
| `useCreateCotizacionLC` | `useBancosLC.ts` | Crear cotizacion |
| `useSeleccionarBancoLC` | `useBancosLC.ts` | Seleccionar banco ganador |
| `useHasSelectedBank` | `useBancosLC.ts` | Verificar banco seleccionado (gate) |

### Puertos y Transportistas

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `usePuertos` | `usePuertos.ts` | Listar puertos disponibles |
| `useCreatePuerto` | `usePuertos.ts` | Crear nuevo puerto |
| `usePIMPuertos` | `usePuertos.ts` | Puertos asignados a un PIM |
| `useSavePIMPuertos` | `usePuertos.ts` | Guardar asignacion de puertos |
| `useTransportistas` | `useTransportistas.ts` | Listar transportistas |
| `useCreateTransportista` | `useTransportistas.ts` | Crear nuevo transportista |

### Otros

| Hook | Archivo | Descripcion |
|------|---------|-------------|
| `usePermissions` | `usePermissions.ts` | Permisos del usuario actual por rol |
| `usePIMsWithItems` | `usePIMs.ts` | PIMs con items, proveedor y cuadro |
| `useCreatePIM` | `usePIMCreation.ts` | Crear PIM con items |
| `useUpdatePIM` | `usePIMCreation.ts` | Actualizar PIM existente |
| `useCuentasBancarias` | `useCuentasBancarias.ts` | Cuentas bancarias de proveedores |
| `useEmailNotification` | `useEmailNotification.ts` | Enviar email via Edge Function |
| `useCuadros` | `useCuadros.ts` | Cuadros de importacion |
| `useMolinos` | `useMolinos.ts` | Fabricas y molinos |
| `useProducts` | `useProducts.ts` | CRUD de productos |
| `useSuppliers` | `useSuppliers.ts` | CRUD de proveedores |
| `useRequirements` | `useRequirements.ts` | CRUD de requerimientos |
| `useUserProfiles` | `useUserProfiles.ts` | Perfiles de usuario |
| `useWorkOrders` | `useWorkOrders.ts` | CRUD de ordenes de trabajo |

---

## Componentes Principales

### Layout

| Componente | Descripcion |
|------------|-------------|
| `ComexLayout` | Layout del modulo COMEX: sidebar izquierdo + header + area de contenido |
| `ComexSidebar` | Sidebar con navegacion: PIMs, Requerimientos, Contratos, Pagos, Catalogos, Maestros, Sistema |
| `Header` | Header con titulo, buscador, campana de notificaciones (badge + dropdown), ajustes |

### PIM

| Componente | Descripcion |
|------------|-------------|
| `PIMFullCard` | Tarjeta completa para la vista principal: codigo, proveedor, monto, timeline, progreso, SLA, acciones |
| `PIMTrackingCard` | Tarjeta compacta para listas de seleccion |
| `PIMStatusBadge` | Badge de estado con colores por fase |
| `PIMDocumentsSummaryDialog` | Dialog modal con todos los documentos agrupados por proceso |
| `PIMHistoryComparison` | Comparacion snapshot vs estado actual |
| `PIMForm` | Formulario completo para crear/editar PIM |
| `PIMItemSelector` | Selector de items/productos |
| `PIMEditItemsTable` | Tabla editable de items |
| `PIMContractConditions` | Condiciones contractuales |

### Tracking (Seguimiento)

| Componente | Descripcion |
|------------|-------------|
| `TrackingStageBar` | Barra horizontal con los 4 procesos e indicador del activo |
| `StageStepFlow` | Flujo visual de todos los pasos del proceso actual con estado |
| `TrackingChecklist` | Checklist interactivo filtrado por departamento |
| `StageGateSummary` | Resumen de blockers para avanzar proceso |
| `PIMCompletedSummary` | Resumen de finalizacion al cerrar todos los procesos |
| `StageReadOnlyCard` | Card compacta solo lectura para otros departamentos |
| `StageResponsableCard` | Card para asignar/ver responsable del proceso |
| `RequiredDocumentsPanel` | Grid de recuadros por documento requerido con upload y auto-rename |
| `DocumentUploadPanel` | Upload generico de documentos con auto-rename |
| `NonConformityPanel` | Panel de NCs con creacion, resolucion y reapertura |
| `BankAccountPanel` | Panel cuenta bancaria (flujo condicional proveedor nuevo/existente) |
| `LCBankQuotesPanel` | Panel de cotizaciones bancarias para Carta de Credito |
| `DHLTrackingPanel` | Panel de seguimiento DHL con timeline de eventos |
| `SplitPIMDialog` | Dialog para dividir PIM en sub-PIMs |
| `TrackingTimeline` | Timeline de actividad del PIM |
| `TrackingNoteDialog` | Dialog para agregar notas al activity log |

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
- **`StageDef`**: Definicion de proceso con departamentos, documentos, SLA, `useStepFlow`
- **`StageStepDef`**: Definicion de paso con key, order, name, department, docs, `isConditional`
- **`StageBlocker`**: Blocker para gate validation (tipo + mensaje)
- **`PIMDocument`**: Documento subido con tipo, nombre (auto-rename), url, version, stage_key
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

### Seleccion de Modulo
| Ruta | Pagina |
|------|--------|
| `/` | ModulesPage — seleccion de modulo (COMEX, OTs, etc.) |

### COMEX (`/comex`)
| Ruta | Pagina |
|------|--------|
| `/comex` | Redirige a `/comex/pims` |
| `/comex/pims` | Lista de PIMs (pagina principal) |
| `/comex/requirements` | Requerimientos de importacion |
| `/comex/pim/crear` | Crear nuevo PIM |
| `/comex/pim/editar/:id` | Editar PIM |
| `/comex/pim/seguimiento/:id` | Seguimiento de PIM (4 procesos) |
| `/comex/products` | Catalogo de productos |
| `/comex/suppliers` | Catalogo de proveedores |
| `/comex/maestros` | Datos maestros (puertos, transportistas, bancos, etc.) |
| `/comex/users` | Gestion de usuarios |
| `/comex/contracts` | Contratos (pendiente) |
| `/comex/payments` | Pagos (pendiente) |
| `/comex/prices` | Precios (pendiente) |
| `/comex/notifications` | Notificaciones (pendiente) |
| `/comex/settings` | Configuracion (pendiente) |

### Ordenes de Trabajo (`/work-orders`)
| Ruta | Pagina |
|------|--------|
| `/work-orders` | Redirige a `/work-orders/dashboard` |
| `/work-orders/dashboard` | Dashboard OTs |
| `/work-orders/orders` | Lista de ordenes |
| `/work-orders/orders/:id` | Detalle de orden |
| `/work-orders/create` | Crear orden de trabajo |

---

*Ultima actualizacion: Marzo 2026*
