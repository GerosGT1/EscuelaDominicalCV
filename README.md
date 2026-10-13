# Escuela Dominical Digital

Aplicación web progresiva (PWA) moderna, elegante y profesional para la gestión y estudio de lecciones bíblicas de la Escuela Dominical de las **Asambleas de Dios – Auditorium Cristo Viene, Santa Catarina Pinula**.

---

## 🏛️ Características Principales

- **Identidad Institucional:** Integración de los logotipos oficiales de la Escuela Dominical (Asambleas de Dios) y del Auditorium Cristo Viene. Paleta cromática en azul profundo, dorado elegante y blanco.
- **Roles y Permisos Granulares:**
  - 👑 **Administrador:** Gestión total de usuarios, roles, logotipos, configuraciones y reportes.
  - 📖 **Maestro:** Creación y publicación de lecciones completas, galería de imágenes ilustrativas, constructor interactivo de ejercicios y revisión de respuestas.
  - 🎓 **Alumno:** Consulta de lecciones semanales, estudio de referencias bíblicas, retos de la semana, resolución interactiva de ejercicios con calificación de 0 a 100 puntos y seguimiento de progreso.
- **PWA Instalable:** Manifiesto web, Service Worker y soporte offline para navegación fluida en dispositivos móviles Android, iOS y computadoras.
- **Evaluación Interactiva:** Soporte para preguntas de selección múltiple, verdadero/falso, completar espacios, respuesta corta y reflexión personal con auto-calificación y revisión manual.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18, TypeScript, Vite 6
- **Estilos & UI:** Tailwind CSS, Lucide React, Google Fonts (Inter & Lexend)
- **Estado Global:** Zustand con persistencia local
- **Formularios & Validación:** React Hook Form + Zod
- **Backend & Base de Datos:** Supabase (PostgreSQL 15, Auth, Row Level Security, Storage)
- **Despliegue Recomendado:** Cloudflare Pages (Gratuito, CDN global ultra-rápida)

---

## 🚀 Inicio Rápido en Desarrollo Local

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repositorio>
cd "App Escuela Dominical Digital"
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` como `.env`:

```bash
cp .env.example .env
```

Ingresa tus claves de Supabase obtenidas en [Supabase Dashboard](https://supabase.com/dashboard) > Proyecto > Project Settings > API:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
```

### 3. Ejecutar las migraciones en Supabase

1. Abre el panel de tu proyecto en Supabase.
2. Ve a **SQL Editor**.
3. Copia y pega el contenido del archivo `supabase/migrations/001_initial_schema.sql`.
4. Ejecuta el script (**Run**). Esto creará:
   - Todas las 13 tablas con relaciones e índices.
   - Políticas de seguridad por fila (RLS).
   - Trigger automático para creación de perfil de usuario tras el registro.
   - Buckets de almacenamiento `lesson-images` y `settings`.

### 4. Crear el primer Administrador

1. Regístrate en la aplicación desde `/auth/registro`.
2. En el panel de Supabase > **Table Editor** > tabla `profiles`:
3. Cambia el campo `role` de tu usuario de `student` a `admin`.
4. ¡Listo! Ya tendrás acceso completo a `/admin`.

### 5. Iniciar el servidor local

```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

---

## ☁️ Despliegue en Cloudflare Pages

1. Conecta tu repositorio de GitHub a [Cloudflare Pages](https://dash.cloudflare.com/).
2. Configuración de Build:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Agrega las variables de entorno en el panel de Cloudflare:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Haz clic en **Save and Deploy**. Tu aplicación estará disponible de inmediato en `escuela-dominical-digital.pages.dev`.

---

## 📂 Estructura del Proyecto

```text
├── public/
│   ├── logos/             # Logotipos oficiales (Escuela Dominical e Iglesia)
│   ├── icons/             # Iconos para PWA
│   └── manifest.json      # Manifiesto de la PWA
├── src/
│   ├── components/
│   │   ├── layout/        # Header, Sidebar, BottomNav, AppLayout
│   │   ├── shared/        # Guardias de ruta (RoleGuard, PublicOnlyGuard)
│   │   └── ui/            # Botones, Insignias, Modales, Spinner, etc.
│   ├── hooks/             # useAuth y hooks personalizados
│   ├── lib/               # Cliente Supabase y utilidades
│   ├── pages/
│   │   ├── admin/         # Panel, gestión de usuarios, logos, reportes
│   │   ├── auth/          # Login, Registro, Recuperación
│   │   ├── student/       # Dashboard, Lecciones, Ejercicios, Progreso
│   │   └── teacher/       # Editor de lecciones, Creador de ejercicios, etc.
│   ├── store/             # Zustand authStore
│   └── types/             # Definiciones TypeScript de la base de datos
├── supabase/
│   └── migrations/        # Scripts SQL de esquema y seguridad
└── tailwind.config.js     # Paleta azul profundo y dorada
```

---

## 📄 Licencia

Desarrollado para uso eclesiástico y educativo de la Escuela Dominical de las Asambleas de Dios, Auditorium Cristo Viene.
