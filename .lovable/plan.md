

# Plan: Sistema de Seguimiento de PIMs (Tracking por Etapas)

## Resumen

Implementar un sistema completo de seguimiento de importaciones que permita avanzar cada PIM a traves de 5 etapas del proceso (Contrato, Financiero, Embarque, Internacion, Recepcion), con checklists, historial de acciones, notas, alertas por vencimiento de plazos, y la capacidad de dividir un PIM en dos.

---

## 1. Nuevas Tablas en la Base de Datos

### 1.1 `pim_tracking_stages` - Etapas de seguimiento por PIM

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | text PK | UUID |
| pim_id | text NOT NULL | Referencia al PIM |
| stage_key | text NOT NULL | contrato, financiero, embarque, internacion, recepcion |
| status | text NOT NULL | pendiente, en_progreso, completado, bloqueado |
| fecha_inicio | timestamptz | Cuando se inicio la etapa |
| fecha_limite | timestamptz | Fecha limite estimada |
| fecha_fin | timestamptz | Cuando se completo |
| responsable | text | Usuario/departamento responsable |
| notas | text | Observaciones generales |

### 1.2 `pim_checklist_items` - Items del checklist por etapa

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | text PK | UUID |
| pim_id | text NOT NULL | Referencia al PIM |
| stage_key | text NOT NULL | Etapa asociada |
| checklist_key | text NOT NULL | Identificador unico del item (ej: c1, f2) |
| texto | text NOT NULL | Descripcion del item |
| critico | boolean | Si es un item critico |
| completado | boolean DEFAULT false | Estado |
| completado_por | text | Quien lo marco |
| completado_en | timestamptz | Cuando se completo |

### 1.3 `pim_activity_log` - Historial de acciones

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | text PK | UUID |
| pim_id | text NOT NULL | Referencia al PIM |
| stage_key | text | Etapa relacionada (nullable) |
| tipo | text NOT NULL | checklist_check, note, status_change, stage_advance, split |
| descripcion | text NOT NULL | Descripcion legible de la accion |
| usuario | text NOT NULL | Quien realizo la accion |
| metadata | jsonb | Datos adicionales (item cambiado, valores antes/despues) |
| created_at | timestamptz DEFAULT now() | Fecha y hora |

Politicas RLS: SELECT, INSERT, UPDATE con `true` (consistente con el patron actual del proyecto).

---

## 2. Definicion de Checklists por Etapa

Se registraran en el codigo (no en BD) las definiciones de checklist basadas en el procedimiento COMEX proporcionado:

- **Contrato** (7 items): Contrato recibido, datos proveedor verificados, precios/cantidades/incoterm validados, condiciones de pago confirmadas, datos bancarios verificados, contrato firmado por gerencia, contrato enviado al proveedor.
- **Financiero** (7 items): Modalidad de pago definida, documentacion enviada a tesoreria, cotizacion bancaria realizada, banco seleccionado, firmas obtenidas, swift emitido/pago ejecutado, confirmacion de recepcion por proveedor.
- **Embarque** (6 items): Proveedor confirma fecha de embarque, documentos de embarque recibidos, montos validados contra contrato, set de documentos armado, documentos enviados a banco, sin discrepancias.
- **Internacion** (6 items): Documentos retirados del banco, agente de aduanas notificado, pago de internacion realizado, comprobante enviado al agente, alzamiento firmado, carga liberada.
- **Recepcion** (5 items): Mercancia recibida en bodega, costeo de productos realizado, cantidades y valores validados, costeo aprobado, recepcion ingresada al sistema.

---

## 3. Nueva Pagina: Seguimiento de PIM

**Ruta**: `/comex/pim/seguimiento/:id`

### Layout

