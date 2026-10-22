import { describe, it, expect } from 'vitest'
import { matchTier, matchesQuery, rankFoodMatches, FUZZY_MIN_SIMILARITY } from '@/lib/foodSearch'

const food = (name_norm: string, extra: { aliases?: string[]; quality?: string; sim?: number } = {}) => ({ name_norm, ...extra })

describe('matchesQuery', () => {
  it('todas las palabras deben estar en nombre o alias', () => {
    expect(matchesQuery(food('pechuga de pollo a la plancha'), 'pollo plancha')).toBe(true)
    expect(matchesQuery(food('pechuga de pollo', { aliases: ['chicken breast'] }), 'pollo breast')).toBe(true)
    expect(matchesQuery(food('pechuga de pollo'), 'pollo frito')).toBe(false)
    expect(matchesQuery(food('pollo'), '')).toBe(false)
  })
})

describe('matchTier', () => {
  it('ordena exacto → alias → empieza por → inicio de palabra → contiene → parecido', () => {
    expect(matchTier(food('pollo'), 'pollo')).toBe(0)
    expect(matchTier(food('banana', { aliases: ['cambur'] }), 'cambur')).toBe(1)
    expect(matchTier(food('pollo asado'), 'pollo')).toBe(2)
    expect(matchTier(food('banana', { aliases: ['cambur maduro'] }), 'cambur')).toBe(3)
    expect(matchTier(food('arroz con pollo'), 'pollo')).toBe(4)
    expect(matchTier(food('x', { aliases: ['arroz con pollo'] }), 'pollo')).toBe(5)
    expect(matchTier(food('repollo'), 'pollo')).toBe(6)
    expect(matchTier(food('pechuga de pollo'), 'pechuga pollo')).toBe(7)
    expect(matchTier(food('brocoli crudo', { sim: FUZZY_MIN_SIMILARITY }), 'brocolli')).toBe(8)
    expect(matchTier(food('brocoli crudo', { sim: 0.3 }), 'brocolli')).toBeNull()
  })
})

describe('rankFoodMatches', () => {
  it('prioriza los que empiezan por la consulta, luego inicio de palabra', () => {
    const foods = [food('arroz con pollo'), food('pollo'), food('pechuga de pollo'), food('repollo')]
    expect(rankFoodMatches(foods, 'pollo').map((f) => f.name_norm)).toEqual([
      'pollo', 'arroz con pollo', 'pechuga de pollo', 'repollo',
    ])
  })

  it('a igualdad de coincidencia, primero la calidad más fiable', () => {
    const foods = [
      food('arepa casera', { quality: 'approx' }),
      food('arepa frita', { quality: 'usda' }),
      food('arepa rellena', { quality: 'reviewed' }),
    ]
    expect(rankFoodMatches(foods, 'arepa').map((f) => f.quality)).toEqual(['reviewed', 'usda', 'approx'])
  })

  it('una coincidencia real va antes que un parecido aunque el parecido sea USDA', () => {
    const foods = [food('brocoli crudo', { quality: 'usda', sim: 0.9 }), food('brocolli casero', { quality: 'approx' })]
    expect(rankFoodMatches(foods, 'brocolli').map((f) => f.name_norm)).toEqual(['brocolli casero', 'brocoli crudo'])
  })

  it('descarta lo que no coincide y respeta el límite', () => {
    expect(rankFoodMatches([food('pan'), food('leche')], 'pan')).toHaveLength(1)
    expect(rankFoodMatches(Array(30).fill(food('pan')), 'pan', 20)).toHaveLength(20)
  })
})
