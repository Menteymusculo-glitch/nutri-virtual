// Validación de entrada de las rutas del tracker (pura, sin red).
import { isValidDate } from '@/lib/calorieReport'
import { validateEnergyInput, type ActivityLevel, type Goal, type EnergyInput } from '@/lib/energy'

export const MEAL_TYPES = ['desayuno', 'almuerzo', 'cena', 'snack'] as const
export type MealType = typeof MEAL_TYPES[number]
export const GOALS: Goal[] = ['deficit', 'maintenance', 'surplus']
export const MAX_ITEMS_PER_MEAL = 30
export const MAX_GRAMS = 3000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Ruta de una foto de comida en el bucket: {user_id}/{uuid}.jpg
const PHOTO_PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/
export const isUuid = (s: unknown): s is string => typeof s === 'string' && UUID_RE.test(s)

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export interface MealItemInput {
  food_id: string
  grams: number
  confidence: 'alta' | 'media' | 'baja' | null
}

export interface MealInput {
  log_date: string
  meal_type: MealType | null
  source: 'manual' | 'photo'
  photo_path: string | null
  items: MealItemInput[]
}

export function parseMealInput(body: unknown): Result<MealInput> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Cuerpo de la petición inválido.' }
  const b = body as Record<string, unknown>

  if (!isValidDate(b.log_date)) return { ok: false, error: 'Fecha inválida (formato AAAA-MM-DD).' }

  let meal_type: MealType | null = null
  if (b.meal_type != null && b.meal_type !== '') {
    if (!MEAL_TYPES.includes(b.meal_type as MealType)) return { ok: false, error: 'Tipo de comida inválido.' }
    meal_type = b.meal_type as MealType
  }

  const source = b.source ?? 'manual'
  if (source !== 'manual' && source !== 'photo') return { ok: false, error: 'Origen inválido.' }

  let photo_path: string | null = null
  if (b.photo_path != null) {
    if (source !== 'photo' || typeof b.photo_path !== 'string' || !PHOTO_PATH_RE.test(b.photo_path)) {
      return { ok: false, error: 'Foto inválida.' }
    }
    photo_path = b.photo_path
  }

  if (!Array.isArray(b.items) || b.items.length === 0) {
    return { ok: false, error: 'Añade al menos un alimento.' }
  }
  if (b.items.length > MAX_ITEMS_PER_MEAL) {
    return { ok: false, error: `Máximo ${MAX_ITEMS_PER_MEAL} alimentos por comida.` }
  }

  const items: MealItemInput[] = []
  for (const raw of b.items) {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'Alimento inválido.' }
    const it = raw as Record<string, unknown>
    if (!isUuid(it.food_id)) return { ok: false, error: 'Elige un alimento de la lista para cada elemento.' }
    const grams = Number(it.grams)
    if (!isFinite(grams) || grams <= 0 || grams > MAX_GRAMS) {
      return { ok: false, error: `Los gramos deben estar entre 1 y ${MAX_GRAMS}.` }
    }
    const conf = it.confidence
    const confidence = conf === 'alta' || conf === 'media' || conf === 'baja' ? conf : null
    items.push({ food_id: it.food_id, grams: Math.round(grams * 10) / 10, confidence })
  }

  return { ok: true, value: { log_date: b.log_date, meal_type, source, photo_path, items } }
}

export interface TargetInput {
  goal?: Goal
  hide_calories?: boolean
  profile?: EnergyInput
}

export function parseTargetInput(body: unknown): Result<TargetInput> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Cuerpo de la petición inválido.' }
  const b = body as Record<string, unknown>
  const out: TargetInput = {}

  if (b.goal !== undefined) {
    if (!GOALS.includes(b.goal as Goal)) return { ok: false, error: 'Objetivo inválido.' }
    out.goal = b.goal as Goal
  }
  if (b.hide_calories !== undefined) {
    if (typeof b.hide_calories !== 'boolean') return { ok: false, error: 'Valor de "ocultar calorías" inválido.' }
    out.hide_calories = b.hide_calories
  }
  if (b.profile !== undefined) {
    if (!b.profile || typeof b.profile !== 'object') return { ok: false, error: 'Datos de perfil inválidos.' }
    const p = b.profile as Record<string, unknown>
    const num = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v))
    const profile: Partial<EnergyInput> = {
      sex: p.sex as EnergyInput['sex'],
      weightKg: num(p.weightKg),
      heightCm: num(p.heightCm),
      age: num(p.age),
      activity: p.activity as ActivityLevel,
      bodyFatPct: num(p.bodyFatPct) ?? null,
    }
    const v = validateEnergyInput(profile)
    if (!v.ok) return { ok: false, error: v.error }
    out.profile = profile as EnergyInput
  }

  if (out.goal === undefined && out.hide_calories === undefined && out.profile === undefined) {
    return { ok: false, error: 'No hay cambios que guardar.' }
  }
  return { ok: true, value: out }
}
