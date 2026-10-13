-- ==============================================================================
-- ESCUELA DOMINICAL DIGITAL - ESQUEMA DE BASE DE DATOS INICIAL (SUPABASE)
-- Asambleas de Dios - Auditorium Cristo Viene, Santa Catarina Pinula
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS PERSONALIZADOS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lesson_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'graded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'fill_blank', 'match', 'short_answer', 'reflection');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA DE GRUPOS / CLASES
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DE PERFILES (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA DE LECCIONES (lessons)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  biblical_text TEXT NOT NULL,
  theme TEXT NOT NULL,
  objective TEXT NOT NULL,
  introduction TEXT NOT NULL,
  content TEXT NOT NULL,
  bible_references TEXT,
  teachings TEXT,
  application TEXT,
  conclusion TEXT,
  reflection_questions TEXT,
  weekly_activities TEXT,
  closing_prayer TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status lesson_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABLA DE IMÁGENES DE LECCIONES (lesson_images)
CREATE TABLE IF NOT EXISTS public.lesson_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TABLA DE EJERCICIOS (exercises)
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. TABLA DE PREGUNTAS (questions)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  text TEXT NOT NULL,
  points NUMERIC(5,2) NOT NULL DEFAULT 10,
  display_order INTEGER NOT NULL DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. TABLA DE OPCIONES DE PREGUNTA (question_options)
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  match_pair TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 10. TABLA DE INTENTOS DE EVALUACIÓN (attempts)
CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  status attempt_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at TIMESTAMPTZ
);

-- 11. TABLA DE RESPUESTAS (answers)
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  text_answer TEXT,
  is_correct BOOLEAN,
  points_earned NUMERIC(5,2) NOT NULL DEFAULT 0,
  teacher_comment TEXT,
  reviewed_at TIMESTAMPTZ
);

-- 12. TABLA DE RETOS SEMANALES (weekly_challenges)
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  has_evaluation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. TABLA DE PROGRESO DE RETOS (challenge_progress)
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  response_text TEXT,
  evidence_url TEXT,
  completed_at TIMESTAMPTZ
);

-- 14. TABLA DE CONFIGURACIONES (settings)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. TABLA DE REGISTRO DE AUDITORÍA (audit_log)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TRIGGER PARA CREAR PERFIL AUTOMÁTICO TRAS REGISTRO EN SUPABASE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email,
    'student',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Es admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: Es maestro o admin?
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('teacher', 'admin') AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Profiles son visibles para autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins pueden actualizar cualquier perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- LESSONS
CREATE POLICY "Lecciones publicadas son visibles para autenticados"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (status = 'published' OR public.is_teacher_or_admin());

CREATE POLICY "Maestros y admins pueden insertar lecciones"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Maestros pueden actualizar sus lecciones y admins todas"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR (public.is_teacher_or_admin() AND teacher_id = auth.uid()));

-- LESSON IMAGES
CREATE POLICY "Imágenes de lecciones visibles para autenticados"
  ON public.lesson_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Maestros y admins pueden gestionar imágenes"
  ON public.lesson_images FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin());

-- EXERCISES
CREATE POLICY "Ejercicios visibles para autenticados"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Maestros y admins gestionan ejercicios"
  ON public.exercises FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin());

-- QUESTIONS & OPTIONS
CREATE POLICY "Preguntas visibles para autenticados"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Maestros y admins gestionan preguntas"
  ON public.questions FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin());

CREATE POLICY "Opciones visibles para autenticados"
  ON public.question_options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Maestros y admins gestionan opciones"
  ON public.question_options FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin());

-- ATTEMPTS
CREATE POLICY "Alumnos ven sus intentos, maestros ven todos"
  ON public.attempts FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_or_admin());

CREATE POLICY "Alumnos pueden crear intentos"
  ON public.attempts FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Alumnos actualizan sus intentos o maestros califican"
  ON public.attempts FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_or_admin());

-- ANSWERS
CREATE POLICY "Lectura de respuestas según intento"
  ON public.answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attempts
      WHERE attempts.id = answers.attempt_id
      AND (attempts.student_id = auth.uid() OR public.is_teacher_or_admin())
    )
  );

CREATE POLICY "Inserción de respuestas en intento propio"
  ON public.answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attempts
      WHERE attempts.id = answers.attempt_id AND attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Calificación de respuestas por maestros"
  ON public.answers FOR UPDATE
  TO authenticated
  USING (public.is_teacher_or_admin());

-- CHALLENGES
CREATE POLICY "Retos semanales visibles para todos"
  ON public.weekly_challenges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Maestros gestionan retos"
  ON public.weekly_challenges FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin());

CREATE POLICY "Progreso de retos propio o maestros"
  ON public.challenge_progress FOR ALL
  TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher_or_admin());

-- SETTINGS
CREATE POLICY "Configuración visible para autenticados"
  ON public.settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admins modifican configuraciones"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (Instrucción SQL si la extensión storage está disponible)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-images', 'lesson-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('settings', 'settings', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Imágenes de lecciones son públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lesson-images');

CREATE POLICY "Maestros y admins suben imágenes de lecciones"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lesson-images' AND public.is_teacher_or_admin());

CREATE POLICY "Logotipos son públicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'settings');

CREATE POLICY "Solo admins suben a settings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'settings' AND public.is_admin());
