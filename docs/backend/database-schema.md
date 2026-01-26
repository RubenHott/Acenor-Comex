# Esquema de Base de Datos

Base de datos PostgreSQL en Supabase con 13 tablas, 9 funciones SQL y 1 trigger.

## Diagrama de Relaciones

```
┌─────────────────────┐     ┌─────────────────────┐
│ cuadros_importacion │     │     proveedores     │
│        (1)          │     │         (8)         │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           │ cuadro_id                 │ proveedor_id
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│requerimientos_mensu │◄────│        pims         │
│        (9)          │     │         (6)         │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           │                    ┌──────┼──────┬──────────┬──────────┐
           ▼                    ▼      ▼      ▼          ▼          ▼
┌─────────────────────┐ ┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│ requerimiento_items │ │pim_items ││sla_data  ││pim_docs  ││validacion│
│        (10)         │ │   (4)    ││   (11)   ││   (3)    ││   (12)   │
└──────────┬──────────┘ └────┬─────┘└──────────┘└──────────┘└────┬─────┘
           │                 │                                    │
           │                 │                                    ▼
           ▼                 ▼                            ┌──────────────┐
     ┌──────────────────────────────────┐                │ diferencia   │
     │     pim_requirement_items        │                │  contrato    │
     │            (5)                   │                │     (2)      │
     └──────────────────────────────────┘                └──────────────┘
                    │
                    ▼
           ┌─────────────────┐     ┌─────────────────┐
           │    productos    │     │   work_orders   │
           │       (7)       │     │      (13)       │
           └─────────────────┘     └─────────────────┘

                                   ┌─────────────────┐
                                   │  notificaciones │
                                   │      (14)       │
                                   └─────────────────┘
```

---

## Funciones SQL

El sistema utiliza funciones PL/pgSQL para ejecutar cálculos en el servidor.

### Funciones de Estadísticas

| Función | Tipo Retorno | Descripción |
|---------|--------------|-------------|
| `fn_pim_stats()` | TABLE | Estadísticas agregadas de PIMs (total, activos, pendientes, alertas SLA, monto USD, toneladas) |
| `fn_pim_status_distribution()` | TABLE | Conteo de PIMs por estado |
| `fn_pim_monthly_trend(months_back)` | TABLE | Tendencia mensual de PIMs y toneladas |
| `fn_sla_global_stats()` | JSONB | Promedios SLA con alertas por etapa |
| `fn_work_order_stats()` | TABLE | Estadísticas de OTs (total, pendientes, en progreso, completadas, urgentes) |

### Funciones Utilitarias

| Función | Tipo Retorno | Descripción |
|---------|--------------|-------------|
| `fn_generate_work_order_code()` | TEXT | Genera código secuencial OT-YYYY-NNN |
| `fn_calculate_due_date(priority)` | TIMESTAMPTZ | Calcula fecha límite según prioridad |
| `fn_requirement_pim_count(id)` | INTEGER | Cuenta PIMs asociados a un requerimiento |
| `fn_get_critical_pim()` | TABLE | Obtiene el primer PIM en estado crítico |

### Ejemplo de Invocación

```typescript
// Desde Edge Function
const { data, error } = await supabase.rpc('fn_pim_stats');

// Resultado
{
  total_pims: 45,
  pims_activos: 12,
  pims_pendientes: 8,
  alertas_sla: 3,
  monto_total_usd: 2500000,
  toneladas_mes: 150
}
```

---

## Triggers

| Trigger | Tabla | Evento | Función |
|---------|-------|--------|---------|
| `trg_sla_auto_alerts` | `sla_data` | BEFORE INSERT/UPDATE | `trg_calculate_sla_alerts()` |

### trg_calculate_sla_alerts

Calcula automáticamente las alertas (verde/amarillo/rojo) para cada etapa del SLA cuando se insertan o actualizan datos.

**Lógica**:
- `verde`: días reales <= días estimados
- `amarillo`: días reales <= días estimados * 1.2
- `rojo`: días reales > días estimados * 1.2

---

## Tablas

### 1. cuadros_importacion

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

### 2. diferencia_contrato

Diferencias detectadas en validación de contratos.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `validacion_id` | text | No | - | FK → validacion_contrato_pim |
| `campo` | text | No | - | Nombre del campo |
| `valor_pim` | text | No | - | Valor en el PIM |
| `valor_contrato` | text | No | - | Valor en contrato |
| `coincide` | boolean | No | `false` | Si coinciden |
| `observacion` | text | Sí | - | Observaciones |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |

---

### 3. pim_documentos

Documentos adjuntos a PIMs.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims |
| `tipo` | text | No | - | Tipo de documento |
| `nombre` | text | No | - | Nombre del archivo |
| `url` | text | No | - | URL del documento |
| `subido_por` | text | No | - | Usuario que subió |
| `observaciones` | text | Sí | - | Observaciones |
| `fecha_subida` | timestamptz | Sí | `now()` | Fecha de subida |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |

