import { describe, it, expect } from 'vitest'
import { createSearchCache, searchCacheKey } from '@/lib/searchCache'

describe('searchCacheKey', () => {
  it('ignora mayúsculas, acentos y espacios de más', () => {
    expect(searchCacheKey('  Plátano  Maduro ')).toBe('platano maduro')
    expect(searchCacheKey('PLATANO maduro')).toBe('platano maduro')
  })
})

describe('createSearchCache', () => {
  it('devuelve lo guardado para la misma consulta escrita distinto', () => {
    const c = createSearchCache<number[]>()
    c.set('Pollo', [1, 2])
    expect(c.get('pollo ')).toEqual([1, 2])
    expect(c.get('pollo asado')).toBeUndefined()
  })

  it('guarda también resultados vacíos', () => {
    const c = createSearchCache<number[]>()
    c.set('zzz', [])
    expect(c.get('zzz')).toEqual([])
  })

  it('al pasarse del límite descarta la consulta usada hace más tiempo', () => {
    const c = createSearchCache<number>(2)
    c.set('a1', 1)
    c.set('b2', 2)
    c.get('a1') // a1 pasa a ser la más reciente
    c.set('c3', 3)
    expect(c.size).toBe(2)
    expect(c.get('b2')).toBeUndefined()
    expect(c.get('a1')).toBe(1)
    expect(c.get('c3')).toBe(3)
  })
})
