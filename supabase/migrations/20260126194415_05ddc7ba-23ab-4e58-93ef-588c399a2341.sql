-- Create notificaciones table
CREATE TABLE public.notificaciones (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('alerta_sla', 'contrato', 'embarque', 'sistema')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  destinatario_id TEXT NOT NULL,
  pim_id TEXT,
  leido BOOLEAN NOT NULL DEFAULT false,
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key to pims (optional reference)
ALTER TABLE public.notificaciones 
ADD CONSTRAINT notificaciones_pim_id_fkey 
FOREIGN KEY (pim_id) REFERENCES public.pims(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Permitir lectura de notificaciones" 
ON public.notificaciones FOR SELECT 
USING (true);

CREATE POLICY "Permitir insercion de notificaciones" 
ON public.notificaciones FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de notificaciones" 
ON public.notificaciones FOR UPDATE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_notificaciones_updated_at
BEFORE UPDATE ON public.notificaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample notifications
INSERT INTO public.notificaciones (id, tipo, titulo, mensaje, destinatario_id, prioridad) VALUES
('notif-1', 'alerta_sla', 'SLA próximo a vencer', 'El PIM-2024-001 está próximo a superar el tiempo de negociación', 'user-1', 'alta'),
('notif-2', 'contrato', 'Contrato firmado', 'El contrato del PIM-2024-002 ha sido firmado exitosamente', 'user-1', 'media'),
('notif-3', 'embarque', 'Embarque en tránsito', 'El embarque del PIM-2024-003 ha salido del puerto de origen', 'user-1', 'baja'),
('notif-4', 'sistema', 'Nuevo requerimiento', 'Se ha creado un nuevo requerimiento mensual para Enero 2026', 'user-1', 'media'),
('notif-5', 'alerta_sla', 'Alerta de producción', 'Tiempo de producción excedido en PIM-2024-004', 'user-1', 'urgente');