---

### 4. pim_items

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
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |
| `updated_at` | timestamptz | Sí | `now()` | Fecha actualización |

---

### 5. pim_requirement_items

Relación entre PIMs y items de requerimiento (consumo).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims |
| `requirement_item_id` | text | No | - | FK → requerimiento_items |
| `producto_id` | text | No | - | FK → productos |
| `codigo_producto` | text | No | - | Código del producto |
| `descripcion` | text | No | - | Descripción |
| `kilos_consumidos` | numeric | No | - | Kilos que consume del req. |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |

---

### 6. pims

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
| `molino_id` | text | Sí | - | ID del molino/fábrica |
| `molino_nombre` | text | Sí | - | Nombre desnormalizado |
| `modalidad_pago` | text | No | - | Modalidad de pago |
| `dias_credito` | integer | Sí | - | Días de crédito |
| `porcentaje_anticipo` | numeric | Sí | - | % de anticipo |
| `numero_contrato` | text | Sí | - | Número de contrato |
| `fecha_contrato` | timestamptz | Sí | - | Fecha del contrato |
| `archivo_contrato_fabrica` | text | Sí | - | URL contrato fábrica |
| `archivo_pim_excel` | text | Sí | - | URL Excel del PIM |
| `codigo_dhl` | text | Sí | - | Tracking DHL |
| `total_toneladas` | numeric | No | `0` | Total en toneladas |
| `total_usd` | numeric | No | `0` | Total en USD |
| `fecha_creacion` | timestamptz | Sí | `now()` | Fecha creación |
| `fecha_cierre` | timestamptz | Sí | - | Fecha de cierre |
| `created_at` | timestamptz | Sí | `now()` | Metadato |
| `updated_at` | timestamptz | Sí | `now()` | Metadato |

---

### 7. productos

Catálogo de productos.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `codigo` | text | No | - | Código único |
| `descripcion` | text | No | - | Descripción |
| `categoria` | text | No | - | Categoría principal |
| `sub_categoria` | text | Sí | - | Subcategoría |
| `origen` | text | Sí | - | Origen del producto |
| `cuadro` | text | Sí | - | FK → cuadros_importacion |
| `unidad` | text | No | - | Unidad de medida |
| `ultimo_precio_usd` | numeric | Sí | - | Último precio |
| `ultima_fecha_importacion` | timestamptz | Sí | - | Última importación |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |
| `updated_at` | timestamptz | Sí | `now()` | Fecha actualización |

---

### 8. proveedores

Proveedores y fábricas.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `codigo` | text | No | - | Código único |
| `nombre` | text | No | - | Nombre |
| `pais` | text | No | - | País |
| `ciudad` | text | Sí | - | Ciudad |
| `contacto` | text | Sí | - | Persona de contacto |
| `email` | text | Sí | - | Email |
| `telefono` | text | Sí | - | Teléfono |
| `tipo_proveedor` | text | Sí | - | Fabricante/Trader/etc |
| `activo` | boolean | Sí | `true` | Estado activo |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |
| `updated_at` | timestamptz | Sí | `now()` | Fecha actualización |

---

### 9. requerimientos_mensuales

Requerimientos mensuales de importación.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `mes` | text | No | - | Mes (YYYY-MM) |
| `cuadro_id` | text | No | - | FK → cuadros_importacion |
| `estado` | text | No | - | Estado del req. |
| `creado_por` | text | No | - | Usuario creador |
| `total_kilos` | numeric | No | `0` | Total en kilos |
| `total_toneladas` | numeric | No | `0` | Total en toneladas |
| `total_usd` | numeric | No | `0` | Total en USD |
| `kilos_consumidos` | numeric | No | `0` | Kilos ya asignados a PIMs |
| `kilos_disponibles` | numeric | No | `0` | Kilos disponibles |
| `fecha_creacion` | timestamptz | Sí | `now()` | Fecha creación |
| `fecha_aprobacion` | timestamptz | Sí | - | Fecha aprobación |
| `created_at` | timestamptz | Sí | `now()` | Metadato |
| `updated_at` | timestamptz | Sí | `now()` | Metadato |

---

### 10. requerimiento_items

Items de un requerimiento mensual.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `requerimiento_id` | text | No | - | FK → requerimientos_mensuales |
| `producto_id` | text | No | - | FK → productos |
| `codigo_producto` | text | No | - | Código del producto |
| `descripcion` | text | No | - | Descripción |
| `tipo_material` | text | No | - | Tipo de material |
| `cantidad_requerida` | numeric | No | - | Cantidad total requerida |
| `unidad` | text | No | `'kg'` | Unidad de medida |
| `kilos_disponibles` | numeric | No | - | Kilos sin asignar |
| `kilos_consumidos` | numeric | No | `0` | Kilos asignados a PIMs |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |
| `updated_at` | timestamptz | Sí | `now()` | Fecha actualización |

---

