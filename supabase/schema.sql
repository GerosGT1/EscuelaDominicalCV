-- Esquema inicial de referencia para Supabase/PostgreSQL.
-- Revisar y probar en un proyecto de desarrollo antes de usar datos reales.
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'teacher', 'student');
create type public.lesson_status as enum ('draft', 'published', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lesson_number text not null default '',
  main_verse text not null default '',
  objective text not null default '',
  introduction text not null default '',
  body jsonb not null default '[]'::jsonb,
  application text not null default '',
  conclusion text not null default '',
  status public.lesson_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_images (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  storage_path text not null,
  caption text not null default '',
  alt_text text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  due_at timestamptz,
  max_attempts integer not null default 1 check (max_attempts > 0),
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice','true_false','short_text','reflection','fill_blank','matching')),
  options jsonb not null default '[]'::jsonb,
  answer_key jsonb,
  points numeric(6,2) not null default 0 check (points >= 0),
  position integer not null default 0
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number integer not null default 1,
  status text not null default 'submitted' check (status in ('in_progress','submitted','needs_review','graded')),
  score numeric(5,2) check (score >= 0 and score <= 100),
  submitted_at timestamptz,
  graded_by uuid references public.profiles(id),
  graded_at timestamptz,
  feedback text not null default '',
  created_at timestamptz not null default now(),
  unique (exercise_id, student_id, attempt_number)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer jsonb not null default 'null'::jsonb,
  awarded_points numeric(6,2),
  feedback text not null default '',
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.weekly_activities (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  due_at timestamptz,
  points_enabled boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activity_progress (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.weekly_activities(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','completed','submitted','needs_review')),
  response text not null default '',
  completed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  score numeric(5,2) check (score >= 0 and score <= 100),
  created_at timestamptz not null default now(),
  unique (activity_id, student_id)
);

create table public.institution_settings (
  id integer primary key default 1 check (id = 1),
  school_name text not null default 'Escuela Dominical',
  church_name text not null default 'Iglesia',
  school_logo_path text,
  church_logo_path text,
  updated_at timestamptz not null default now()
);

-- Crear perfil básico al registrarse. El rol se fija en student y no se toma de metadata del cliente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'student');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin','teacher'), false)
$$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_images enable row level security;
alter table public.exercises enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;
alter table public.weekly_activities enable row level security;
alter table public.activity_progress enable row level security;
alter table public.institution_settings enable row level security;

create policy "Users can read own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.current_app_role() = 'admin');
create policy "Users can update own non-role profile fields" on public.profiles for update to authenticated using (id = auth.uid() or public.current_app_role() = 'admin') with check (id = auth.uid() or public.current_app_role() = 'admin');
-- IMPORTANT: do not allow self-promotion. Production should restrict role updates via a separate admin-only RPC or server endpoint.
create policy "Staff can manage classes" on public.classes for all to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Authenticated can read class membership" on public.class_members for select to authenticated using (user_id = auth.uid() or public.current_app_role() in ('admin','teacher'));
create policy "Staff can manage class membership" on public.class_members for all to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Published lessons visible to authenticated; staff manage" on public.lessons for select to authenticated using (status = 'published' or public.current_app_role() in ('admin','teacher'));
create policy "Staff manage lessons" on public.lessons for insert to authenticated with check (public.current_app_role() in ('admin','teacher'));
create policy "Staff update lessons" on public.lessons for update to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Admins delete lessons" on public.lessons for delete to authenticated using (public.current_app_role() = 'admin');
create policy "Authenticated read images for published lessons; staff manage" on public.lesson_images for select to authenticated using (exists (select 1 from public.lessons l where l.id = lesson_id and (l.status = 'published' or public.current_app_role() in ('admin','teacher'))));
create policy "Staff manage images" on public.lesson_images for all to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Students read published exercises; staff manage" on public.exercises for select to authenticated using (is_published or public.current_app_role() in ('admin','teacher'));
create policy "Staff manage exercises" on public.exercises for all to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Questions visible for published exercise or staff" on public.questions for select to authenticated using (exists (select 1 from public.exercises e where e.id = exercise_id and (e.is_published or public.current_app_role() in ('admin','teacher'))));
create policy "Staff manage questions" on public.questions for all to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Students read own attempts; staff read all" on public.attempts for select to authenticated using (student_id = auth.uid() or public.current_app_role() in ('admin','teacher'));
create policy "Students submit own attempts" on public.attempts for insert to authenticated with check (student_id = auth.uid());
create policy "Students can update own in-progress attempts" on public.attempts for update to authenticated using (student_id = auth.uid() and status = 'in_progress') with check (student_id = auth.uid() and status in ('in_progress','submitted','needs_review'));
create policy "Staff grade attempts" on public.attempts for update to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Students read own answers; staff read all" on public.answers for select to authenticated using (exists (select 1 from public.attempts a where a.id = attempt_id and (a.student_id = auth.uid() or public.current_app_role() in ('admin','teacher'))));
create policy "Students submit answers to own attempts" on public.answers for insert to authenticated with check (exists (select 1 from public.attempts a where a.id = attempt_id and a.student_id = auth.uid() and a.status in ('in_progress','submitted','needs_review')));
create policy "Staff grade answers" on public.answers for update to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Students read published activities; staff manage" on public.weekly_activities for select to authenticated using (exists (select 1 from public.lessons l where l.id = lesson_id and (l.status = 'published' or public.current_app_role() in ('admin','teacher'))));
create policy "Staff manage activities" on public.weekly_activities for all to authenticated using (public.current_app_role() in ('admin','teacher')) with check (public.current_app_role() in ('admin','teacher'));
create policy "Students read own progress; staff read all" on public.activity_progress for select to authenticated using (student_id = auth.uid() or public.current_app_role() in ('admin','teacher'));
create policy "Students update own progress" on public.activity_progress for insert to authenticated with check (student_id = auth.uid());
create policy "Students can update own progress" on public.activity_progress for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "Authenticated read institution settings" on public.institution_settings for select to authenticated using (true);
create policy "Admins manage institution settings" on public.institution_settings for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

-- Storage:
-- Create private buckets in Supabase Storage (e.g. lesson-images, institution-logos).
-- Then add storage.objects policies for authenticated staff to upload/update/delete,
-- and authenticated users to read only content they are authorized to see.
-- Do not make private buckets public just to make image URLs work.
--
-- Production hardening still needed:
-- * Restrict role updates so users cannot update their own role. A separate trigger/RPC with admin authorization is recommended.
-- * Keep answer keys hidden from students. In a production schema, store answer keys in a private table not selectable by students.
-- * Calculate scores in a trusted server function, not in the browser.
-- * Add limits/rate controls, storage policies, audit logs and tests before real deployment.
