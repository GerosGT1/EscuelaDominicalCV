import { useMemo, useState } from 'react'
import {
  BookOpen, CalendarDays, CheckCircle2, ChevronRight, CircleHelp, ClipboardList,
  Clock3, GraduationCap, ImagePlus, LayoutDashboard, LogOut, Menu, Plus, Search,
  Settings, ShieldCheck, Sparkles, Trophy, Users, X, BookMarked, Heart, Bell
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type View = 'dashboard' | 'lessons' | 'exercises' | 'progress' | 'admin'
const lesson = {
  title: 'La fe que transforma nuestra vida',
  verse: 'Hebreos 11:1',
  date: 'Lección de la semana',
  description: 'Comprender cómo la fe en Dios influye en nuestras decisiones y se demuestra mediante acciones concretas.',
  progress: 65,
  image: ''
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [completed, setCompleted] = useState<string[]>(['Leer Hebreos 11:1–6'])
  const [score, setScore] = useState<number | null>(null)
  const [quizAnswer, setQuizAnswer] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonText, setNewLessonText] = useState('')
  const [publishedTitle, setPublishedTitle] = useState('')
  const [publishedText, setPublishedText] = useState('')
  const [role, setRole] = useState<'Alumno' | 'Maestro' | 'Administrador'>('Alumno')
  const [userName, setUserName] = useState('Bienvenido')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const navItems = [
    { id: 'dashboard' as View, label: 'Inicio', icon: LayoutDashboard },
    { id: 'lessons' as View, label: 'Lecciones', icon: BookOpen },
    { id: 'exercises' as View, label: 'Ejercicios', icon: ClipboardList },
    { id: 'progress' as View, label: 'Mi progreso', icon: Trophy },
    ...(role !== 'Alumno' ? [{ id: 'admin' as View, label: 'Administración', icon: Settings }] : [])
  ]

  const title = useMemo(() => ({
    dashboard: 'Tu espacio de aprendizaje',
    lessons: 'Lecciones bíblicas',
    exercises: 'Ejercicios de la semana',
    progress: 'Mi progreso',
    admin: 'Panel de administración'
  }[view]), [view])

  async function handleAuth() {
    setAuthMessage('')
    if (!email || !password) {
      setAuthMessage('Escribe tu correo y contraseña para continuar.')
      return
    }
    if (!supabase) {
      setAuthMessage('La interfaz está lista, pero falta conectar Supabase. Sigue los pasos del README para activar el registro seguro.')
      return
    }
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: userName === 'Bienvenido' ? email.split('@')[0] : userName } } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) setAuthMessage(result.error.message)
    else {
      setAuthMessage(authMode === 'signup' ? 'Registro enviado. Revisa tu correo si se solicita confirmación.' : 'Sesión iniciada correctamente.')
      if (authMode === 'login') setShowLogin(false)
    }
  }

  function publishLesson() {
    if (!newLessonTitle.trim() || !newLessonText.trim()) return
    setPublishedTitle(newLessonTitle.trim())
    setPublishedText(newLessonText.trim())
    setNewLessonTitle('')
    setNewLessonText('')
    setShowUpload(false)
    setView('lessons')
  }

  function finishQuiz() {
    setScore(quizAnswer === 'faith' ? 100 : 0)
    setShowQuiz(false)
    setView('exercises')
  }

  const toggleTask = (task: string) => setCompleted(prev => prev.includes(task) ? prev.filter(x => x !== task) : [...prev, task])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="logo-pair">
            <div className="logo-mark"><BookOpen size={23}/></div>
            <div className="church-mark"><span>✦</span></div>
          </div>
          <div className="brand-copy"><strong>Escuela Dominical</strong><span>PLATAFORMA DIGITAL</span></div>
          <button className="icon-button close-menu" onClick={() => setMobileMenu(false)} aria-label="Cerrar menú"><X size={19}/></button>
        </div>
        <div className="institution-label">MENÚ PRINCIPAL</div>
        <nav className="navigation">
          {navItems.map(item => {
            const Icon = item.icon
            return <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => { setView(item.id); setMobileMenu(false) }}>
              <Icon size={19}/><span>{item.label}</span>{item.id === 'exercises' && <span className="nav-dot"/>}
            </button>
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="verse-card">
            <div className="verse-icon"><BookMarked size={17}/></div>
            <span className="eyebrow">PALABRA DE HOY</span>
            <p>“Es, pues, la fe la certeza de lo que se espera...”</p>
            <strong>Hebreos 11:1</strong>
          </div>
          <button className="nav-item muted" onClick={() => setShowLogin(true)}><ShieldCheck size={18}/><span>Cuenta y acceso</span></button>
          <div className="profile-row">
            <div className="avatar">ED</div><div className="profile-info"><strong>{userName}</strong><span>{role}</span></div>
            <button className="icon-button" title="Cerrar sesión" onClick={() => { setUserName('Bienvenido'); setRole('Alumno'); setAuthMessage('Sesión local cerrada.') }}><LogOut size={17}/></button>
          </div>
        </div>
      </aside>

      {mobileMenu && <button className="scrim" aria-label="Cerrar menú" onClick={() => setMobileMenu(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Abrir menú"><Menu size={21}/></button>
          <div className="breadcrumbs"><span>Escuela Dominical</span><ChevronRight size={14}/><strong>{title}</strong></div>
          <div className="top-actions">
            <span className="week-chip"><span className="status-dot"/> Lección activa</span>
            <button className="icon-button notification-button" aria-label="Notificaciones"><Bell size={19}/><i/></button>
            <button className="top-avatar" onClick={() => setShowLogin(true)} title="Cuenta de usuario">ED</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><div className="overline"><Sparkles size={14}/> CRECER EN LA PALABRA</div><h1>{title}</h1><p>Un espacio para aprender, reflexionar y vivir la Palabra de Dios.</p></div>
            <div className="date-display"><CalendarDays size={17}/><span>Tu semana, con propósito</span></div>
          </div>

          {view === 'dashboard' && <>
            <section className="welcome-banner">
              <div className="welcome-content">
                <span className="welcome-kicker"><span/> ESCUELA DOMINICAL · ADULTOS</span>
                <h2>La Palabra transforma.<br/><em>Crece cada semana.</em></h2>
                <p>Dedica unos minutos cada día a profundizar en la Escritura y llevarla a tu vida.</p>
                <button className="button button-gold" onClick={() => setView('lessons')}>Continuar la lección <ChevronRight size={17}/></button>
              </div>
              <div className="banner-art" aria-hidden="true">
                <div className="art-glow"/><div className="art-cross">✝</div><div className="art-book"><BookOpen size={80} strokeWidth={1}/></div><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
              </div>
              <div className="banner-index"><span>01</span><i/> LECCIÓN DESTACADA</div>
            </section>

            <section className="stat-grid">
              <div className="stat-card"><div className="stat-top"><span>Lecciones disponibles</span><div className="stat-icon blue"><BookOpen size={18}/></div></div><div className="stat-number">01</div><div className="stat-foot"><span className="mini-trend">Actualizada</span><span>Contenido semanal</span></div></div>
              <div className="stat-card"><div className="stat-top"><span>Actividades realizadas</span><div className="stat-icon gold"><CheckCircle2 size={18}/></div></div><div className="stat-number">{completed.length}<small> / 3</small></div><div className="progress-line"><span style={{width:`${Math.min(100, completed.length/3*100)}%`}}/></div><div className="stat-foot"><span>Tu constancia importa</span></div></div>
              <div className="stat-card"><div className="stat-top"><span>Última puntuación</span><div className="stat-icon lilac"><Trophy size={18}/></div></div><div className="stat-number">{score === null ? '—' : score}<small>{score === null ? ' Sin evaluar' : ' / 100 pts'}</small></div><div className="stat-foot"><span>{score === null ? 'Completa el ejercicio para empezar' : 'Resultado del ejercicio'}</span></div></div>
            </section>

            <section className="content-grid">
              <div className="panel lesson-panel">
                <div className="panel-heading"><div><span className="eyebrow">EN ESTA SEMANA</span><h3>Tu lección actual</h3></div><button className="text-button" onClick={() => setView('lessons')}>Ver lección <ChevronRight size={15}/></button></div>
                <div className="lesson-preview">
                  <div className="lesson-thumb"><div className="thumb-cross">✝</div><span>ESTUDIO BÍBLICO</span></div>
                  <div className="lesson-info"><div className="tag"><span/> LECCIÓN DESTACADA</div><h4>{publishedTitle || lesson.title}</h4><p className="scripture"><BookMarked size={14}/> {lesson.verse}</p><p>{publishedText || lesson.description}</p><div className="lesson-meta"><span><Clock3 size={14}/> 10–15 min</span><span><CalendarDays size={14}/> Esta semana</span></div><button className="button button-primary" onClick={() => setView('lessons')}>Estudiar ahora <ChevronRight size={16}/></button></div>
                </div>
              </div>
              <div className="panel tasks-panel">
                <div className="panel-heading"><div><span className="eyebrow">APLICACIÓN PRÁCTICA</span><h3>Mi reto de la semana</h3></div><div className="task-count">{completed.length}/3</div></div>
                <p className="panel-subtitle">Pequeños pasos para llevar la Palabra a tu día a día.</p>
                <div className="task-list">
                  {['Leer Hebreos 11:1–6','Meditar y escribir una reflexión','Completar el ejercicio bíblico'].map((task, i) => <button key={task} className={`task-item ${completed.includes(task) ? 'task-done' : ''}`} onClick={() => toggleTask(task)}><span className="task-check">{completed.includes(task) && <CheckCircle2 size={18}/>}</span><span className="task-copy"><strong>{task}</strong><small>{['Lectura bíblica','Reflexión personal','Evaluación'][i]}</small></span><ChevronRight size={16} className="task-arrow"/></button>)}
                </div>
                <div className="task-progress"><div><span>Progreso semanal</span><strong>{Math.round(completed.length/3*100)}%</strong></div><div className="progress-line"><span style={{width:`${completed.length/3*100}%`}}/></div></div>
              </div>
            </section>
            <section className="bottom-note"><div className="note-symbol"><Heart size={18}/></div><div><strong>Aprender también es vivirlo.</strong><p>Avanza a tu ritmo, reflexiona con intención y permite que cada enseñanza fortalezca tu caminar con Dios.</p></div><span className="note-reference">FE · REFLEXIÓN · ACCIÓN</span></section>
          </>}

          {view === 'lessons' && <section className="panel inner-page">
            <div className="panel-heading"><div><span className="eyebrow">ESTUDIO DE LA SEMANA</span><h3>{publishedTitle || lesson.title}</h3></div>{role !== 'Alumno' && <button className="button button-primary" onClick={() => setShowUpload(true)}><Plus size={16}/> Nueva lección</button>}</div>
            <div className="lesson-hero-inline"><div className="lesson-thumb large"><div className="thumb-cross">✝</div><span>ESCUELA DOMINICAL</span></div><div><div className="tag"><span/> LECCIÓN ACTIVA</div><h2>{publishedTitle || lesson.title}</h2><p className="scripture"><BookMarked size={15}/> Texto bíblico: {lesson.verse}</p><p>{publishedText || lesson.description}</p><div className="lesson-meta"><span><Clock3 size={14}/> 10–15 minutos</span><span><CalendarDays size={14}/> Lección semanal</span></div></div></div>
            <div className="lesson-body"><h3>Objetivo de aprendizaje</h3><p>Reconocer que la fe bíblica no es solamente una idea, sino una confianza firme en Dios que orienta nuestras decisiones y acciones diarias.</p><h3>Desarrollo de la lección</h3><p>Hebreos 11:1 nos presenta la fe como la certeza de lo que esperamos y la convicción de lo que no vemos. En la vida cristiana, la fe se fortalece al conocer la Palabra, recordar la fidelidad de Dios y responder con obediencia.</p><p>La fe no elimina todas las preguntas ni significa que nunca tendremos dificultades. Nos invita a confiar en el carácter de Dios mientras damos pasos responsables, aun cuando no vemos todo el camino.</p><h3>Aplicación práctica</h3><ul><li>Identifica una situación en la que necesitas confiar más en Dios.</li><li>Lee el pasaje bíblico y anota qué te enseña acerca de su carácter.</li><li>Decide una acción concreta que refleje tu fe durante esta semana.</li></ul><div className="reflection-box"><CircleHelp size={20}/><div><strong>Para reflexionar</strong><p>¿Qué decisión de esta semana puedes tomar con fe y sabiduría, confiando en la dirección de Dios?</p></div></div><button className="button button-primary" onClick={() => { setView('exercises'); setShowQuiz(true) }}>Realizar ejercicio de la lección <ChevronRight size={16}/></button></div>
          </section>}

          {view === 'exercises' && <section className="panel inner-page">
            <div className="panel-heading"><div><span className="eyebrow">EVALUACIÓN SEMANAL</span><h3>Comprueba lo aprendido</h3></div><div className="score-badge"><Trophy size={16}/> Escala 0–100</div></div>
            <p className="panel-subtitle">Responde con calma. El objetivo es reforzar lo aprendido en la lección.</p>
            <div className="exercise-card"><div className="exercise-number">PREGUNTA 01 <span>· SELECCIÓN MÚLTIPLE · 100 PTS</span></div><h4>Según Hebreos 11:1, ¿cómo se describe la fe?</h4><div className="answer-list">{[{id:'hope',label:'Como una emoción que depende de las circunstancias.'},{id:'faith',label:'Como la certeza de lo que se espera y la convicción de lo que no se ve.'},{id:'works',label:'Como una lista de obras para demostrar superioridad.'}].map(a => <button key={a.id} onClick={() => setQuizAnswer(a.id)} className={`answer-option ${quizAnswer === a.id ? 'selected' : ''}`}><span className="answer-radio">{quizAnswer === a.id && <i/>}</span>{a.label}</button>)}</div>{score !== null && <div className={`result-banner ${score === 100 ? 'result-success' : 'result-review'}`}><Trophy size={20}/><div><strong>Tu puntuación: {score}/100</strong><p>{score === 100 ? '¡Excelente! Has identificado la enseñanza principal.' : 'Revisa Hebreos 11:1 y vuelve a intentarlo cuando estés listo.'}</p></div></div>}<div className="exercise-footer"><span><ShieldCheck size={15}/> Tus resultados son privados.</span><button className="button button-primary" disabled={!quizAnswer} onClick={finishQuiz}>Enviar respuestas <ChevronRight size={16}/></button></div></div>
            <div className="reflection-box"><CircleHelp size={20}/><div><strong>Reflexión personal</strong><p>Escribe en tu cuaderno una forma concreta en que puedes poner en práctica esta enseñanza durante la semana.</p><button className="text-button" onClick={() => toggleTask('Meditar y escribir una reflexión')}>{completed.includes('Meditar y escribir una reflexión') ? 'Actividad marcada como completada ✓' : 'Marcar reflexión como completada'}</button></div></div>
          </section>}

          {view === 'progress' && <section className="panel inner-page">
            <div className="panel-heading"><div><span className="eyebrow">TU CAMINO DE APRENDIZAJE</span><h3>Constancia que da fruto</h3></div><div className="stat-icon gold"><Trophy size={20}/></div></div>
            <div className="progress-summary"><div className="progress-circle" style={{'--progress': `${completed.length/3*100}%`} as React.CSSProperties}><div><strong>{Math.round(completed.length/3*100)}%</strong><span>completado</span></div></div><div><h3>Tu avance esta semana</h3><p>La constancia en el estudio te ayuda a profundizar en la Palabra y aplicar sus enseñanzas.</p><div className="progress-line wide"><span style={{width:`${completed.length/3*100}%`}}/></div><small>{completed.length} de 3 actividades completadas</small></div></div>
            <h3 className="section-title">Actividades de esta semana</h3>{['Leer Hebreos 11:1–6','Meditar y escribir una reflexión','Completar el ejercicio bíblico'].map((task, i) => <div className="progress-task" key={task}><div className={`progress-task-icon ${completed.includes(task) ? 'done' : ''}`}>{completed.includes(task) ? <CheckCircle2 size={18}/> : i+1}</div><div><strong>{task}</strong><small>{['Lectura bíblica','Reflexión personal','Evaluación'][i]}</small></div><button className={`small-action ${completed.includes(task) ? 'done-action' : ''}`} onClick={() => toggleTask(task)}>{completed.includes(task) ? 'Completada' : 'Marcar hecha'}</button></div>)}
            <div className="score-history"><div><Trophy size={19}/><div><strong>Última evaluación</strong><small>La fe que transforma nuestra vida</small></div></div><strong className="score-value">{score === null ? 'Pendiente' : `${score}/100`}</strong></div>
          </section>}

          {view === 'admin' && <section className="panel inner-page">
            <div className="panel-heading"><div><span className="eyebrow">GESTIÓN DE CONTENIDO</span><h3>Administra tu Escuela Dominical</h3></div><div className="stat-icon blue"><Settings size={20}/></div></div>
            <div className="admin-grid"><button className="admin-action" onClick={() => setShowUpload(true)}><div className="admin-action-icon"><Plus size={22}/></div><strong>Crear una lección</strong><span>Publica el contenido de la semana.</span><ChevronRight size={17}/></button><button className="admin-action" onClick={() => document.getElementById('lesson-image')?.click()}><div className="admin-action-icon"><ImagePlus size={22}/></div><strong>Imágenes</strong><span>Prepara material visual para la lección.</span><ChevronRight size={17}/></button><button className="admin-action" onClick={() => setView('exercises')}><div className="admin-action-icon"><ClipboardList size={22}/></div><strong>Ejercicios</strong><span>Revisa el ejemplo de evaluación.</span><ChevronRight size={17}/></button><button className="admin-action" onClick={() => setRole(role === 'Administrador' ? 'Maestro' : 'Administrador')}><div className="admin-action-icon"><Users size={22}/></div><strong>Vista de permisos (demo)</strong><span>Rol actual: {role}. Los permisos reales requieren configurar el backend.</span><ChevronRight size={17}/></button></div>
            <div className="notice-box"><ShieldCheck size={19}/><p><strong>Antes de publicar para usuarios reales:</strong> conecta Supabase, configura las políticas RLS y define los roles en la base de datos. El selector de rol de esta demostración es solo visual y no concede permisos reales.</p></div>
          </section>}

          <footer className="footer"><span>© 2026 Escuela Dominical Digital</span><span>Diseñada para crecer en la Palabra <Heart size={13}/></span></footer>
        </div>
      </main>

      {showLogin && <div className="modal-backdrop" onClick={() => setShowLogin(false)}><div className="modal-card" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setShowLogin(false)} aria-label="Cerrar"><X size={19}/></button><div className="modal-emblem"><BookOpen size={25}/></div><span className="eyebrow">TU COMUNIDAD · TU APRENDIZAJE</span><h2>{authMode === 'login' ? 'Qué bueno verte' : 'Crea tu cuenta'}</h2><p>Ingresa para continuar tu aprendizaje semanal.</p>{authMode === 'signup' && <label>Nombre completo<input value={userName === 'Bienvenido' ? '' : userName} onChange={e => setUserName(e.target.value)} placeholder="Tu nombre completo"/></label>}<label>Correo electrónico<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre@correo.com"/></label><label>Contraseña<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"/></label>{authMessage && <div className="auth-message">{authMessage}</div>}<button className="button button-primary full-button" onClick={handleAuth}>{authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} <ChevronRight size={16}/></button><button className="text-button switch-auth" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMessage('') }}>{authMode === 'login' ? '¿Primera vez? Crea tu cuenta' : 'Ya tengo una cuenta'}</button>{!isSupabaseConfigured && <p className="modal-footnote">Modo de demostración: el registro real se activa al configurar Supabase.</p>}</div></div>}

      {showUpload && <div className="modal-backdrop" onClick={() => setShowUpload(false)}><div className="modal-card modal-wide" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setShowUpload(false)} aria-label="Cerrar"><X size={19}/></button><span className="eyebrow">CONTENIDO SEMANAL</span><h2>Nueva lección</h2><p>Prepara el contenido para los alumnos.</p><label>Título de la lección<input value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} placeholder="Ej. La importancia de la oración"/></label><label>Resumen o contenido<textarea value={newLessonText} onChange={e => setNewLessonText(e.target.value)} placeholder="Escribe el resumen, objetivo o enseñanza principal..." rows={5}/></label><label className="upload-drop" htmlFor="lesson-image"><ImagePlus size={24}/><strong>{previewImage ? 'Imagen seleccionada' : 'Agregar imagen alusiva'}</strong><span>JPG, PNG o WebP · La carga permanente requiere configurar almacenamiento.</span></label><input id="lesson-image" type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { const file = e.target.files?.[0]; if (file) setPreviewImage(URL.createObjectURL(file)) }}/>{previewImage && <img className="image-preview" src={previewImage} alt="Vista previa de la imagen de la lección"/>}<div className="modal-actions"><button className="button button-outline" onClick={() => setShowUpload(false)}>Cancelar</button><button className="button button-primary" disabled={!newLessonTitle.trim() || !newLessonText.trim()} onClick={publishLesson}>Vista previa en la app <ChevronRight size={16}/></button></div><p className="modal-footnote">En esta primera maqueta el contenido se muestra localmente. La publicación permanente se habilitará al conectar la base de datos.</p></div></div>}
    </div>
  )
}

export default App