-- Agregar política RLS DELETE para requerimiento_items (permite editar requerimientos)
CREATE POLICY "Permitir eliminación de items requerimiento" 
ON public.requerimiento_items 
FOR DELETE 
USING (true);

-- Agregar política RLS DELETE para pim_requirement_items
CREATE POLICY "Permitir lectura de pim_requirement_items"
ON public.pim_requirement_items
FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de pim_requirement_items"
ON public.pim_requirement_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización de pim_requirement_items"
ON public.pim_requirement_items
FOR UPDATE
USING (true);

CREATE POLICY "Permitir eliminación de pim_requirement_items"
ON public.pim_requirement_items
FOR DELETE
USING (true);