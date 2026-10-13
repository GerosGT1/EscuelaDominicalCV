export type Role = 'admin' | 'teacher' | 'student'
export type LessonStatus = 'draft' | 'published' | 'archived'
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded'
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'match' | 'short_answer' | 'reflection'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  group_id: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  group?: Group
}

export interface Group {
  id: string
  name: string
  description: string | null
  teacher_id: string | null
  created_at: string
  teacher?: Profile
}

export interface Lesson {
  id: string
  number: number
  title: string
  biblical_text: string
  theme: string
  objective: string
  introduction: string
  content: string
  bible_references: string | null
  teachings: string | null
  application: string | null
  conclusion: string | null
  reflection_questions: string | null
  weekly_activities: string | null
  closing_prayer: string | null
  teacher_id: string | null
  status: LessonStatus
  published_at: string | null
  created_at: string
  // relaciones expandidas
  teacher?: Profile
  images?: LessonImage[]
}

export interface LessonImage {
  id: string
  lesson_id: string
  url: string
  title: string | null
  description: string | null
  display_order: number
  created_at: string
}

export interface Exercise {
  id: string
  lesson_id: string
  title: string
  instructions: string | null
  max_score: number
  max_attempts: number
  deadline: string | null
  created_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  exercise_id: string
  type: QuestionType
  text: string
  points: number
  display_order: number
  feedback: string | null
  created_at: string
  options?: QuestionOption[]
}

export interface QuestionOption {
  id: string
  question_id: string
  text: string
  is_correct: boolean
  match_pair: string | null
  display_order: number
}

export interface Attempt {
  id: string
  exercise_id: string
  student_id: string
  score: number | null
  status: AttemptStatus
  started_at: string
  submitted_at: string | null
  exercise?: Exercise
  student?: Profile
}

export interface Answer {
  id: string
  attempt_id: string
  question_id: string
  selected_option_id: string | null
  text_answer: string | null
  is_correct: boolean | null
  points_earned: number
  teacher_comment: string | null
  reviewed_at: string | null
}

export interface WeeklyChallenge {
  id: string
  lesson_id: string
  title: string
  instructions: string
  deadline: string | null
  has_evaluation: boolean
  created_at: string
}

export interface ChallengeProgress {
  id: string
  challenge_id: string
  student_id: string
  is_completed: boolean
  response_text: string | null
  evidence_url: string | null
  completed_at: string | null
}

export interface Setting {
  id: string
  key: string
  value: string
  updated_by: string | null
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// Necesario para tipado de Supabase client
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      groups: { Row: Group; Insert: Omit<Group, 'id' | 'created_at'>; Update: Partial<Group> }
      lessons: { Row: Lesson; Insert: Omit<Lesson, 'id' | 'created_at'>; Update: Partial<Lesson> }
      lesson_images: { Row: LessonImage; Insert: Omit<LessonImage, 'id' | 'created_at'>; Update: Partial<LessonImage> }
      exercises: { Row: Exercise; Insert: Omit<Exercise, 'id' | 'created_at'>; Update: Partial<Exercise> }
      questions: { Row: Question; Insert: Omit<Question, 'id' | 'created_at'>; Update: Partial<Question> }
      question_options: { Row: QuestionOption; Insert: Omit<QuestionOption, 'id'>; Update: Partial<QuestionOption> }
      attempts: { Row: Attempt; Insert: Omit<Attempt, 'id'>; Update: Partial<Attempt> }
      answers: { Row: Answer; Insert: Omit<Answer, 'id'>; Update: Partial<Answer> }
      weekly_challenges: { Row: WeeklyChallenge; Insert: Omit<WeeklyChallenge, 'id' | 'created_at'>; Update: Partial<WeeklyChallenge> }
      challenge_progress: { Row: ChallengeProgress; Insert: Omit<ChallengeProgress, 'id'>; Update: Partial<ChallengeProgress> }
      settings: { Row: Setting; Insert: Omit<Setting, 'id'>; Update: Partial<Setting> }
      audit_log: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'created_at'>; Update: never }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