```text
+----------------------------------------------------------+
| < Volver    PIM-2026-001   Estado: En Progreso   [Split] |
+----------------------------------------------------------+
| Barra de Progreso Visual (5 etapas con iconos y colores) |
| [Contrato] > [Financiero] > [Embarque] > [Internacion]   |
|                              > [Recepcion]                |
+----------------------------------------------------------+
| Panel Izquierdo (Checklist)  | Panel Derecho (Timeline)  |
| [ ] Item 1 (critico)        | 06 feb - J.Perez          |
| [x] Item 2                  |   "Contrato revisado..."  |
| [x] Item 3                  | 05 feb - M.Lopez          |
|                              |   "Pago autorizado"       |
| + Agregar nota               | ...                       |
+----------------------------------------------------------+
```

### Funcionalidades:
- **Barra de progreso**: Muestra las 5 etapas con estado visual (gris=pendiente, azul=en progreso, verde=completado, rojo=bloqueado)
- **Checklist interactivo**: Marcar/desmarcar items, items criticos resaltados
- **Timeline/historial**: Muestra todas las acciones en orden cronologico
- **Notas**: Agregar notas en cualquier etapa
- **Alertas**: Items criticos pendientes y fechas limite proximas

---

## 4. Funcionalidad de Division de PIM (Split)

Permitir dividir un PIM en dos cuando solo se embarca parte del contrato:

1. Boton "Dividir PIM" en la vista de seguimiento
2. Dialog que muestra los items del PIM con checkboxes
3. El usuario selecciona que items van al nuevo PIM
4. Se crea un nuevo PIM (sub-pim) con codigo `PIM-2026-001-B`
5. Los items seleccionados se mueven al nuevo PIM
6. Se registra la accion en el historial de ambos PIMs
7. El PIM original actualiza sus totales

---

## 5. Cambios en Archivos Existentes

### Modificados:
- **`src/pages/PIMsPage.tsx`**: Agregar boton "Seguimiento" junto a "Editar" en el detalle del PIM
- **`src/App.tsx`**: Agregar ruta `/comex/pim/seguimiento/:id`

### Nuevos archivos:
- **`src/pages/comex/PIMTrackingPage.tsx`**: Pagina principal de seguimiento
- **`src/components/tracking/TrackingStageBar.tsx`**: Barra de progreso por etapas
- **`src/components/tracking/TrackingChecklist.tsx`**: Checklist interactivo por etapa
- **`src/components/tracking/TrackingTimeline.tsx`**: Timeline de actividades
- **`src/components/tracking/TrackingNoteDialog.tsx`**: Dialog para agregar notas
- **`src/components/tracking/SplitPIMDialog.tsx`**: Dialog para dividir PIM
- **`src/hooks/usePIMTracking.ts`**: Hook con queries/mutations para tracking
- **`src/lib/trackingChecklists.ts`**: Definiciones de checklists por etapa

---

## 6. Secuencia de Implementacion

1. Crear las 3 tablas nuevas con politicas RLS (migracion SQL)
2. Crear `src/lib/trackingChecklists.ts` con las definiciones
3. Crear `src/hooks/usePIMTracking.ts` con los hooks de datos
4. Crear los componentes de tracking (StageBar, Checklist, Timeline, NoteDialog)
5. Crear `SplitPIMDialog.tsx` para la division de PIMs
6. Crear `PIMTrackingPage.tsx` integrando todo
7. Actualizar rutas en `App.tsx`
8. Agregar boton de seguimiento en `PIMsPage.tsx`

---

## Notas Tecnicas

- Al inicializar el tracking de un PIM por primera vez, se crean automaticamente las 5 etapas y todos los items de checklist
- El estado del PIM (`pims.estado`) se actualizara automaticamente al completar etapas (ej: completar etapa "contrato" cambia estado a `contrato_validado`)
- Las alertas de fechas limite se integran con la tabla `notificaciones` existente
- El historial registra usuario, fecha, tipo de accion y metadata para auditoria completa
- La division de PIM es atomica: se usa una transaccion logica para mover items y actualizar totales

