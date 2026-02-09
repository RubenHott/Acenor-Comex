-- Crear tabla fabricas_molinos (maestro de fábricas/molinos)
CREATE TABLE IF NOT EXISTS public.fabricas_molinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  pais TEXT NOT NULL,
  ciudad TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fabricas_molinos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Permitir lectura fabricas_molinos" ON public.fabricas_molinos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion fabricas_molinos" ON public.fabricas_molinos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion fabricas_molinos" ON public.fabricas_molinos FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminacion fabricas_molinos" ON public.fabricas_molinos FOR DELETE USING (true);

-- FK: pims.molino_id -> fabricas_molinos(id)
ALTER TABLE public.pims
ADD CONSTRAINT pims_molino_id_fkey
FOREIGN KEY (molino_id) REFERENCES public.fabricas_molinos(id) ON DELETE SET NULL;

-- Agregar molino_id a pim_items (nullable, hereda del PIM si null)
ALTER TABLE public.pim_items
ADD COLUMN IF NOT EXISTS molino_id UUID REFERENCES public.fabricas_molinos(id) ON DELETE SET NULL;