### 11. sla_data

Datos de SLA por PIM.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims (unique) |
| `tiempo_negociacion_dias_estimados` | integer | No | - | Días estimados |
| `tiempo_negociacion_dias_reales` | integer | Sí | - | Días reales |
| `tiempo_negociacion_alerta` | text | Sí | - | verde/amarillo/rojo |
| `tiempo_contrato_*` | ... | ... | ... | (misma estructura) |
| `tiempo_produccion_*` | ... | ... | ... | (misma estructura) |
| `tiempo_transito_*` | ... | ... | ... | (misma estructura) |
| `tiempo_aduana_*` | ... | ... | ... | (misma estructura) |
| `tiempo_total_*` | ... | ... | ... | (misma estructura) |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |
| `updated_at` | timestamptz | Sí | `now()` | Fecha actualización |

---

### 12. validacion_contrato_pim

Validaciones de contratos por PIM.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `pim_id` | text | No | - | FK → pims (unique) |
| `estado` | text | No | - | Estado de validación |
| `validado_por` | text | Sí | - | Usuario validador |
| `fecha_validacion` | timestamptz | Sí | - | Fecha de validación |
| `observaciones` | text | Sí | - | Observaciones |
| `created_at` | timestamptz | Sí | `now()` | Fecha creación |
| `updated_at` | timestamptz | Sí | `now()` | Fecha actualización |

---

### 13. work_orders

Órdenes de trabajo de mantenimiento.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `codigo` | text | No | - | Código único (OT-YYYY-NNN) |
| `titulo` | text | No | - | Título de la OT |
| `descripcion` | text | No | - | Descripción detallada |
| `estado` | text | No | `'pendiente'` | Estado (pendiente/en_progreso/completada) |
| `prioridad` | text | No | `'media'` | Prioridad (baja/media/alta/critica) |
| `area` | text | No | - | Área de trabajo |
| `tipo_trabajo` | text | No | - | Tipo de trabajo |
| `solicitante` | text | No | - | Usuario solicitante |
| `tecnico_asignado` | text | Sí | - | Técnico asignado |
| `equipo_id` | text | Sí | - | ID del equipo |
| `fecha_creacion` | timestamptz | No | `now()` | Fecha creación |
| `fecha_limite` | timestamptz | No | - | Fecha límite |
| `fecha_inicio` | timestamptz | Sí | - | Fecha inicio real |
| `fecha_fin` | timestamptz | Sí | - | Fecha fin real |
| `observaciones` | text | Sí | - | Observaciones |
| `created_at` | timestamptz | Sí | `now()` | Metadato |
| `updated_at` | timestamptz | Sí | `now()` | Metadato |

---

### 14. notificaciones

Notificaciones del sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | text | No | - | PK |
| `destinatario_id` | text | No | - | ID del usuario destinatario |
| `tipo` | text | No | - | Tipo de notificación |
| `titulo` | text | No | - | Título |
| `mensaje` | text | No | - | Mensaje |
| `prioridad` | text | No | `'media'` | Prioridad |
| `pim_id` | text | Sí | - | FK → pims (opcional) |
| `leido` | boolean | No | `false` | Si fue leída |
| `fecha_creacion` | timestamptz | No | `now()` | Fecha creación |
| `created_at` | timestamptz | Sí | `now()` | Metadato |
| `updated_at` | timestamptz | Sí | `now()` | Metadato |

---

## Foreign Keys

| Tabla Origen | Columna | Tabla Destino | Columna |
|--------------|---------|---------------|---------|
| `diferencia_contrato` | `validacion_id` | `validacion_contrato_pim` | `id` |
| `pim_documentos` | `pim_id` | `pims` | `id` |
| `pim_items` | `pim_id` | `pims` | `id` |
| `pim_items` | `producto_id` | `productos` | `id` |
| `pim_requirement_items` | `pim_id` | `pims` | `id` |
| `pim_requirement_items` | `producto_id` | `productos` | `id` |
| `pim_requirement_items` | `requirement_item_id` | `requerimiento_items` | `id` |
| `pims` | `cuadro_id` | `cuadros_importacion` | `id` |
| `pims` | `pim_padre_id` | `pims` | `id` |
| `pims` | `proveedor_id` | `proveedores` | `id` |
| `pims` | `requerimiento_id` | `requerimientos_mensuales` | `id` |
| `productos` | `cuadro` | `cuadros_importacion` | `id` |
| `requerimiento_items` | `producto_id` | `productos` | `id` |
| `requerimiento_items` | `requerimiento_id` | `requerimientos_mensuales` | `id` |
| `requerimientos_mensuales` | `cuadro_id` | `cuadros_importacion` | `id` |
| `sla_data` | `pim_id` | `pims` | `id` |
| `validacion_contrato_pim` | `pim_id` | `pims` | `id` |
| `notificaciones` | `pim_id` | `pims` | `id` |

---

*Última actualización: Enero 2026*
