/**
 * Rutas /api/meals: kcal recalculadas en servidor y borrado solo de comidas propias.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { state, mockFrom } = vi.hoisted(() => {
  const state = {
    user: { id: 'user-1' } as { id: string } | null,
    access: true,
    foods: [] as Record<string, unknown>[],
    insertedLogs: [] as Record<string, unknown>[],
    insertedItems: [] as Record<string, unknown>[],
    deleted: [] as Record<string, unknown>[],
    meals: [] as { id: string; user_id: string }[],
    itemsError: null as { message: string } | null,
  }

  function chain(table: string) {
    const filters: Record<string, unknown> = {}
    let op: 'select' | 'insert' | 'delete' = 'select'
    let payload: unknown = null
    const c: Record<string, unknown> = {}
    Object.assign(c, {
      select: () => c,
      in: (col: string, vals: unknown[]) => { filters[col] = vals; return c },
      eq: (col: string, val: unknown) => { filters[col] = val; return c },
      insert: (p: unknown) => { op = 'insert'; payload = p; return c },
      delete: () => { op = 'delete'; return c },
      single: async () => {
        if (table === 'meal_logs' && op === 'insert') {
          state.insertedLogs.push(payload as Record<string, unknown>)
          return { data: { id: 'meal-new' }, error: null }
        }
        return { data: null, error: null }
      },
      then: (resolve: (v: unknown) => void) => {
        if (table === 'foods') {
          const ids = filters.id as string[]
          return Promise.resolve({ data: state.foods.filter((f) => ids.includes(f.id as string)), error: null }).then(resolve)
        }
        if (table === 'meal_items' && op === 'insert') {
          if (!state.itemsError) state.insertedItems.push(...(payload as Record<string, unknown>[]))
          return Promise.resolve({ data: null, error: state.itemsError }).then(resolve)
        }
        if (table === 'meal_logs' && op === 'delete') {
          state.deleted.push({ ...filters })
          const before = state.meals.length
          state.meals = state.meals.filter((m) => !(m.id === filters.id && (!filters.user_id || m.user_id === filters.user_id)))
          return Promise.resolve({ count: before - state.meals.length, error: null }).then(resolve)
        }
        return Promise.resolve({ data: null, error: null }).then(resolve)
      },
    })
    return c
  }

  return { state, mockFrom: vi.fn((t: string) => chain(t)) }
})

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: { from: mockFrom },
  getServerUser: async () => state.user,
  hasTrackerAccess: async () => state.access,
}))

import { POST } from '@/app/api/meals/route'
import { DELETE } from '@/app/api/meals/[id]/route'

const ARROZ = '11111111-1111-4111-8111-111111111111'
const POLLO = '22222222-2222-4222-8222-222222222222'
const MEAL = '33333333-3333-4333-8333-333333333333'

function post(body: unknown) {
  return POST(new Request('http://x/api/meals', { method: 'POST', body: JSON.stringify(body) }) as never)
}
function del(id: string) {
  return DELETE(new Request('http://x', { method: 'DELETE' }), { params: Promise.resolve({ id }) })
}

beforeEach(() => {
  state.user = { id: 'user-1' }
  state.access = true
  state.foods = [
    { id: ARROZ, name: 'Arroz blanco cocido', kcal_100g: 130, protein_100g: 2.7, carbs_100g: 28.2, fat_100g: 0.3 },
    { id: POLLO, name: 'Pechuga de pollo', kcal_100g: 175, protein_100g: 26.4, carbs_100g: 0.1, fat_100g: 7.7 },
  ]
  state.insertedLogs = []
  state.insertedItems = []
  state.deleted = []
  state.meals = [{ id: MEAL, user_id: 'user-1' }]
  state.itemsError = null
})

describe('POST /api/meals', () => {
  it('401 sin sesión', async () => {
    state.user = null
    expect((await post({})).status).toBe(401)
  })

  it('403 sin plan con tracker', async () => {
    state.access = false
    expect((await post({})).status).toBe(403)
  })

  it('403 con una comida válida: no lee ni escribe nada a nombre de la usuaria', async () => {
    state.access = false
    const res = await post({ log_date: '2026-10-22', items: [{ food_id: ARROZ, grams: 100 }] })
    expect(res.status).toBe(403)
    expect(state.insertedLogs).toHaveLength(0)
    expect(state.insertedItems).toHaveLength(0)
  })

  it('JSON inválido: 401 sin sesión, 400 con sesión', async () => {
    const bad = () => POST(new Request('http://x/api/meals', { method: 'POST', body: '{nope' }) as never)
    state.user = null
    expect((await bad()).status).toBe(401)
    state.user = { id: 'user-1' }
    expect((await bad()).status).toBe(400)
  })

  it('400 con entrada inválida', async () => {
    const res = await post({ log_date: 'ayer', items: [] })
    expect(res.status).toBe(400)
  })

  it('recalcula kcal desde foods e ignora las del cliente', async () => {
    const res = await post({
      log_date: '2026-10-22', meal_type: 'almuerzo',
      items: [{ food_id: ARROZ, grams: 150, kcal: 1 }, { food_id: POLLO, grams: 120, kcal: 1 }],
      total_kcal: 2,
    })
    expect(res.status).toBe(201)
    // 130×1.5 = 195 ; 175×1.2 = 210
    expect(state.insertedItems.map((i) => i.kcal)).toEqual([195, 210])
    expect(state.insertedLogs[0]).toMatchObject({ user_id: 'user-1', total_kcal: 405, log_date: '2026-10-22' })
  })

  it('400 si un alimento no existe', async () => {
    const res = await post({ log_date: '2026-10-22', items: [{ food_id: MEAL, grams: 100 }] })
    expect(res.status).toBe(400)
    expect(state.insertedLogs).toHaveLength(0)
  })

  it('si fallan los items, borra la cabecera y devuelve 500', async () => {
    state.itemsError = { message: 'boom' }
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await post({ log_date: '2026-10-22', items: [{ food_id: ARROZ, grams: 100 }] })
    expect(res.status).toBe(500)
    expect(state.deleted).toContainEqual({ id: 'meal-new' })
    err.mockRestore()
  })
})

describe('DELETE /api/meals/[id]', () => {
  it('borra una comida propia', async () => {
    const res = await del(MEAL)
    expect(res.status).toBe(200)
    expect(state.deleted[0]).toEqual({ id: MEAL, user_id: 'user-1' })
  })

  it('404 si la comida es de otra usuaria', async () => {
    state.user = { id: 'user-2' }
    const res = await del(MEAL)
    expect(res.status).toBe(404)
    expect(state.meals).toHaveLength(1)
  })

  it('404 con id no uuid', async () => {
    expect((await del('abc')).status).toBe(404)
  })
})
