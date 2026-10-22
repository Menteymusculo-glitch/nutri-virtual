import { describe, it, expect } from 'vitest'
import { kcalFor, sumNutrients, normalizeFoodName } from '@/lib/mealMath'

const arroz = { kcal_100g: 130, protein_100g: 2.7, carbs_100g: 28.2, fat_100g: 0.3 }

describe('kcalFor', () => {
  it('escala por gramos', () => {
    expect(kcalFor(arroz, 150)).toEqual({ kcal: 195, protein: 4.1, carbs: 42.3, fat: 0.5 })
  })
  it('redondea kcal a entero', () => {
    expect(kcalFor({ kcal_100g: 143 }, 55).kcal).toBe(79) // 78.65
  })
  it('macros desconocidos → null', () => {
    expect(kcalFor({ kcal_100g: 100, protein_100g: null }, 100).protein).toBeNull()
  })
  it('gramos inválidos → 0', () => {
    expect(kcalFor(arroz, 0).kcal).toBe(0)
    expect(kcalFor(arroz, -5).kcal).toBe(0)
    expect(kcalFor(arroz, NaN).kcal).toBe(0)
  })
  it('acepta numeric de Postgres como string', () => {
    expect(kcalFor({ kcal_100g: '130' as unknown as number }, 100).kcal).toBe(130)
  })
})

describe('sumNutrients', () => {
  it('suma y redondea', () => {
    const t = sumNutrients([kcalFor(arroz, 150), { kcal: 100, protein: 10.05, carbs: null, fat: 1 }])
    expect(t).toEqual({ kcal: 295, protein: 14.2, carbs: 42.3, fat: 1.5 })
  })
  it('lista vacía → ceros', () => {
    expect(sumNutrients([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('normalizeFoodName', () => {
  it('minúsculas, sin acentos ni signos', () => {
    expect(normalizeFoodName('  Plátano  Maduro (frito)! ')).toBe('platano maduro frito')
    expect(normalizeFoodName('Café con leche')).toBe('cafe con leche')
    expect(normalizeFoodName('Ñame')).toBe('name')
  })
})
