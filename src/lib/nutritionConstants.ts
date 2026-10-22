// Constantes de seguridad y reglas del tracker de calorías.
// Un único sitio para que Ray las revise y ajuste.

// TODO(Ray): confirmar los suelos calóricos. Valores habituales en la literatura
// clínica para dietas sin supervisión médica (NIH/NHLBI 1998, "Clinical Guidelines
// on the Identification, Evaluation, and Treatment of Overweight and Obesity").
export const KCAL_FLOOR_FEMALE = 1200
export const KCAL_FLOOR_MALE = 1500

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

// Si no sabemos el sexo, usamos el suelo más alto (más protector).
export function kcalFloor(sex: Sex | null | undefined): number {
  if (sex === 'female') return KCAL_FLOOR_FEMALE
  return KCAL_FLOOR_MALE
}
