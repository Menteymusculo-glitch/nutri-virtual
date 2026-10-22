// Gasto energético: BMR, TDEE y objetivo calórico.
// Todo es una ESTIMACIÓN: las ecuaciones tienen un error típico de ±10%.
import { kcalFloor, type Sex } from '@/lib/nutritionConstants'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'deficit' | 'maintenance' | 'surplus'

// Factores de actividad clásicos (McArdle, Katch & Katch, "Exercise Physiology").
// Son los mismos que usa el generador de planes (src/lib/systemPrompt.ts).
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

// Multiplicadores sobre el TDEE por objetivo (decisión de producto de Ray):
// déficit moderado del 15% y superávit del 10%.
export const GOAL_FACTORS: Record<Goal, number> = {
  deficit: 0.85,
  maintenance: 1,
  surplus: 1.1,
}

// Mifflin-St Jeor (1990), la ecuación más precisa sin conocer la composición corporal
// (Frankenfield et al., J Am Diet Assoc 2005).
export function mifflinStJeor(p: { sex: Sex; weightKg: number; heightCm: number; age: number }): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age
  return base + (p.sex === 'male' ? 5 : -161)
}

// Katch-McArdle: BMR = 370 + 21.6 × masa magra (kg). Más precisa cuando se conoce
// la masa magra (p. ej. de la calculadora US Navy, src/lib/bodyFat.ts).
export function katchMcArdle(leanMassKg: number): number {
  return 370 + 21.6 * leanMassKg
}

export interface EnergyInput {
  sex: Sex
  weightKg: number
  heightCm: number
  age: number
  activity: ActivityLevel
  // Opcional: % de grasa (US Navy) o masa magra directa. Si hay alguno, se usa Katch-McArdle.
  bodyFatPct?: number | null
  leanMassKg?: number | null
}

export type EnergyValidation = { ok: true } | { ok: false; error: string }

export function validateEnergyInput(p: Partial<EnergyInput>): EnergyValidation {
  if (p.sex !== 'female' && p.sex !== 'male') return { ok: false, error: 'Indica tu sexo biológico.' }
  if (!isFinite(p.weightKg as number) || (p.weightKg as number) < 30 || (p.weightKg as number) > 300) {
    return { ok: false, error: 'El peso debe estar entre 30 y 300 kg.' }
  }
  if (!isFinite(p.heightCm as number) || (p.heightCm as number) < 120 || (p.heightCm as number) > 230) {
    return { ok: false, error: 'La altura debe estar entre 120 y 230 cm.' }
  }
  if (!isFinite(p.age as number) || (p.age as number) < 16 || (p.age as number) > 100) {
    return { ok: false, error: 'La edad debe estar entre 16 y 100 años.' }
  }
  if (!p.activity || !(p.activity in ACTIVITY_FACTORS)) return { ok: false, error: 'Elige tu nivel de actividad.' }
  if (p.bodyFatPct != null && (!isFinite(p.bodyFatPct) || p.bodyFatPct < 3 || p.bodyFatPct > 70)) {
    return { ok: false, error: 'El % de grasa debe estar entre 3 y 70.' }
  }
  return { ok: true }
}

function resolveLeanMass(p: EnergyInput): number | null {
  if (p.leanMassKg != null && isFinite(p.leanMassKg) && p.leanMassKg > 0 && p.leanMassKg < p.weightKg) {
    return p.leanMassKg
  }
  if (p.bodyFatPct != null && isFinite(p.bodyFatPct) && p.bodyFatPct > 0 && p.bodyFatPct < 100) {
    return p.weightKg * (1 - p.bodyFatPct / 100)
  }
  return null
}

export function bmr(p: EnergyInput): { kcal: number; method: 'katch_mcardle' | 'mifflin_st_jeor' } {
  const lean = resolveLeanMass(p)
  if (lean !== null) return { kcal: Math.round(katchMcArdle(lean)), method: 'katch_mcardle' }
  return { kcal: Math.round(mifflinStJeor(p)), method: 'mifflin_st_jeor' }
}

export function tdee(bmrKcal: number, activity: ActivityLevel): number {
  return Math.round(bmrKcal * ACTIVITY_FACTORS[activity])
}

// Objetivo diario según meta, nunca por debajo del suelo calórico.
export function targetKcal(tdeeKcal: number, goal: Goal, sex: Sex | null | undefined): number {
  return Math.max(Math.round(tdeeKcal * GOAL_FACTORS[goal]), kcalFloor(sex))
}

export function computeEnergy(p: EnergyInput, goal: Goal) {
  const b = bmr(p)
  const t = tdee(b.kcal, p.activity)
  return { bmrKcal: b.kcal, method: b.method, tdeeKcal: t, targetKcal: targetKcal(t, goal, p.sex) }
}
