import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases de Tailwind de forma segura. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea una fecha al español. */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

/** Formatea una fecha corta. */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Calcula el porcentaje y lo redondea. */
export function calcPercent(value: number, max: number): number {
  if (max === 0) return 0
  return Math.round((value / max) * 100)
}

/** Normaliza una puntuación a escala 0-100. */
export function normalizeScore(earned: number, max: number): number {
  if (max === 0) return 0
  return Math.round((earned / max) * 100)
}

/** Devuelve el color de la nota según el puntaje. */
export function scoreColor(score: number): string {
  if (score >= 90) return 'text-success-600'
  if (score >= 70) return 'text-gold-600'
  if (score >= 50) return 'text-warning-600'
  return 'text-danger-600'
}

/** Devuelve la etiqueta de la nota. */
export function scorelabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 80) return 'Muy bueno'
  if (score >= 70) return 'Bueno'
  if (score >= 60) return 'Aceptable'
  if (score >= 50) return 'Suficiente'
  return 'Necesita mejorar'
}

/** Iniciales del nombre. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

/** Trunca un texto a la longitud indicada. */
export function truncate(text: string, length = 120): string {
  return text.length > length ? text.slice(0, length).trimEnd() + '…' : text
}
