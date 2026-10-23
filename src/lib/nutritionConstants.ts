// Constantes de seguridad y reglas del tracker de calorías.
// Un único sitio para que Ray las revise y ajuste.

// Suelo calórico universal: nunca sugerimos ni fijamos un objetivo por debajo de
// 1.200 kcal/día, sin distinguir sexo (decisión de producto de Ray).
export const KCAL_FLOOR = 1200

// Estado del día: desviación respecto al objetivo dentro de ±10% = "en tu zona".
export const ZONE_TOLERANCE_PCT = 10
// Dentro de ±1% se muestra "justo en tu objetivo".
export const ON_TARGET_TOLERANCE_PCT = 1
// Déficit / mantenimiento / superávit respecto al TDEE: ±5% = mantenimiento.
export const MAINTENANCE_TOLERANCE_PCT = 5

// Ajuste semanal: ventana, mínimo de días con registro y tope de ajuste.
export const WEEK_WINDOW_DAYS = 7
export const MIN_LOGGED_DAYS_FOR_ADJUSTMENT = 3
// El ajuste sugerido nunca supera este % del objetivo diario por semana.
export const MAX_WEEKLY_ADJUSTMENT_PCT = 10

export type Sex = 'female' | 'male'

// Se mantiene la firma (con sexo) por compatibilidad; el suelo es el mismo para todas.
export function kcalFloor(sex?: Sex | null): number {
  void sex
  return KCAL_FLOOR
}

// ── Fotos de comida (Fase 2) ─────────────────────────────────────────────────
// Análisis de foto por usuaria en las últimas 24 h. Cuentan los intentos de
// análisis (aunque no se guarde la comida), no solo los guardados.
export const PHOTO_DAILY_QUOTA_NUTRI_APP = 5
export const PHOTO_DAILY_QUOTA_DEFAULT = 15
// Tope por IP en 24 h, además del de cada usuaria: si una cuenta se ve
// comprometida o se comparten credenciales, no se dispara el gasto.
export const PHOTO_IP_DAILY_MAX = 40
export const PHOTO_QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000
// Las fotos se borran a los 30 días (cron /api/cron/purge-photos).
export const PHOTO_RETENTION_DAYS = 30
