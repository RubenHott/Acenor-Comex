
-- 1. Tabla de etapas de seguimiento por PIM
CREATE TABLE public.pim_tracking_stages (
  id text PRIMARY KEY,
  pim_id text NOT NULL REFERENCES public.pims(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  status text NOT NULL DEFAULT 'pendiente',
  fecha_inicio timestamptz,
  fecha_limite timestamptz,
  fecha_fin timestamptz,
  responsable text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(pim_id, stage_key)
);

ALTER TABLE public.pim_tracking_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura de tracking stages" ON public.pim_tracking_stages FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de tracking stages" ON public.pim_tracking_stages FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion de tracking stages" ON public.pim_tracking_stages FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminacion de tracking stages" ON public.pim_tracking_stages FOR DELETE USING (true);

-- 2. Tabla de checklist items por etapa
CREATE TABLE public.pim_checklist_items (
  id text PRIMARY KEY,
  pim_id text NOT NULL REFERENCES public.pims(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  checklist_key text NOT NULL,
  texto text NOT NULL,
  critico boolean DEFAULT false,
  completado boolean DEFAULT false,
  completado_por text,
  completado_en timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(pim_id, checklist_key)
);

ALTER TABLE public.pim_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura de checklist items" ON public.pim_checklist_items FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de checklist items" ON public.pim_checklist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion de checklist items" ON public.pim_checklist_items FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminacion de checklist items" ON public.pim_checklist_items FOR DELETE USING (true);

-- 3. Tabla de historial de actividades
CREATE TABLE public.pim_activity_log (
  id text PRIMARY KEY,
  pim_id text NOT NULL REFERENCES public.pims(id) ON DELETE CASCADE,
  stage_key text,
  tipo text NOT NULL,
  descripcion text NOT NULL,
  usuario text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pim_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura de activity log" ON public.pim_activity_log FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de activity log" ON public.pim_activity_log FOR INSERT WITH CHECK (true);

-- Triggers de updated_at
CREATE TRIGGER update_pim_tracking_stages_updated_at
  BEFORE UPDATE ON public.pim_tracking_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pim_checklist_items_updated_at
  BEFORE UPDATE ON public.pim_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
