# Esquema de Base de Datos

Base de datos PostgreSQL en Supabase con 17+ tablas, 9 funciones SQL y 1 trigger.

## Diagrama de Relaciones

```
┌─────────────────────┐     ┌─────────────────────┐
│ cuadros_importacion │     │     proveedores     │
└──────────┬──────────┘     └──────────┬──────────┘
           │ cuadro_id                 │ proveedor_id
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│requerimientos_mensu │◄────│        pims         │
└──────────┬──────────┘     └──────────┬──────────┘
           │                    ┌──────┼──────┬──────────┬──────────┬──────────┐
           ▼                    ▼      ▼      ▼          ▼          ▼          ▼
┌─────────────────────┐ ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│ requerimiento_items │ │pim_items ││sla_data  ││pim_docs  ││validacion││pim_track │
└──────────┬──────────┘ └──────────┘└──────────┘└──────────┘│_contrato ││_stages   │
           │                                                └────┬─────┘└────┬─────┘
           ▼                                                     ▼           ▼
     ┌──────────────────────────────────┐   ┌──────────────┐ ┌──────────────┐
     │     pim_requirement_items        │   │ diferencia   │ │pim_checklist │
     └──────────────────────────────────┘   │  contrato    │ │   _items     │
                     │                      └──────────────┘ └──────────────┘
                     ▼
            ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
            │    productos    │     │   work_orders   │     │  pim_activity   │
            └─────────────────┘     └─────────────────┘     │     _log        │
                                                            └─────────────────┘
                                    ┌─────────────────┐
                                    │  notificaciones │
                                    └─────────────────┘
```

---

## Funciones SQL (9)

### Funciones de Estadísticas

| Función | Tipo Retorno | Descripción |
|---------|--------------|-------------|
| `fn_pim_stats()` | TABLE | Estadísticas agregadas de PIMs |
| `fn_pim_status_distribution()` | TABLE | Conteo de PIMs por estado |
| `fn_pim_monthly_trend(months_back)` | TABLE | Tendencia mensual de PIMs y toneladas |
| `fn_sla_global_stats()` | JSONB | Promedios SLA con alertas por etapa |
| `fn_work_order_stats()` | TABLE | Estadísticas de OTs |

### Funciones Utilitarias

| Función | Tipo Retorno | Descripción |
|---------|--------------|-------------|
| `fn_generate_work_order_code()` | TEXT | Genera código secuencial OT-YYYY-NNN |
| `fn_calculate_due_date(priority)` | TIMESTAMPTZ | Calcula fecha límite según prioridad |
| `fn_requirement_pim_count(id)` | INTEGER | Cuenta PIMs asociados a un requerimiento |
| `fn_get_critical_pim()` | TABLE | Obtiene el primer PIM en estado crítico |

---

## Triggers

| Trigger | Tabla | Evento | Función |
|---------|-------|--------|---------|
| `trg_sla_auto_alerts` | `sla_data` | BEFORE INSERT/UPDATE | `trg_calculate_sla_alerts()` |

### trg_calculate_sla_alerts

Calcula automáticamente las alertas (verde/amarillo/rojo) para cada etapa del SLA.

**Lógica**:
- `verde`: días reales <= días estimados
- `amarillo`: días reales <= días estimados × 1.2
- `rojo`: días reales > días estimados × 1.2

---

## Tablas

### cuadros_importacion

Cuadros de importación (agrupaciones de productos).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `codigo` | text | No | - | Código único |
| `nombre` | text | No | - | Nombre del cuadro |
| `descripcion` | text | Sí | - | Descripción |
| `activo` | boolean | Sí | `true` | Estado activo |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |
| `updated_at` | timestamptz | Sí | `now()` | Fecha actualización |

---

### pims

