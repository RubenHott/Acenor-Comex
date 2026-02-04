export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cuadros_importacion: {
        Row: {
          activo: boolean | null
          codigo: string
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          id: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      diferencia_contrato: {
        Row: {
          campo: string
          coincide: boolean
          created_at: string | null
          id: string
          observacion: string | null
          validacion_id: string
          valor_contrato: string
          valor_pim: string
        }
        Insert: {
          campo: string
          coincide?: boolean
          created_at?: string | null
          id: string
          observacion?: string | null
          validacion_id: string
          valor_contrato: string
          valor_pim: string
        }
        Update: {
          campo?: string
          coincide?: boolean
          created_at?: string | null
          id?: string
          observacion?: string | null
          validacion_id?: string
          valor_contrato?: string
          valor_pim?: string
        }
        Relationships: [
          {
            foreignKeyName: "diferencia_contrato_validacion_id_fkey"
            columns: ["validacion_id"]
            isOneToOne: false
            referencedRelation: "validacion_contrato_pim"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string | null
          destinatario_id: string
          fecha_creacion: string
          id: string
          leido: boolean
          mensaje: string
          pim_id: string | null
          prioridad: string
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          destinatario_id: string
          fecha_creacion?: string
          id: string
          leido?: boolean
          mensaje: string
          pim_id?: string | null
          prioridad?: string
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          destinatario_id?: string
          fecha_creacion?: string
          id?: string
          leido?: boolean
          mensaje?: string
          pim_id?: string | null
          prioridad?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_pim_id_fkey"
            columns: ["pim_id"]
            isOneToOne: false
            referencedRelation: "pims"
            referencedColumns: ["id"]
          },
        ]
      }
      pim_documentos: {
        Row: {
          created_at: string | null
          fecha_subida: string | null
          id: string
          nombre: string
          observaciones: string | null
          pim_id: string
          subido_por: string
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string | null
          fecha_subida?: string | null
          id: string
          nombre: string
          observaciones?: string | null
          pim_id: string
          subido_por: string
          tipo: string
          url: string
        }
        Update: {
          created_at?: string | null
          fecha_subida?: string | null
          id?: string
          nombre?: string
          observaciones?: string | null
          pim_id?: string
          subido_por?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pim_documentos_pim_id_fkey"
            columns: ["pim_id"]
            isOneToOne: false
            referencedRelation: "pims"
            referencedColumns: ["id"]
          },
        ]
      }
      pim_items: {
        Row: {
          cantidad: number
          cantidad_recibida: number | null
          codigo_producto: string
          created_at: string | null
          descripcion: string
          id: string
          pim_id: string
          precio_unitario_usd: number
          producto_id: string
          toneladas: number
          total_usd: number
          unidad: string
          updated_at: string | null
        }
        Insert: {
          cantidad: number
          cantidad_recibida?: number | null
          codigo_producto: string
          created_at?: string | null
          descripcion: string
          id: string
          pim_id: string
          precio_unitario_usd: number
          producto_id: string
          toneladas: number
          total_usd: number
          unidad: string
          updated_at?: string | null
        }
        Update: {
          cantidad?: number
          cantidad_recibida?: number | null
          codigo_producto?: string
          created_at?: string | null
          descripcion?: string
          id?: string
          pim_id?: string
          precio_unitario_usd?: number
          producto_id?: string
          toneladas?: number
          total_usd?: number
          unidad?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pim_items_pim_id_fkey"
            columns: ["pim_id"]
            isOneToOne: false
            referencedRelation: "pims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pim_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      pim_requirement_items: {
        Row: {
          codigo_producto: string
          created_at: string | null
          descripcion: string
          id: string
          kilos_consumidos: number
          pim_id: string
          producto_id: string
          requirement_item_id: string
        }
        Insert: {
          codigo_producto: string
          created_at?: string | null
          descripcion: string
          id: string
          kilos_consumidos: number
          pim_id: string
          producto_id: string
          requirement_item_id: string
        }
        Update: {
          codigo_producto?: string
          created_at?: string | null
          descripcion?: string
          id?: string
          kilos_consumidos?: number
          pim_id?: string
          producto_id?: string
          requirement_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pim_requirement_items_pim_id_fkey"
            columns: ["pim_id"]
            isOneToOne: false
            referencedRelation: "pims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pim_requirement_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pim_requirement_items_requirement_item_id_fkey"
            columns: ["requirement_item_id"]
            isOneToOne: false
            referencedRelation: "requerimiento_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pims: {
        Row: {
          archivo_contrato_fabrica: string | null
          archivo_pim_excel: string | null
          codigo: string
          codigo_dhl: string | null
          created_at: string | null
          cuadro_id: string
          descripcion: string
          dias_credito: number | null
          estado: string
          fecha_cierre: string | null
          fecha_contrato: string | null
          fecha_creacion: string | null
          id: string
          modalidad_pago: string
          molino_id: string | null
          molino_nombre: string | null
          numero_contrato: string | null
          pim_padre_id: string | null
          porcentaje_anticipo: number | null
          proveedor_id: string
          proveedor_nombre: string | null
          requerimiento_id: string
          tipo: string
          total_toneladas: number
          total_usd: number
          updated_at: string | null
        }
        Insert: {
          archivo_contrato_fabrica?: string | null
          archivo_pim_excel?: string | null
          codigo: string
          codigo_dhl?: string | null
          created_at?: string | null
          cuadro_id: string
          descripcion: string
          dias_credito?: number | null
          estado: string
          fecha_cierre?: string | null
          fecha_contrato?: string | null
          fecha_creacion?: string | null
          id: string
          modalidad_pago: string
          molino_id?: string | null
          molino_nombre?: string | null
          numero_contrato?: string | null
          pim_padre_id?: string | null
          porcentaje_anticipo?: number | null
          proveedor_id: string
          proveedor_nombre?: string | null
          requerimiento_id: string
          tipo: string
          total_toneladas?: number
          total_usd?: number
          updated_at?: string | null
        }
        Update: {
          archivo_contrato_fabrica?: string | null
          archivo_pim_excel?: string | null
          codigo?: string
          codigo_dhl?: string | null
          created_at?: string | null
          cuadro_id?: string
          descripcion?: string
          dias_credito?: number | null
          estado?: string
          fecha_cierre?: string | null
          fecha_contrato?: string | null
          fecha_creacion?: string | null
          id?: string
          modalidad_pago?: string
          molino_id?: string | null
          molino_nombre?: string | null
          numero_contrato?: string | null
          pim_padre_id?: string | null
          porcentaje_anticipo?: number | null
          proveedor_id?: string
          proveedor_nombre?: string | null
          requerimiento_id?: string
          tipo?: string
          total_toneladas?: number
          total_usd?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pims_cuadro_id_fkey"
            columns: ["cuadro_id"]
            isOneToOne: false
            referencedRelation: "cuadros_importacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pims_pim_padre_id_fkey"
            columns: ["pim_padre_id"]
            isOneToOne: false
            referencedRelation: "pims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pims_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pims_requerimiento_id_fkey"
            columns: ["requerimiento_id"]
            isOneToOne: false
            referencedRelation: "requerimientos_mensuales"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          ancho: number | null
          categoria: string
          clasificacion: string | null
          cod_base_mp: string | null
          cod_estadistico: string | null
          codigo: string
          created_at: string | null
          cuadro: string | null
          descripcion: string
          espesor: number | null
          id: string
          linea: string | null
          origen: string | null
          peso: number | null
          peso_compra: number | null
          sub_categoria: string | null
          tipo_abc: string | null
          ultima_fecha_importacion: string | null
          ultimo_precio_usd: number | null
          unidad: string
          updated_at: string | null
        }
        Insert: {
          ancho?: number | null
          categoria: string
          clasificacion?: string | null
          cod_base_mp?: string | null
          cod_estadistico?: string | null
          codigo: string
          created_at?: string | null
          cuadro?: string | null
          descripcion: string
          espesor?: number | null
          id: string
          linea?: string | null
          origen?: string | null
          peso?: number | null
          peso_compra?: number | null
          sub_categoria?: string | null
          tipo_abc?: string | null
          ultima_fecha_importacion?: string | null
          ultimo_precio_usd?: number | null
          unidad: string
          updated_at?: string | null
        }
        Update: {
          ancho?: number | null
          categoria?: string
          clasificacion?: string | null
          cod_base_mp?: string | null
          cod_estadistico?: string | null
          codigo?: string
          created_at?: string | null
          cuadro?: string | null
          descripcion?: string
          espesor?: number | null
          id?: string
          linea?: string | null
          origen?: string | null
          peso?: number | null
          peso_compra?: number | null
          sub_categoria?: string | null
          tipo_abc?: string | null
          ultima_fecha_importacion?: string | null
          ultimo_precio_usd?: number | null
          unidad?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_cuadro_fkey"
            columns: ["cuadro"]
            isOneToOne: false
            referencedRelation: "cuadros_importacion"
            referencedColumns: ["codigo"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean | null
          ciudad: string | null
          codigo: string
          contacto: string | null
          created_at: string | null
          email: string | null
          id: string
          nombre: string
          pais: string
          telefono: string | null
          tipo_proveedor: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          ciudad?: string | null
          codigo: string
          contacto?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          nombre: string
          pais: string
          telefono?: string | null
          tipo_proveedor?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          ciudad?: string | null
          codigo?: string
          contacto?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string
          pais?: string
          telefono?: string | null
          tipo_proveedor?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      requerimiento_items: {
        Row: {
          cantidad_requerida: number
          codigo_producto: string
          created_at: string | null
          descripcion: string
          id: string
          kilos_consumidos: number
          kilos_disponibles: number
          precio_unitario_usd: number | null
          producto_id: string
          requerimiento_id: string
          tipo_material: string
          total_usd: number | null
          unidad: string
          updated_at: string | null
        }
        Insert: {
          cantidad_requerida: number
          codigo_producto: string
          created_at?: string | null
          descripcion: string
          id: string
          kilos_consumidos?: number
          kilos_disponibles: number
          precio_unitario_usd?: number | null
          producto_id: string
          requerimiento_id: string
          tipo_material: string
          total_usd?: number | null
          unidad?: string
          updated_at?: string | null
        }
        Update: {
          cantidad_requerida?: number
          codigo_producto?: string
          created_at?: string | null
          descripcion?: string
          id?: string
          kilos_consumidos?: number
          kilos_disponibles?: number
          precio_unitario_usd?: number | null
          producto_id?: string
          requerimiento_id?: string
          tipo_material?: string
          total_usd?: number | null
          unidad?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requerimiento_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requerimiento_items_requerimiento_id_fkey"
            columns: ["requerimiento_id"]
            isOneToOne: false
            referencedRelation: "requerimientos_mensuales"
            referencedColumns: ["id"]
          },
        ]
      }
      requerimientos_mensuales: {
        Row: {
          creado_por: string
          created_at: string | null
          cuadro_id: string
          estado: string
          fecha_aprobacion: string | null
          fecha_creacion: string | null
          id: string
          kilos_consumidos: number
          kilos_disponibles: number
          mes: string
          observaciones: string | null
          total_kilos: number
          total_toneladas: number
          total_usd: number
          updated_at: string | null
        }
        Insert: {
          creado_por: string
          created_at?: string | null
          cuadro_id: string
          estado: string
          fecha_aprobacion?: string | null
          fecha_creacion?: string | null
          id: string
          kilos_consumidos?: number
          kilos_disponibles?: number
          mes: string
          observaciones?: string | null
          total_kilos?: number
          total_toneladas?: number
          total_usd?: number
          updated_at?: string | null
        }
        Update: {
          creado_por?: string
          created_at?: string | null
          cuadro_id?: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_creacion?: string | null
          id?: string
          kilos_consumidos?: number
          kilos_disponibles?: number
          mes?: string
          observaciones?: string | null
          total_kilos?: number
          total_toneladas?: number
          total_usd?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requerimientos_mensuales_cuadro_id_fkey"
            columns: ["cuadro_id"]
            isOneToOne: false
            referencedRelation: "cuadros_importacion"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_data: {
        Row: {
          created_at: string | null
          id: string
          pim_id: string
          tiempo_aduana_alerta: string | null
          tiempo_aduana_dias_estimados: number
          tiempo_aduana_dias_reales: number | null
          tiempo_aduana_fecha_fin: string | null
          tiempo_aduana_fecha_inicio: string | null
          tiempo_apertura_pago_alerta: string | null
          tiempo_apertura_pago_dias_estimados: number
          tiempo_apertura_pago_dias_reales: number | null
          tiempo_apertura_pago_fecha_fin: string | null
          tiempo_apertura_pago_fecha_inicio: string | null
          tiempo_contrato_alerta: string | null
          tiempo_contrato_dias_estimados: number
          tiempo_contrato_dias_reales: number | null
          tiempo_contrato_fecha_fin: string | null
          tiempo_contrato_fecha_inicio: string | null
          tiempo_negociacion_alerta: string | null
          tiempo_negociacion_dias_estimados: number
          tiempo_negociacion_dias_reales: number | null
          tiempo_negociacion_fecha_fin: string | null
          tiempo_negociacion_fecha_inicio: string | null
          tiempo_produccion_alerta: string | null
          tiempo_produccion_dias_estimados: number
          tiempo_produccion_dias_reales: number | null
          tiempo_produccion_fecha_fin: string | null
          tiempo_produccion_fecha_inicio: string | null
          tiempo_total_alerta: string | null
          tiempo_total_dias_estimados: number
          tiempo_total_dias_reales: number | null
          tiempo_total_fecha_fin: string | null
          tiempo_total_fecha_inicio: string | null
          tiempo_transito_alerta: string | null
          tiempo_transito_dias_estimados: number
          tiempo_transito_dias_reales: number | null
          tiempo_transito_fecha_fin: string | null
          tiempo_transito_fecha_inicio: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          pim_id: string
          tiempo_aduana_alerta?: string | null
          tiempo_aduana_dias_estimados: number
          tiempo_aduana_dias_reales?: number | null
          tiempo_aduana_fecha_fin?: string | null
          tiempo_aduana_fecha_inicio?: string | null
          tiempo_apertura_pago_alerta?: string | null
          tiempo_apertura_pago_dias_estimados: number
          tiempo_apertura_pago_dias_reales?: number | null
          tiempo_apertura_pago_fecha_fin?: string | null
          tiempo_apertura_pago_fecha_inicio?: string | null
          tiempo_contrato_alerta?: string | null
          tiempo_contrato_dias_estimados: number
          tiempo_contrato_dias_reales?: number | null
          tiempo_contrato_fecha_fin?: string | null
          tiempo_contrato_fecha_inicio?: string | null
          tiempo_negociacion_alerta?: string | null
          tiempo_negociacion_dias_estimados: number
          tiempo_negociacion_dias_reales?: number | null
          tiempo_negociacion_fecha_fin?: string | null
          tiempo_negociacion_fecha_inicio?: string | null
          tiempo_produccion_alerta?: string | null
          tiempo_produccion_dias_estimados: number
          tiempo_produccion_dias_reales?: number | null
          tiempo_produccion_fecha_fin?: string | null
          tiempo_produccion_fecha_inicio?: string | null
          tiempo_total_alerta?: string | null
          tiempo_total_dias_estimados: number
          tiempo_total_dias_reales?: number | null
          tiempo_total_fecha_fin?: string | null
          tiempo_total_fecha_inicio?: string | null
          tiempo_transito_alerta?: string | null
          tiempo_transito_dias_estimados: number
          tiempo_transito_dias_reales?: number | null
          tiempo_transito_fecha_fin?: string | null
          tiempo_transito_fecha_inicio?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pim_id?: string
          tiempo_aduana_alerta?: string | null
          tiempo_aduana_dias_estimados?: number
          tiempo_aduana_dias_reales?: number | null
          tiempo_aduana_fecha_fin?: string | null
          tiempo_aduana_fecha_inicio?: string | null
          tiempo_apertura_pago_alerta?: string | null
          tiempo_apertura_pago_dias_estimados?: number
          tiempo_apertura_pago_dias_reales?: number | null
          tiempo_apertura_pago_fecha_fin?: string | null
          tiempo_apertura_pago_fecha_inicio?: string | null
          tiempo_contrato_alerta?: string | null
          tiempo_contrato_dias_estimados?: number
          tiempo_contrato_dias_reales?: number | null
          tiempo_contrato_fecha_fin?: string | null
          tiempo_contrato_fecha_inicio?: string | null
          tiempo_negociacion_alerta?: string | null
          tiempo_negociacion_dias_estimados?: number
          tiempo_negociacion_dias_reales?: number | null
          tiempo_negociacion_fecha_fin?: string | null
          tiempo_negociacion_fecha_inicio?: string | null
          tiempo_produccion_alerta?: string | null
          tiempo_produccion_dias_estimados?: number
          tiempo_produccion_dias_reales?: number | null
          tiempo_produccion_fecha_fin?: string | null
          tiempo_produccion_fecha_inicio?: string | null
          tiempo_total_alerta?: string | null
          tiempo_total_dias_estimados?: number
          tiempo_total_dias_reales?: number | null
          tiempo_total_fecha_fin?: string | null
          tiempo_total_fecha_inicio?: string | null
          tiempo_transito_alerta?: string | null
          tiempo_transito_dias_estimados?: number
          tiempo_transito_dias_reales?: number | null
          tiempo_transito_fecha_fin?: string | null
          tiempo_transito_fecha_inicio?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_data_pim_id_fkey"
            columns: ["pim_id"]
            isOneToOne: true
            referencedRelation: "pims"
            referencedColumns: ["id"]
          },
        ]
      }
      validacion_contrato_pim: {
        Row: {
          created_at: string | null
          estado: string
          fecha_validacion: string | null
          id: string
          observaciones: string | null
          pim_id: string
          updated_at: string | null
          validado_por: string | null
        }
        Insert: {
          created_at?: string | null
          estado: string
          fecha_validacion?: string | null
          id: string
          observaciones?: string | null
          pim_id: string
          updated_at?: string | null
          validado_por?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string
          fecha_validacion?: string | null
          id?: string
          observaciones?: string | null
          pim_id?: string
          updated_at?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validacion_contrato_pim_pim_id_fkey"
            columns: ["pim_id"]
            isOneToOne: true
            referencedRelation: "pims"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          area: string
          codigo: string
          created_at: string | null
          descripcion: string
          equipo_id: string | null
          estado: string
          fecha_creacion: string
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_limite: string
          id: string
          observaciones: string | null
          prioridad: string
          solicitante: string
          tecnico_asignado: string | null
          tipo_trabajo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          area: string
          codigo: string
          created_at?: string | null
          descripcion: string
          equipo_id?: string | null
          estado?: string
          fecha_creacion?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_limite: string
          id?: string
          observaciones?: string | null
          prioridad?: string
          solicitante: string
          tecnico_asignado?: string | null
          tipo_trabajo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          area?: string
          codigo?: string
          created_at?: string | null
          descripcion?: string
          equipo_id?: string | null
          estado?: string
          fecha_creacion?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_limite?: string
          id?: string
          observaciones?: string | null
          prioridad?: string
          solicitante?: string
          tecnico_asignado?: string | null
          tipo_trabajo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_calculate_due_date: { Args: { priority: string }; Returns: string }
      fn_generate_work_order_code: { Args: never; Returns: string }
      fn_get_critical_pim: {
        Args: never
        Returns: {
          codigo: string
          descripcion: string
          estado: string
          id: string
        }[]
      }
      fn_pim_monthly_trend: {
        Args: { months_back?: number }
        Returns: {
          anio: number
          mes: string
          mes_orden: string
          total_pims: number
          total_toneladas: number
        }[]
      }
      fn_pim_stats: {
        Args: never
        Returns: {
          alertas_sla: number
          monto_total_usd: number
          pims_activos: number
          pims_pendientes: number
          toneladas_mes: number
          total_pims: number
        }[]
      }
      fn_pim_status_distribution: {
        Args: never
        Returns: {
          cantidad: number
          estado: string
        }[]
      }
      fn_requirement_pim_count: {
        Args: { requirement_id: string }
        Returns: number
      }
      fn_sla_global_stats: { Args: never; Returns: Json }
      fn_work_order_stats: {
        Args: never
        Returns: {
          completadas: number
          en_progreso: number
          pendientes: number
          total: number
          urgentes: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
