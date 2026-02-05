-- Agregar campos de condiciones de contrato a la tabla pims
ALTER TABLE public.pims 
ADD COLUMN IF NOT EXISTS condicion_precio text,
ADD COLUMN IF NOT EXISTS fecha_embarque text,
ADD COLUMN IF NOT EXISTS origen text,
ADD COLUMN IF NOT EXISTS fabricas_origen text,
ADD COLUMN IF NOT EXISTS notas_pago text;