Procesos de Importación.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `codigo` | text | No | - | Código único (PIM-YYYY-NNN) |
| `descripcion` | text | No | - | Descripción |
| `estado` | text | No | - | Estado del PIM |
| `tipo` | text | No | - | 'principal' o 'sub-pim' |
| `pim_padre_id` | text | Sí | - | FK → pims (si es sub-pim) |
| `cuadro_id` | text | No | - | FK → cuadros_importacion |
| `requerimiento_id` | text | No | - | FK → requerimientos_mensuales |
| `proveedor_id` | text | No | - | FK → proveedores |
| `proveedor_nombre` | text | Sí | - | Nombre desnormalizado |
| `molino_id` | uuid | Sí | - | FK → fabricas_molinos |
| `molino_nombre` | text | Sí | - | Nombre desnormalizado |
| `modalidad_pago` | text | No | - | Modalidad de pago |
| `dias_credito` | integer | Sí | - | Días de crédito |
| `porcentaje_anticipo` | numeric | Sí | - | % de anticipo |
| `condicion_precio` | text | Sí | - | Condición de precio (FOB, CIF, etc.) |
| `numero_contrato` | text | Sí | - | Número de contrato |
| `fecha_contrato` | timestamptz | Sí | - | Fecha del contrato |
| `fecha_embarque` | timestamptz | Sí | - | Fecha estimada de embarque |
| `archivo_contrato_fabrica` | text | Sí | - | URL contrato fábrica |
| `archivo_pim_excel` | text | Sí | - | URL Excel del PIM |
| `codigo_dhl` | text | Sí | - | Tracking DHL (legacy) |
| `dhl_tracking_code` | text | Sí | - | Código tracking DHL activo |
| `dhl_last_status` | text | Sí | - | Último estado DHL |
| `dhl_last_checked_at` | timestamptz | Sí | - | Última verificación DHL |
| `origen` | text | Sí | - | País/región de origen |
| `fabricas_origen` | text | Sí | - | Fábricas de origen |
| `notas_pago` | text | Sí | - | Notas de pago |
| `total_toneladas` | numeric | No | `0` | Total en toneladas |
| `total_usd` | numeric | No | `0` | Total en USD |
| `fecha_creacion` | timestamptz | Sí | `now()` | Fecha creación |
| `fecha_cierre` | timestamptz | Sí | - | Fecha de cierre |

---

### pim_items

Items/productos de un PIM.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims |
| `producto_id` | text | No | - | FK → productos |
| `codigo_producto` | text | No | - | Código del producto |
| `descripcion` | text | No | - | Descripción |
| `cantidad` | numeric | No | - | Cantidad pedida |
| `unidad` | text | No | - | Unidad de medida |
| `toneladas` | numeric | No | - | Peso en toneladas |
| `precio_unitario_usd` | numeric | No | - | Precio por unidad |
| `total_usd` | numeric | No | - | Total en USD |
| `cantidad_recibida` | numeric | Sí | `0` | Cantidad recibida |
| `molino_id` | uuid | Sí | - | FK → fabricas_molinos (override; si null, usa molino del PIM) |

---

### fabricas_molinos

Maestro de fábricas/molinos autorizados.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `codigo` | text | No | - | Código único (ej: RNAV, PGR) |
| `nombre` | text | No | - | Nombre o razón social |
| `pais` | text | No | - | País |
| `ciudad` | text | Sí | - | Ciudad |
| `activo` | boolean | No | `true` | Estado activo |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |
| `updated_at` | timestamptz | Sí | `now()` | Fecha actualización |

RLS habilitado con políticas de lectura, inserción, actualización y eliminación.

---

### pim_tracking_stages

Etapas de seguimiento de un PIM.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims |
| `stage_key` | text | No | - | Clave de etapa (contrato, financiero, etc.) |
| `status` | text | No | `'pendiente'` | pendiente/en_progreso/completado |
| `responsable` | text | Sí | - | Responsable de la etapa |
| `notas` | text | Sí | - | Notas de la etapa |
| `fecha_inicio` | timestamptz | Sí | - | Fecha inicio |
| `fecha_fin` | timestamptz | Sí | - | Fecha fin |
| `fecha_limite` | timestamptz | Sí | - | Fecha límite |

---

### pim_checklist_items

Items del checklist por etapa.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims |
| `stage_key` | text | No | - | Clave de etapa |
| `checklist_key` | text | No | - | Clave única del item |
| `texto` | text | No | - | Texto descriptivo |
| `critico` | boolean | Sí | `false` | Si es obligatorio para completar etapa |
| `completado` | boolean | Sí | `false` | Si está completado |
| `completado_por` | text | Sí | - | Quién lo completó |
| `completado_en` | timestamptz | Sí | - | Cuándo se completó |

---

### pim_activity_log

