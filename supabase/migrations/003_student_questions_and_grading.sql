-- ==============================================================================
-- ESCUELA DOMINICAL DIGITAL - MIGRACIÓN 003: PREGUNTAS AL MAESTRO Y CALIFICACIONES
-- ==============================================================================

-- 1. Agregar columna feedback a attempts si no existe
ALTER TABLE public.attempts 
  ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 2. Asegurar que maestros puedan insertar intentos/calificaciones directamente para alumnos
DO $$ BEGIN
  CREATE POLICY "Maestros pueden registrar calificaciones para alumnos"
    ON public.attempts FOR INSERT
    TO authenticated
    WITH CHECK (public.is_teacher_or_admin() OR student_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla para preguntas de alumnos a sus maestros (Q&A de Escuela Dominical)
CREATE TABLE IF NOT EXISTS public.student_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Habilitar RLS en student_questions
ALTER TABLE public.student_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Alumnos y maestros leen sus preguntas"
    ON public.student_questions FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_teacher_or_admin());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Alumnos pueden enviar preguntas"
    ON public.student_questions FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Maestros pueden responder preguntas o alumnos editar pendientes"
    ON public.student_questions FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid() OR public.is_teacher_or_admin());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Eliminar preguntas pendientes o por admin"
    ON public.student_questions FOR DELETE
    TO authenticated
    USING (public.is_admin() OR (student_id = auth.uid() AND status = 'pending'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. Bucket de avatares en Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Avatares son publicos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios autenticados suben avatares"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuarios actualizan sus avatares"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
