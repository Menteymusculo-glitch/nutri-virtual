// Validación de /api/save-plan y /api/save-checkin (pura, sin red).
// Nunca se acepta user_id, email ni id del cuerpo: el dueño sale de la sesión.

export const MAX_PLAN_BODY_BYTES = 256 * 1024 // un plan semanal completo ocupa ~20-60 KB
export const MAX_CHECKIN_BODY_BYTES = 16 * 1024
const MAX_NAME = 100
const MAX_TEXT = 2000

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length >= 1 && s.length <= MAX_NAME ? s : null
}

export interface PlanInput {
  name: string
  profile: Record<string, unknown>
  plan: Record<string, unknown>
}

export function parsePlanInput(body: unknown): Result<PlanInput> {
  if (!isPlainObject(body)) return { ok: false, error: 'Cuerpo de la petición inválido.' }
  const { profile, plan } = body
  if (!isPlainObject(profile)) return { ok: false, error: 'Falta el perfil.' }
  if (!isPlainObject(plan)) return { ok: false, error: 'Falta el plan.' }
  const name = cleanName(profile.name)
  if (!name) return { ok: false, error: `El nombre es obligatorio (máx. ${MAX_NAME} caracteres).` }
  if (!Array.isArray(plan.days) || plan.days.length === 0 || plan.days.length > 14) {
    return { ok: false, error: 'El plan no tiene un formato válido.' }
  }
  // Quitamos cualquier identificador que intente colarse dentro del perfil.
  const { user_id: _u, email: _e, id: _i, ...safeProfile } = profile
  void _u; void _e; void _i
  return { ok: true, value: { name, profile: { ...safeProfile, name }, plan } }
}

export interface CheckinInput {
  client_name: string
  week: number
  current_weight: number
  energy_level: number
  adherence: number
  digestion: number
  sleep: number
  notes: string
  successes: string
}

function intIn(v: unknown, min: number, max: number): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

function text(v: unknown): string | null {
  if (v === undefined || v === null) return ''
  if (typeof v !== 'string' || v.length > MAX_TEXT) return null
  return v.trim()
}

export function parseCheckinInput(body: unknown): Result<CheckinInput> {
  if (!isPlainObject(body)) return { ok: false, error: 'Cuerpo de la petición inválido.' }
  const client_name = cleanName(body.client_name)
  if (!client_name) return { ok: false, error: `Indica tu nombre (máx. ${MAX_NAME} caracteres).` }
  const week = intIn(body.week, 1, 520)
  if (week === null) return { ok: false, error: 'La semana debe ser un número entre 1 y 520.' }
  const w = Number(body.current_weight)
  if (!Number.isFinite(w) || w < 20 || w > 400) return { ok: false, error: 'Indica tu peso actual (entre 20 y 400 kg).' }

  const ratings: Record<string, number> = {}
  for (const k of ['energy_level', 'adherence', 'digestion', 'sleep'] as const) {
    const r = intIn(body[k], 1, 5)
    if (r === null) return { ok: false, error: 'Las valoraciones deben estar entre 1 y 5.' }
    ratings[k] = r
  }
  const notes = text(body.notes)
  const successes = text(body.successes)
  if (notes === null || successes === null) return { ok: false, error: `Las notas admiten hasta ${MAX_TEXT} caracteres.` }

  return {
    ok: true,
    value: {
      client_name, week, current_weight: Math.round(w * 10) / 10,
      energy_level: ratings.energy_level, adherence: ratings.adherence,
      digestion: ratings.digestion, sleep: ratings.sleep,
      notes, successes,
    },
  }
}
