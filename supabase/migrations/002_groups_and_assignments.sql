-- ==============================================================================
-- ESCUELA DOMINICAL DIGITAL - MIGRACIÓN 002: CLASES Y ASIGNACIONES
-- ==============================================================================

-- 1. Agregar columna teacher_id a groups para vincular al maestro responsable
ALTER TABLE public.groups 
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Políticas RLS para la tabla groups
DO $$ BEGIN
  CREATE POLICY "Grupos visibles para todos los autenticados"
    ON public.groups FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins pueden gestionar todos los grupos"
    ON public.groups FOR ALL
    TO authenticated
    USING (public.is_admin());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Clases iniciales sugeridas para la Escuela Dominical
INSERT INTO public.groups (name, description) VALUES
  ('Párvulos (3 a 5 años)', 'Clase de los más pequeños'),
  ('Primarios (6 a 8 años)', 'Clase de niños en edad escolar inicial'),
  ('Intermedios (9 a 11 años)', 'Clase de niños preadolescentes'),
  ('Adolescentes (12 a 14 años)', 'Clase de formación bíblica juvenil'),
  ('Jóvenes (15 a 25 años)', 'Clase de discipulado para jóvenes'),
  ('Adultos', 'Clase de estudio bíblico para adultos')
ON CONFLICT DO NOTHING;
