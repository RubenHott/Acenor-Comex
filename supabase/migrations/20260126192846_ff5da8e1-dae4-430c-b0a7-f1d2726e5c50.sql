-- Create work_orders table
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  tipo_trabajo TEXT NOT NULL CHECK (tipo_trabajo IN ('correctivo', 'preventivo', 'mejora')),
  area TEXT NOT NULL,
  equipo_id TEXT,
  tecnico_asignado TEXT,
  solicitante TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  fecha_limite TIMESTAMPTZ NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read work_orders"
ON public.work_orders FOR SELECT
USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Authenticated users can insert work_orders"
ON public.work_orders FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR true);

CREATE POLICY "Authenticated users can update work_orders"
ON public.work_orders FOR UPDATE
USING (auth.role() = 'authenticated' OR true);

-- Trigger for updated_at
CREATE TRIGGER update_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.work_orders (codigo, titulo, descripcion, estado, prioridad, tipo_trabajo, area, tecnico_asignado, solicitante, fecha_limite) VALUES
('OT-2025-001', 'Mantenimiento preventivo prensa hidráulica', 'Cambio de aceite y revisión de sellos hidráulicos', 'en_progreso', 'media', 'preventivo', 'Producción', 'Carlos Rodríguez', 'Sistema', now() + interval '3 days'),
('OT-2025-002', 'Reparación compresor línea 1', 'El compresor presenta ruido anormal y baja presión de aire', 'pendiente', 'alta', 'correctivo', 'Mantenimiento', NULL, 'Juan Pérez', now() + interval '1 day'),
('OT-2025-003', 'Instalación sensor de temperatura', 'Instalar nuevo sensor de temperatura en horno principal', 'pendiente', 'baja', 'mejora', 'Producción', NULL, 'María González', now() + interval '7 days'),
('OT-2025-004', 'Calibración equipos de medición', 'Calibración mensual de equipos de control de calidad', 'completada', 'media', 'preventivo', 'Calidad', 'Ana López', 'Sistema', now() - interval '2 days'),
('OT-2025-005', 'Reparación cinta transportadora', 'Cambio de banda dañada en cinta transportadora sector B', 'en_progreso', 'urgente', 'correctivo', 'Producción', 'Pedro Sánchez', 'Roberto Díaz', now());