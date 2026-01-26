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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aprobadores_etapa: {
        Row: {
          creado_en: string | null
          departamento_id: string | null
          etapa_id: string
          id: string
          orden: number | null
          rol_requerido: Database["public"]["Enums"]["rol_app"] | null
          usuario_especifico_id: string | null
        }
        Insert: {
          creado_en?: string | null
          departamento_id?: string | null
          etapa_id: string
          id?: string
          orden?: number | null
          rol_requerido?: Database["public"]["Enums"]["rol_app"] | null
          usuario_especifico_id?: string | null
        }
        Update: {
          creado_en?: string | null
          departamento_id?: string | null
          etapa_id?: string
          id?: string
          orden?: number | null
          rol_requerido?: Database["public"]["Enums"]["rol_app"] | null
          usuario_especifico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aprobadores_etapa_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprobadores_etapa_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_flujo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprobadores_etapa_usuario_especifico_id_fkey"
            columns: ["usuario_especifico_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campos_flujo: {
        Row: {
          activo: boolean | null
          catalogo_id: string | null
          configuracion: Json | null
          creado_en: string | null
          etapa_id: string | null
          etiqueta: string
          id: string
          nombre: string
          orden: number | null
          placeholder: string | null
          plantilla_id: string
          requerido: boolean | null
          tipo: Database["public"]["Enums"]["tipo_campo"]
          valor_defecto: string | null
        }
        Insert: {
          activo?: boolean | null
          catalogo_id?: string | null
          configuracion?: Json | null
          creado_en?: string | null
          etapa_id?: string | null
          etiqueta: string
          id?: string
          nombre: string
          orden?: number | null
          placeholder?: string | null
          plantilla_id: string
          requerido?: boolean | null
          tipo?: Database["public"]["Enums"]["tipo_campo"]
          valor_defecto?: string | null
        }
        Update: {
          activo?: boolean | null
          catalogo_id?: string | null
          configuracion?: Json | null
          creado_en?: string | null
          etapa_id?: string | null
          etiqueta?: string
          id?: string
          nombre?: string
          orden?: number | null
          placeholder?: string | null
          plantilla_id?: string
          requerido?: boolean | null
          tipo?: Database["public"]["Enums"]["tipo_campo"]
          valor_defecto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campos_flujo_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campos_flujo_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_flujo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campos_flujo_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_flujo"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogos: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          codigo: string
          creado_en: string | null
          departamento_id: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          codigo: string
          creado_en?: string | null
          departamento_id?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          codigo?: string
          creado_en?: string | null
          departamento_id?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogos_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          codigo: string
          color: string | null
          creado_en: string | null
          icono: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          codigo: string
          color?: string | null
          creado_en?: string | null
          icono?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          codigo?: string
          color?: string | null
          creado_en?: string | null
          icono?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      departamentos_usuario: {
        Row: {
          creado_en: string | null
          departamento_id: string
          es_responsable: boolean | null
          id: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string | null
          departamento_id: string
          es_responsable?: boolean | null
          id?: string
          usuario_id: string
        }
        Update: {
          creado_en?: string | null
          departamento_id?: string
          es_responsable?: boolean | null
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departamentos_usuario_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departamentos_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      empleados: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          apellidos: string
          cargo: string | null
          creado_en: string | null
          departamento_id: string | null
          email: string | null
          id: string
          nombre: string
          rut: string
          subarea: string | null
          sucursal_id: string | null
          usuario_id: string | null
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          apellidos: string
          cargo?: string | null
          creado_en?: string | null
          departamento_id?: string | null
          email?: string | null
          id?: string
          nombre: string
          rut: string
          subarea?: string | null
          sucursal_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          apellidos?: string
          cargo?: string | null
          creado_en?: string | null
          departamento_id?: string | null
          email?: string | null
          id?: string
          nombre?: string
          rut?: string
          subarea?: string | null
          sucursal_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empleados_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empleados_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empleados_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_flujo: {
        Row: {
          color: string | null
          creado_en: string | null
          descripcion: string | null
          dias_limite: number | null
          es_final: boolean | null
          es_inicial: boolean | null
          id: string
          nombre: string
          orden: number
          permite_retroceso: boolean | null
          plantilla_id: string
        }
        Insert: {
          color?: string | null
          creado_en?: string | null
          descripcion?: string | null
          dias_limite?: number | null
          es_final?: boolean | null
          es_inicial?: boolean | null
          id?: string
          nombre: string
          orden?: number
          permite_retroceso?: boolean | null
          plantilla_id: string
        }
        Update: {
          color?: string | null
          creado_en?: string | null
          descripcion?: string | null
          dias_limite?: number | null
          es_final?: boolean | null
          es_inicial?: boolean | null
          id?: string
          nombre?: string
          orden?: number
          permite_retroceso?: boolean | null
          plantilla_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_flujo_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_flujo"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_solicitud: {
        Row: {
          accion: string
          comentario: string | null
          creado_en: string | null
          datos_cambios: Json | null
          estado_anterior:
            | Database["public"]["Enums"]["estado_solicitud"]
            | null
          estado_nuevo: Database["public"]["Enums"]["estado_solicitud"] | null
          etapa_anterior_id: string | null
          etapa_nueva_id: string | null
          id: string
          solicitud_id: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          comentario?: string | null
          creado_en?: string | null
          datos_cambios?: Json | null
          estado_anterior?:
            | Database["public"]["Enums"]["estado_solicitud"]
            | null
          estado_nuevo?: Database["public"]["Enums"]["estado_solicitud"] | null
          etapa_anterior_id?: string | null
          etapa_nueva_id?: string | null
          id?: string
          solicitud_id: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          comentario?: string | null
          creado_en?: string | null
          datos_cambios?: Json | null
          estado_anterior?:
            | Database["public"]["Enums"]["estado_solicitud"]
            | null
          estado_nuevo?: Database["public"]["Enums"]["estado_solicitud"] | null
          etapa_anterior_id?: string | null
          etapa_nueva_id?: string | null
          id?: string
          solicitud_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_solicitud_etapa_anterior_id_fkey"
            columns: ["etapa_anterior_id"]
            isOneToOne: false
            referencedRelation: "etapas_flujo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_solicitud_etapa_nueva_id_fkey"
            columns: ["etapa_nueva_id"]
            isOneToOne: false
            referencedRelation: "etapas_flujo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_solicitud_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_solicitud_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitaciones_pendientes: {
        Row: {
          creado_en: string | null
          email: string
          expira_en: string | null
          id: string
          invitado_por: string | null
          nombre_completo: string | null
          rol: Database["public"]["Enums"]["rol_app"]
        }
        Insert: {
          creado_en?: string | null
          email: string
          expira_en?: string | null
          id?: string
          invitado_por?: string | null
          nombre_completo?: string | null
          rol?: Database["public"]["Enums"]["rol_app"]
        }
        Update: {
          creado_en?: string | null
          email?: string
          expira_en?: string | null
          id?: string
          invitado_por?: string | null
          nombre_completo?: string | null
          rol?: Database["public"]["Enums"]["rol_app"]
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_pendientes_invitado_por_fkey"
            columns: ["invitado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items_catalogo: {
        Row: {
          activo: boolean | null
          catalogo_id: string
          categoria: string | null
          creado_en: string | null
          descripcion: string | null
          etiqueta: string
          id: string
          metadatos: Json | null
          orden: number | null
          prioridad_sugerida:
            | Database["public"]["Enums"]["prioridad_solicitud"]
            | null
          tiempo_resolucion_estimado: number | null
          valor: string
        }
        Insert: {
          activo?: boolean | null
          catalogo_id: string
          categoria?: string | null
          creado_en?: string | null
          descripcion?: string | null
          etiqueta: string
          id?: string
          metadatos?: Json | null
          orden?: number | null
          prioridad_sugerida?:
            | Database["public"]["Enums"]["prioridad_solicitud"]
            | null
          tiempo_resolucion_estimado?: number | null
          valor: string
        }
        Update: {
          activo?: boolean | null
          catalogo_id?: string
          categoria?: string | null
          creado_en?: string | null
          descripcion?: string | null
          etiqueta?: string
          id?: string
          metadatos?: Json | null
          orden?: number | null
          prioridad_sugerida?:
            | Database["public"]["Enums"]["prioridad_solicitud"]
            | null
          tiempo_resolucion_estimado?: number | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_catalogo_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          creado_en: string | null
          datos: Json | null
          id: string
          leida: boolean | null
          mensaje: string
          solicitud_id: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string | null
          datos?: Json | null
          id?: string
          leida?: boolean | null
          mensaje: string
          solicitud_id?: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          creado_en?: string | null
          datos?: Json | null
          id?: string
          leida?: boolean | null
          mensaje?: string
          solicitud_id?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opciones_campo: {
        Row: {
          activo: boolean | null
          campo_id: string
          etiqueta: string
          id: string
          orden: number | null
          valor: string
        }
        Insert: {
          activo?: boolean | null
          campo_id: string
          etiqueta: string
          id?: string
          orden?: number | null
          valor: string
        }
        Update: {
          activo?: boolean | null
          campo_id?: string
          etiqueta?: string
          id?: string
          orden?: number | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "opciones_campo_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos_flujo"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          avatar_url: string | null
          creado_en: string | null
          email: string
          id: string
          nombre_completo: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          avatar_url?: string | null
          creado_en?: string | null
          email: string
          id: string
          nombre_completo?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          avatar_url?: string | null
          creado_en?: string | null
          email?: string
          id?: string
          nombre_completo?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      plantillas_flujo: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          color: string | null
          creado_en: string | null
          creado_por: string | null
          departamento_id: string
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          version: number | null
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          color?: string | null
          creado_en?: string | null
          creado_por?: string | null
          departamento_id: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          version?: number | null
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          color?: string | null
          creado_en?: string | null
          creado_por?: string | null
          departamento_id?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_flujo_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plantillas_flujo_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_notificacion: {
        Row: {
          actualizado_en: string | null
          creado_en: string | null
          email_aprobacion: boolean | null
          email_asignacion: boolean | null
          email_comentario: boolean | null
          email_nueva_solicitud: boolean | null
          email_rechazo: boolean | null
          email_vencimiento: boolean | null
          id: string
          inapp_aprobacion: boolean | null
          inapp_asignacion: boolean | null
          inapp_comentario: boolean | null
          inapp_nueva_solicitud: boolean | null
          inapp_rechazo: boolean | null
          inapp_vencimiento: boolean | null
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string | null
          creado_en?: string | null
          email_aprobacion?: boolean | null
          email_asignacion?: boolean | null
          email_comentario?: boolean | null
          email_nueva_solicitud?: boolean | null
          email_rechazo?: boolean | null
          email_vencimiento?: boolean | null
          id?: string
          inapp_aprobacion?: boolean | null
          inapp_asignacion?: boolean | null
          inapp_comentario?: boolean | null
          inapp_nueva_solicitud?: boolean | null
          inapp_rechazo?: boolean | null
          inapp_vencimiento?: boolean | null
          usuario_id: string
        }
        Update: {
          actualizado_en?: string | null
          creado_en?: string | null
          email_aprobacion?: boolean | null
          email_asignacion?: boolean | null
          email_comentario?: boolean | null
          email_nueva_solicitud?: boolean | null
          email_rechazo?: boolean | null
          email_vencimiento?: boolean | null
          id?: string
          inapp_aprobacion?: boolean | null
          inapp_asignacion?: boolean | null
          inapp_comentario?: boolean | null
          inapp_nueva_solicitud?: boolean | null
          inapp_rechazo?: boolean | null
          inapp_vencimiento?: boolean | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_notificacion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_usuario: {
        Row: {
          creado_en: string | null
          id: string
          rol: Database["public"]["Enums"]["rol_app"]
          usuario_id: string
        }
        Insert: {
          creado_en?: string | null
          id?: string
          rol?: Database["public"]["Enums"]["rol_app"]
          usuario_id: string
        }
        Update: {
          creado_en?: string | null
          id?: string
          rol?: Database["public"]["Enums"]["rol_app"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes: {
        Row: {
          actualizado_en: string | null
          asignado_a_id: string | null
          creado_en: string | null
          datos_adicionales: Json | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_solicitud"] | null
          etapa_actual_id: string | null
          fecha_limite: string | null
          id: string
          numero_solicitud: string | null
          plantilla_id: string
          prioridad: Database["public"]["Enums"]["prioridad_solicitud"] | null
          solicitante_id: string
          titulo: string
        }
        Insert: {
          actualizado_en?: string | null
          asignado_a_id?: string | null
          creado_en?: string | null
          datos_adicionales?: Json | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_solicitud"] | null
          etapa_actual_id?: string | null
          fecha_limite?: string | null
          id?: string
          numero_solicitud?: string | null
          plantilla_id: string
          prioridad?: Database["public"]["Enums"]["prioridad_solicitud"] | null
          solicitante_id: string
          titulo: string
        }
        Update: {
          actualizado_en?: string | null
          asignado_a_id?: string | null
          creado_en?: string | null
          datos_adicionales?: Json | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_solicitud"] | null
          etapa_actual_id?: string | null
          fecha_limite?: string | null
          id?: string
          numero_solicitud?: string | null
          plantilla_id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_solicitud"] | null
          solicitante_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_asignado_a_id_fkey"
            columns: ["asignado_a_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_etapa_actual_id_fkey"
            columns: ["etapa_actual_id"]
            isOneToOne: false
            referencedRelation: "etapas_flujo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_flujo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sucursales: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          ciudad: string | null
          creado_en: string | null
          direccion: string | null
          id: string
          nombre: string
          region: string | null
          tipo: string
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          ciudad?: string | null
          creado_en?: string | null
          direccion?: string | null
          id?: string
          nombre: string
          region?: string | null
          tipo: string
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          ciudad?: string | null
          creado_en?: string | null
          direccion?: string | null
          id?: string
          nombre?: string
          region?: string | null
          tipo?: string
        }
        Relationships: []
      }
      valores_campos: {
        Row: {
          actualizado_en: string | null
          campo_id: string
          id: string
          solicitud_id: string
          valor: string | null
          valor_json: Json | null
        }
        Insert: {
          actualizado_en?: string | null
          campo_id: string
          id?: string
          solicitud_id: string
          valor?: string | null
          valor_json?: Json | null
        }
        Update: {
          actualizado_en?: string | null
          campo_id?: string
          id?: string
          solicitud_id?: string
          valor?: string | null
          valor_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "valores_campos_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos_flujo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valores_campos_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_responsable_departamento: {
        Args: { _departamento_id: string; _usuario_id: string }
        Returns: boolean
      }
      obtener_departamentos_usuario: {
        Args: { _usuario_id: string }
        Returns: string[]
      }
      obtener_preferencias_notificacion: {
        Args: { _usuario_id: string }
        Returns: {
          email_aprobacion: boolean
          email_asignacion: boolean
          email_comentario: boolean
          email_nueva_solicitud: boolean
          email_rechazo: boolean
          email_vencimiento: boolean
          inapp_aprobacion: boolean
          inapp_asignacion: boolean
          inapp_comentario: boolean
          inapp_nueva_solicitud: boolean
          inapp_rechazo: boolean
          inapp_vencimiento: boolean
        }[]
      }
      tiene_rol: {
        Args: {
          _rol: Database["public"]["Enums"]["rol_app"]
          _usuario_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      estado_solicitud:
        | "borrador"
        | "pendiente"
        | "en_proceso"
        | "aprobada"
        | "rechazada"
        | "cancelada"
      prioridad_solicitud: "baja" | "media" | "alta" | "urgente"
      rol_app: "admin" | "supervisor" | "usuario"
      tipo_campo:
        | "texto"
        | "numero"
        | "fecha"
        | "select"
        | "checkbox"
        | "archivo"
        | "textarea"
        | "email"
        | "telefono"
        | "moneda"
        | "catalogo"
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
    Enums: {
      estado_solicitud: [
        "borrador",
        "pendiente",
        "en_proceso",
        "aprobada",
        "rechazada",
        "cancelada",
      ],
      prioridad_solicitud: ["baja", "media", "alta", "urgente"],
      rol_app: ["admin", "supervisor", "usuario"],
      tipo_campo: [
        "texto",
        "numero",
        "fecha",
        "select",
        "checkbox",
        "archivo",
        "textarea",
        "email",
        "telefono",
        "moneda",
        "catalogo",
      ],
    },
  },
} as const
