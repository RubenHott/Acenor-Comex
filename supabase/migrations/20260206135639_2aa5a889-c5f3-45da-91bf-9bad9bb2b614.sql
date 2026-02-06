
-- 1. Create storage bucket for PIM documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('pim-documentos', 'pim-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow read pim documents" ON storage.objects
FOR SELECT USING (bucket_id = 'pim-documentos');

CREATE POLICY "Allow upload pim documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pim-documentos');

CREATE POLICY "Allow update pim documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'pim-documentos');

CREATE POLICY "Allow delete pim documents" ON storage.objects
FOR DELETE USING (bucket_id = 'pim-documentos');

-- 2. Add stage_key and versioning columns to pim_documentos
ALTER TABLE public.pim_documentos
ADD COLUMN IF NOT EXISTS stage_key text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS version_group text;

-- 3. Add DHL tracking columns to pims table
ALTER TABLE public.pims
ADD COLUMN IF NOT EXISTS dhl_tracking_code text,
ADD COLUMN IF NOT EXISTS dhl_last_status text,
ADD COLUMN IF NOT EXISTS dhl_last_checked_at timestamptz;

-- 4. Fix RLS on pim_documentos - allow insert, update, delete
CREATE POLICY "Permitir insercion de documentos pim" ON public.pim_documentos
FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de documentos pim" ON public.pim_documentos
FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminacion de documentos pim" ON public.pim_documentos
FOR DELETE USING (true);

-- Also add a permissive SELECT for non-authenticated (consistent with project pattern)
CREATE POLICY "Permitir lectura publica de documentos pim" ON public.pim_documentos
FOR SELECT USING (true);
