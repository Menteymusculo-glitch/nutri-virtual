// Validación estricta de la respuesta del modelo de visión (pura, sin red).
// La salida del modelo NO es de fiar: una foto puede llevar texto escrito que
// intente darle órdenes. Por eso solo se conservan cuatro campos validados
// (nombre, gramos, preparación, confianza); cualquier otro campo —por ejemplo
// kcal— se descarta. Las calorías salen siempre de la tabla foods.
import { PREP_LABELS } from '@/lib/foodSearch'
import { MAX_GRAMS } from '@/lib/trackerValidation'

export const VISION_MAX_ITEMS = 12
export const VISION_NAME_MAX = 60
const NAME_MAX_WORDS = 8

export type PhotoConfidence = 'alta' | 'media' | 'baja'
export const PHOTO_PREPS = Object.keys(PREP_LABELS)
export const DEFAULT_PHOTO_PREP = 'cocido'

export interface VisionItem {
  name: string
  grams: number
  prep: string
  confidence: PhotoConfidence
}

export interface VisionOutput {
  items: VisionItem[]
  noFood: boolean
  dropped: number // elementos descartados por no cumplir el esquema
}

// Letras (con acentos), números, espacios y puntuación básica de un nombre de alimento.
const NAME_RE = /^[\p{L}\p{M}\p{N} ,.'()\-/%&]+$/u
const URL_RE = /(https?:|www\.|\.com\b|@)/i

export function cleanVisionName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  // Sin saltos de línea ni caracteres de control; espacios múltiples a uno.
  const name = raw.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (name.length < 2 || name.length > VISION_NAME_MAX) return null
  if (!NAME_RE.test(name) || URL_RE.test(name)) return null
  if (name.split(' ').length > NAME_MAX_WORDS) return null
  return name
}

function cleanGrams(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\s*\d+([.,]\d+)?\s*$/.test(raw) ? Number(raw.replace(',', '.')) : NaN
  if (!Number.isFinite(n)) return null
  const g = Math.round(n)
  return g >= 1 && g <= MAX_GRAMS ? g : null
}

function parseItem(raw: unknown): VisionItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const name = cleanVisionName(r.name)
  const grams = cleanGrams(r.grams)
  if (!name || grams === null) return null
  const prep = typeof r.prep === 'string' && PHOTO_PREPS.includes(r.prep) ? r.prep : DEFAULT_PHOTO_PREP
  const confidence: PhotoConfidence = r.confidence === 'alta' || r.confidence === 'media' ? r.confidence : 'baja'
  return { name, grams, prep, confidence }
}

// Extrae el JSON aunque venga envuelto en ```json … ``` o con texto alrededor.
function extractJson(text: string): unknown {
  const attempts = [text, text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')]
  const block = text.match(/\{[\s\S]*\}/)
  if (block) attempts.push(block[0])
  for (const a of attempts) {
    try { return JSON.parse(a) } catch { /* siguiente intento */ }
  }
  return null
}

export function parseVisionOutput(text: string): VisionOutput {
  const json = extractJson(text)
  const obj = json && typeof json === 'object' ? json as Record<string, unknown> : null
  const rawItems = Array.isArray(json) ? json : Array.isArray(obj?.items) ? obj!.items as unknown[] : []

  const items: VisionItem[] = []
  let dropped = 0
  for (const raw of rawItems) {
    if (items.length >= VISION_MAX_ITEMS) { dropped++; continue }
    const it = parseItem(raw)
    if (it) items.push(it)
    else dropped++
  }
  // Si el modelo dice no_food pero da elementos válidos, mandan los elementos (la alumna revisa).
  return { items, noFood: items.length === 0, dropped }
}

// "No logro distinguir bien el plato": no hay elementos o más de la mitad tienen confianza baja.
export function isLowConfidence(items: Pick<VisionItem, 'confidence'>[]): boolean {
  if (items.length === 0) return true
  return items.filter((i) => i.confidence === 'baja').length > items.length / 2
}
