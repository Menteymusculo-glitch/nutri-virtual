/**
 * /api/save-plan y /api/save-checkin: sesión obligatoria, plan, user_id de la sesión,
 * actualizar el registro propio y nunca el de otra usuaria.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { db, state, mockFrom } = vi.hoisted(() => {
  type Row = Record<string, unknown> & { id: string }
  const db = { clients: [] as Row[], checkins: [] as Row[] }
  const state = {
    user: { id: 'ana' } as { id: string } | null,
    nutri: true,
    access: true,
    nextId: 1,
  }

  function chain(table: 'clients' | 'checkins') {
    const f: Record<string, unknown> = {}
    let op: 'select' | 'insert' | 'update' = 'select'
    let payload: Record<string, unknown> = {}
    const match = (r: Row) => Object.entries(f).every(([k, v]) => r[k] === v)
    const c: Record<string, unknown> = {}
    Object.assign(c, {
      select: () => c,
      eq: (k: string, v: unknown) => { f[k] = v; return c },
      order: () => c,
      limit: () => c,
      insert: (p: Record<string, unknown>) => { op = 'insert'; payload = p; return c },
      update: (p: Record<string, unknown>) => { op = 'update'; payload = p; return c },
      maybeSingle: async () => ({ data: db[table].find(match) ?? null, error: null }),
      then: (resolve: (v: unknown) => void) => {
        if (op === 'insert') db[table].push({ id: `row-${state.nextId++}`, ...payload })
        if (op === 'update') db[table].filter(match).forEach((r) => Object.assign(r, payload))
        return Promise.resolve({ data: null, error: null }).then(resolve)
      },
    })
    return c
  }
  return { db, state, mockFrom: vi.fn((t: 'clients' | 'checkins') => chain(t)) }
})

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: { from: mockFrom },
  getServerUser: async () => state.user,
  hasNutriAccess: async () => state.nutri,
  hasAccess: async () => state.access,
}))

import { POST as savePlan } from '@/app/api/save-plan/route'
import { POST as saveCheckin } from '@/app/api/save-checkin/route'

const req = (body: unknown) =>
  new Request('http://x', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }) as never

const planBody = (name = 'Ana') => ({
  profile: { name, age: 45, weight: 70 },
  plan: { days: [{ day: 'Lunes', meals: [] }] },
})
const checkinBody = (week = 1, weight = 70) => ({
  client_name: 'Ana', week, current_weight: weight,
  energy_level: 4, adherence: 3, digestion: 4, sleep: 3, notes: '', successes: 'Entrené 3 días',
})

beforeEach(() => {
  db.clients = [{ id: 'old', user_id: null, name: 'Ana', profile: {}, plan: {} }] // registro antiguo sin dueña
  db.checkins = [{ id: 'bea-ck', user_id: 'bea', week: 1, current_weight: 60 }]
  state.user = { id: 'ana' }
  state.nutri = true
  state.access = true
  state.nextId = 1
})

describe('POST /api/save-plan', () => {
  it('401 sin sesión, sin escribir', async () => {
    state.user = null
    expect((await savePlan(req(planBody()))).status).toBe(401)
    expect(db.clients).toHaveLength(1)
  })

  it('403 con sesión sin plan Nutri', async () => {
    state.nutri = false
    expect((await savePlan(req(planBody()))).status).toBe(403)
    expect(db.clients).toHaveLength(1)
  })

  it('guarda con el user_id de la sesión e ignora user_id/email del cuerpo', async () => {
    const res = await savePlan(req({ ...planBody(), user_id: 'bea', profile: { ...planBody().profile, user_id: 'bea', email: 'bea@x.com' } }))
    expect(res.status).toBe(200)
    const mine = db.clients.find((r) => r.user_id === 'ana')!
    expect(mine).toBeDefined()
    expect(mine.profile).not.toHaveProperty('user_id')
    expect(mine.profile).not.toHaveProperty('email')
    expect(db.clients.some((r) => r.user_id === 'bea')).toBe(false)
  })

  it('la segunda vez actualiza el registro propio en lugar de duplicar', async () => {
    await savePlan(req(planBody('Ana')))
    const res = await savePlan(req(planBody('Ana María')))
    expect((await res.json()).updated).toBe(true)
    const mine = db.clients.filter((r) => r.user_id === 'ana')
    expect(mine).toHaveLength(1)
    expect(mine[0].name).toBe('Ana María')
  })

  it('no toca registros antiguos sin dueña con el mismo nombre', async () => {
    await savePlan(req(planBody('Ana')))
    expect(db.clients.find((r) => r.id === 'old')).toMatchObject({ user_id: null, profile: {} })
  })

  it('400 con datos inválidos', async () => {
    expect((await savePlan(req({ profile: { name: '' }, plan: { days: [] } }))).status).toBe(400)
    expect((await savePlan(req('no es json'))).status).toBe(400)
  })

  it('413 con un cuerpo demasiado grande', async () => {
    const big = { ...planBody(), plan: { days: [{ notes: 'x'.repeat(300 * 1024) }] } }
    expect((await savePlan(req(big))).status).toBe(413)
  })
})

describe('POST /api/save-checkin', () => {
  it('401 sin sesión', async () => {
    state.user = null
    expect((await saveCheckin(req(checkinBody()))).status).toBe(401)
  })

  it('403 sin plan activo', async () => {
    state.access = false
    expect((await saveCheckin(req(checkinBody()))).status).toBe(403)
  })

  it('guarda con el user_id de la sesión e ignora user_id/id del cuerpo', async () => {
    const res = await saveCheckin(req({ ...checkinBody(), user_id: 'bea', id: 'bea-ck' }))
    expect(res.status).toBe(200)
    expect(db.checkins.find((r) => r.user_id === 'ana')).toMatchObject({ week: 1, current_weight: 70 })
    expect(db.checkins.find((r) => r.id === 'bea-ck')).toMatchObject({ user_id: 'bea', current_weight: 60 })
  })

  it('misma semana → actualiza el propio; otra semana → nuevo', async () => {
    await saveCheckin(req(checkinBody(1, 70)))
    await saveCheckin(req(checkinBody(1, 69.5)))
    await saveCheckin(req(checkinBody(2, 69)))
    const mine = db.checkins.filter((r) => r.user_id === 'ana')
    expect(mine).toHaveLength(2)
    expect(mine.find((r) => r.week === 1)?.current_weight).toBe(69.5)
  })

  it('una usuaria no puede modificar el check-in de otra (misma semana)', async () => {
    await saveCheckin(req(checkinBody(1, 80)))
    expect(db.checkins.find((r) => r.id === 'bea-ck')?.current_weight).toBe(60)
  })

  it('400 con columnas o valores fuera de rango', async () => {
    expect((await saveCheckin(req({ ...checkinBody(), energy_level: 9 }))).status).toBe(400)
    expect((await saveCheckin(req({ ...checkinBody(), current_weight: 0 }))).status).toBe(400)
    expect((await saveCheckin(req({ ...checkinBody(), notes: 'x'.repeat(2001) }))).status).toBe(400)
  })

  it('no guarda columnas extra del cuerpo', async () => {
    await saveCheckin(req({ ...checkinBody(), is_admin: true, created_at: '1999-01-01' }))
    const mine = db.checkins.find((r) => r.user_id === 'ana')!
    expect(mine).not.toHaveProperty('is_admin')
    expect(mine).not.toHaveProperty('created_at')
  })

  it('413 con un cuerpo demasiado grande', async () => {
    expect((await saveCheckin(req({ ...checkinBody(), notes: 'x'.repeat(20 * 1024) }))).status).toBe(413)
  })
})
