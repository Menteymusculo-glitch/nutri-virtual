import { describe, it, expect } from 'vitest'
import { parseMealInput, parseTargetInput, rankFoods, isUuid } from '@/lib/trackerValidation'

const FOOD = '11111111-1111-4111-8111-111111111111'
const okMeal = { log_date: '2026-10-22', meal_type: 'almuerzo', items: [{ food_id: FOOD, grams: 150 }] }

describe('parseMealInput', () => {
  it('acepta una comida válida y aplica valores por defecto', () => {
    const r = parseMealInput(okMeal)
    expect(r).toEqual({
      ok: true,
      value: { log_date: '2026-10-22', meal_type: 'almuerzo', source: 'manual', items: [{ food_id: FOOD, grams: 150, confidence: null }] },
    })
  })

  it('ignora kcal enviadas por el cliente', () => {
    const r = parseMealInput({ ...okMeal, items: [{ food_id: FOOD, grams: 100, kcal: 1 }] })
    if (!r.ok) throw new Error(r.error)
    expect(r.value.items[0]).not.toHaveProperty('kcal')
  })

  it('meal_type opcional', () => {
    const r = parseMealInput({ ...okMeal, meal_type: undefined })
    expect(r.ok && r.value.meal_type).toBeNull()
  })

  it.each([
    ['fecha inválida', { ...okMeal, log_date: '2026-13-01' }],
    ['tipo inválido', { ...okMeal, meal_type: 'merienda' }],
    ['sin items', { ...okMeal, items: [] }],
    ['food_id no uuid', { ...okMeal, items: [{ food_id: 'abc', grams: 100 }] }],
    ['gramos 0', { ...okMeal, items: [{ food_id: FOOD, grams: 0 }] }],
    ['gramos > 3000', { ...okMeal, items: [{ food_id: FOOD, grams: 3001 }] }],
    ['gramos texto', { ...okMeal, items: [{ food_id: FOOD, grams: 'mucho' }] }],
    ['origen inválido', { ...okMeal, source: 'ai' }],
    ['demasiados items', { ...okMeal, items: Array(31).fill({ food_id: FOOD, grams: 10 }) }],
    ['cuerpo nulo', null],
  ])('rechaza: %s', (_label, body) => {
    expect(parseMealInput(body).ok).toBe(false)
  })
})

describe('parseTargetInput', () => {
  const profile = { sex: 'female', age: 45, weightKg: 70, heightCm: 165, activity: 'light' }

  it('acepta alta con objetivo y perfil (números como texto)', () => {
    const r = parseTargetInput({ goal: 'deficit', profile: { ...profile, age: '45', bodyFatPct: '' } })
    if (!r.ok) throw new Error(r.error)
    expect(r.value.profile).toMatchObject({ age: 45, bodyFatPct: null })
  })

  it('acepta solo hide_calories', () => {
    expect(parseTargetInput({ hide_calories: true })).toEqual({ ok: true, value: { hide_calories: true } })
  })

  it.each([
    ['objetivo inválido', { goal: 'bulk' }],
    ['hide no booleano', { hide_calories: 'si' }],
    ['perfil incompleto', { goal: 'deficit', profile: { sex: 'female' } }],
    ['sin cambios', {}],
  ])('rechaza: %s', (_label, body) => {
    expect(parseTargetInput(body).ok).toBe(false)
  })
})

describe('rankFoods', () => {
  it('prioriza los que empiezan por la consulta, luego inicio de palabra', () => {
    const foods = [
      { name_norm: 'arroz con pollo' },
      { name_norm: 'pollo' },
      { name_norm: 'pechuga de pollo' },
      { name_norm: 'repollo' },
    ]
    expect(rankFoods(foods, 'pollo').map((f) => f.name_norm)).toEqual([
      'pollo', 'arroz con pollo', 'pechuga de pollo', 'repollo',
    ])
  })
  it('respeta el límite', () => {
    expect(rankFoods(Array(30).fill({ name_norm: 'pan' }), 'pan', 20)).toHaveLength(20)
  })
})

describe('isUuid', () => {
  it('valida uuids', () => {
    expect(isUuid(FOOD)).toBe(true)
    expect(isUuid('nope')).toBe(false)
  })
})
