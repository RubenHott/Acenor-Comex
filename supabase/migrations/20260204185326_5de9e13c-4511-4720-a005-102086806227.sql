-- Allow DELETE on requerimientos_mensuales
CREATE POLICY "Permitir eliminación de requerimientos" 
ON public.requerimientos_mensuales 
FOR DELETE 
USING (true);

-- Allow DELETE on pims
CREATE POLICY "Permitir eliminación de pims" 
ON public.pims 
FOR DELETE 
USING (true);

-- Allow DELETE on pim_items
CREATE POLICY "Permitir eliminación de pim_items" 
ON public.pim_items 
FOR DELETE 
USING (true);