Historial de actividad de un PIM.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims |
| `stage_key` | text | Sí | - | Etapa asociada |
| `tipo` | text | No | - | Tipo: note, check, stage_change, split, dhl_update |
| `descripcion` | text | No | - | Descripción del evento |
| `usuario` | text | No | - | Usuario que realizó la acción |
| `metadata` | jsonb | Sí | - | Datos adicionales |
| `created_at` | timestamptz | Sí | `now()` | Fecha |

---

### pim_documentos

Documentos adjuntos a PIMs organizados por etapa.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims |
| `stage_key` | text | Sí | - | Etapa del documento |
| `tipo` | text | No | - | Categoría (BL, SWIFT, Certificado, etc.) |
| `nombre` | text | No | - | Nombre del archivo |
| `url` | text | No | - | URL en Storage |
| `subido_por` | text | No | - | Usuario que subió |
| `observaciones` | text | Sí | - | Observaciones |
| `version` | integer | Sí | `1` | Número de versión |
| `version_group` | text | Sí | - | Grupo de versiones |
| `fecha_subida` | timestamptz | Sí | `now()` | Fecha de subida |

---

### pim_requirement_items

Relación entre PIMs y items de requerimiento (consumo de kilos).

---

### productos

Catálogo de productos con campos extendidos para clasificación.

| Columnas destacadas | Descripción |
|---------------------|-------------|
| `codigo`, `descripcion` | Identificación |
| `categoria`, `sub_categoria` | Clasificación |
| `cuadro` | FK → cuadros_importacion.codigo |
| `linea`, `clasificacion`, `tipo_abc` | Clasificación avanzada |
| `espesor`, `ancho`, `peso`, `peso_compra` | Dimensiones |
| `cod_base_mp`, `cod_estadistico` | Códigos técnicos |

---

### proveedores

Proveedores y fábricas con contacto, país, tipo.

---

### requerimientos_mensuales / requerimiento_items

Requerimientos mensuales de importación con control de kilos consumidos/disponibles.

---

### sla_data

Datos de SLA por PIM con tiempos estimados/reales y alertas por etapa.

---

### validacion_contrato_pim / diferencia_contrato

Validaciones de contratos y diferencias detectadas.

---

### work_orders

Órdenes de trabajo de mantenimiento con código auto-generado, prioridad, SLA.

---

### notificaciones

Notificaciones del sistema con destinatario, tipo, prioridad, leído.

---

## Foreign Keys

| Tabla Origen | Columna | Tabla Destino | Columna |
|--------------|---------|---------------|---------|
| `pims` | `cuadro_id` | `cuadros_importacion` | `id` |
| `pims` | `proveedor_id` | `proveedores` | `id` |
| `pims` | `requerimiento_id` | `requerimientos_mensuales` | `id` |
| `pims` | `pim_padre_id` | `pims` | `id` |
| `pim_items` | `pim_id` | `pims` | `id` |
| `pim_items` | `producto_id` | `productos` | `id` |
| `pim_tracking_stages` | `pim_id` | `pims` | `id` |
| `pim_checklist_items` | `pim_id` | `pims` | `id` |
| `pim_activity_log` | `pim_id` | `pims` | `id` |
| `pim_documentos` | `pim_id` | `pims` | `id` |
| `pim_requirement_items` | `pim_id` | `pims` | `id` |
| `pim_requirement_items` | `producto_id` | `productos` | `id` |
| `pim_requirement_items` | `requirement_item_id` | `requerimiento_items` | `id` |
| `requerimiento_items` | `producto_id` | `productos` | `id` |
| `requerimiento_items` | `requerimiento_id` | `requerimientos_mensuales` | `id` |
| `requerimientos_mensuales` | `cuadro_id` | `cuadros_importacion` | `id` |
| `productos` | `cuadro` | `cuadros_importacion` | `codigo` |
| `sla_data` | `pim_id` | `pims` | `id` |
| `validacion_contrato_pim` | `pim_id` | `pims` | `id` |
| `diferencia_contrato` | `validacion_id` | `validacion_contrato_pim` | `id` |
| `notificaciones` | `pim_id` | `pims` | `id` |

---

## Storage

### Bucket: `pim-documentos`

Almacena documentos adjuntos a PIMs organizados por `{pim_id}/{stage_key}/{filename}`.

---

*Última actualización: Febrero 2026*
