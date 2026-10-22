/**
 * GET /api/foods/search: sesión + acceso, búsqueda por nombre y alias vía
 * search_foods, orden en servidor y porciones caseras.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { state, mockRpc, mockFrom } = vi.hoisted(() => {
  const state = {
    user: { id: 'user-1' } as { id: string } | null,
    access: true,
    rpcRows: [] as Record<string, unknown>[],
    rpcError: null as { message: string } | null,
    portions: [] as Record<string, unknown>[],
    portionsError: null as { message: string } | null,
    portionIds: null as string[] | null,
  }
  const mockRpc = vi.fn(async () => ({ data: state.rpcRows, error: state.rpcError }))
  const mockFrom = vi.fn(() => {
    const c: Record<string, unknown> = {}
    Object.assign(c, {
      select: () => c,
      in: (_col: string, ids: string[]) => { state.portionIds = ids; return c },
      order: async () => ({
        data: state.portions.filter((p) => state.portionIds?.includes(p.food_id as string)),
        error: state.portionsError,
      }),
    })
    return c
  })
  return { state, mockRpc, mockFrom }
})

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: { rpc: mockRpc, from: mockFrom },
  getServerUser: async () => state.user,
  hasTrackerAccess: async () => state.access,
}))

import { GET } from '@/app/api/foods/search/route'

const get = (q: string) => GET({ nextUrl: new URL(`http://x/api/foods/search?q=${encodeURIComponent(q)}`) } as never)
const row = (id: string, name_norm: string, extra: Record<string, unknown> = {}) => ({
  id, name: name_norm, name_norm, aliases: [], kcal_100g: 100, protein_100g: 1, carbs_100g: 1, fat_100g: 1,
  prep_state: 'crudo', quality: 'usda', sim: 0, ...extra,
})

beforeEach(() => {
  state.user = { id: 'user-1' }
  state.access = true
  state.rpcRows = []
  state.rpcError = null
  state.portions = []
  state.portionsError = null
  state.portionIds = null
  mockRpc.mockClear()
})

describe('GET /api/foods/search', () => {
  it('401 sin sesión y 403 sin acceso al tracker', async () => {
    state.user = null
    expect((await get('arroz')).status).toBe(401)
    state.user = { id: 'user-1' }
    state.access = false
    expect((await get('arroz')).status).toBe(403)
  })

  it('consulta de menos de 2 letras: lista vacía sin tocar la base de datos', async () => {
    const res = await get('a')
    expect(await res.json()).toEqual({ foods: [] })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('normaliza la consulta (acentos y mayúsculas) antes de buscar', async () => {
    await get('  Plátano  ')
    expect(mockRpc).toHaveBeenCalledWith('search_foods', { q: 'platano', max_rows: 80 })
  })

  it('ordena: alias exacto antes que nombre que empieza por la consulta; descarta lo que no coincide', async () => {
    state.rpcRows = [
      row('macho', 'platano macho verde crudo'),
      row('banana', 'banana cambur platano', { aliases: ['platano', 'cambur'] }),
      row('ruido', 'arroz blanco cocido'),
    ]
    const body = await (await get('plátano')).json()
    expect(body.foods.map((f: { id: string }) => f.id)).toEqual(['banana', 'macho'])
  })

  it('devuelve estado, calidad y porciones de cada alimento', async () => {
    state.rpcRows = [row('arepa', 'arepa asada casera', { quality: 'approx', prep_state: 'horneado' })]
    state.portions = [
      { food_id: 'arepa', label: '1 arepa pequeña', grams: 60 },
      { food_id: 'otro', label: 'no debe salir', grams: 10 },
    ]
    const body = await (await get('arepa')).json()
    expect(body.foods[0]).toMatchObject({
      id: 'arepa', prep_state: 'horneado', quality: 'approx', portions: [{ label: '1 arepa pequeña', grams: 60 }],
    })
    expect(body.foods[0]).not.toHaveProperty('name_norm')
    expect(state.portionIds).toEqual(['arepa'])
  })

  it('500 sin filtrar detalles si falla la búsqueda o las porciones', async () => {
    state.rpcError = { message: 'function search_foods does not exist' }
    const res = await get('arroz')
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('search_foods')

    state.rpcError = null
    state.rpcRows = [row('arroz', 'arroz blanco cocido')]
    state.portionsError = { message: 'relation food_portions does not exist' }
    expect((await get('arroz')).status).toBe(500)
  })
})
