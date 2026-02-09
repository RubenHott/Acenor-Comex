-- Fix: pims.molino_id era TEXT, debe ser UUID para FK a fabricas_molinos
-- Eliminar columna antigua y crear nueva con tipo correcto

ALTER TABLE public.pims DROP COLUMN IF EXISTS molino_id;

ALTER TABLE public.pims
ADD COLUMN molino_id UUID REFERENCES public.fabricas_molinos(id) ON DELETE SET NULL;
