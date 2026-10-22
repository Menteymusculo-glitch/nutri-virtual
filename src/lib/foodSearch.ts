// Búsqueda de alimentos (pura, sin red). La base de datos devuelve candidatos
// con search_foods(q) (sql/phase-foods-intl.sql); aquí se decide el orden.
//
// Orden: nombre exacto → alias exacto → nombre que empieza por la consulta →
// alias que empieza por ella → coincidencia al inicio de una palabra → resto
// de coincidencias → parecidos (erratas, vía pg_trgm). A igualdad, primero la
// calidad del dato más fiable.

export type FoodQuality = 'usda' | 'off' | 'bedca' | 'approx' | 'reviewed'

export const QUALITY_RANK: Record<FoodQuality, number> = { reviewed: 0, usda: 1, bedca: 2, off: 3, approx: 4 }

// Similitud mínima (word_similarity de pg_trgm) para aceptar un parecido. Igual que en el SQL.
export const FUZZY_MIN_SIMILARITY = 0.6

export interface SearchableFood {
  name_norm: string
  aliases?: string[] | null
  quality?: string | null
  sim?: number | null
}

const startsWord = (text: string, q: string) => text.startsWith(q) || text.includes(` ${q}`)

// Igual que el filtro de search_foods: todas las palabras de q aparecen en nombre + alias.
export function matchesQuery(food: SearchableFood, q: string): boolean {
  const haystack = `${food.name_norm} ${(food.aliases ?? []).join(' ')}`
  const tokens = q.split(' ').filter(Boolean)
  return tokens.length > 0 && tokens.every((t) => haystack.includes(t))
}

// 0 = mejor. null = no coincide.
export function matchTier(food: SearchableFood, q: string): number | null {
  const aliases = food.aliases ?? []
  if (food.name_norm === q) return 0
  if (aliases.includes(q)) return 1
  if (food.name_norm.startsWith(q)) return 2
  if (aliases.some((a) => a.startsWith(q))) return 3
  if (startsWord(food.name_norm, q)) return 4
  if (aliases.some((a) => startsWord(a, q))) return 5
  if (food.name_norm.includes(q) || aliases.some((a) => a.includes(q))) return 6
  if (matchesQuery(food, q)) return 7
  if ((food.sim ?? 0) >= FUZZY_MIN_SIMILARITY) return 8
  return null
}

const qualityRank = (q: string | null | undefined) => QUALITY_RANK[q as FoodQuality] ?? QUALITY_RANK.approx

export function rankFoodMatches<T extends SearchableFood>(foods: T[], q: string, limit = 20): T[] {
  return foods
    .map((f) => ({ f, tier: matchTier(f, q) }))
    .filter((x): x is { f: T; tier: number } => x.tier !== null)
    .sort((a, b) =>
      a.tier - b.tier
      || qualityRank(a.f.quality) - qualityRank(b.f.quality)
      || (b.f.sim ?? 0) - (a.f.sim ?? 0)
      || a.f.name_norm.length - b.f.name_norm.length
      || a.f.name_norm.localeCompare(b.f.name_norm))
    .slice(0, limit)
    .map((x) => x.f)
}

export const PREP_LABELS: Record<string, string> = {
  crudo: 'crudo',
  cocido: 'cocido',
  frito: 'frito',
  horneado: 'al horno',
  a_la_plancha: 'a la plancha',
  envasado: 'envasado',
  bebida: 'bebida',
  otro: 'preparado',
}
