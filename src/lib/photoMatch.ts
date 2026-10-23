// Correspondencia entre lo que el modelo ve en la foto y la tabla foods (pura).
// Se usa el mismo buscador que el tracker (search_foods + rankFoodMatches), así
// cuentan los alias regionales. Sin coincidencia razonable → null: la alumna lo
// busca ella; nunca se inventan calorías.
import { matchTier, rankFoodMatches, type SearchableFood } from '@/lib/foodSearch'
import { normalizeFoodName } from '@/lib/mealMath'

export function photoSearchQuery(name: string): string {
  return normalizeFoodName(name).slice(0, 60)
}

// Entre los mejores candidatos (mismo nivel de coincidencia), prefiere el que
// tiene la misma preparación que se ve en la foto (cocido, crudo, frito…).
export function pickFoodMatch<T extends SearchableFood & { prep_state?: string | null }>(
  candidates: T[],
  query: string,
  prep: string,
): T | null {
  if (query.length < 2) return null
  const ranked = rankFoodMatches(candidates, query, 10)
  if (ranked.length === 0) return null
  const bestTier = matchTier(ranked[0], query)
  const best = ranked.filter((f) => matchTier(f, query) === bestTier)
  return best.find((f) => f.prep_state === prep) ?? ranked[0]
}
