/**
 * Día en curso: /api/tracker/week, /api/tracker/day y /api/tracker/day/close.
 * La fecha "hoy" la envía el navegador; aquí fijamos el reloj para que sea plausible.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const { state, mockFrom } = vi.hoisted(() => {
  const state = {
    user: { id: 'user-1' } as { id: string } | null,
    access: true,
    target: { user_id: 'user-1', goal: 'maintenance', target_kcal: 2000, tdee_kcal: 2300, sex: 'female', hide_calories: false, updated_at: null },
    logs: [] as { log_date: string; total_kcal: number }[],
    closures: [] as { user_id: string; log_date: string }[],
    upserts: [] as Record<string, unknown>[],
  }

  function chain(table: string) {
    const f: Record<string, unknown> = {}
    let upsertPayload: Record<string, unknown> | null = null
    const c: Record<string, unknown> = {}
    const result = () => {
      if (table === 'meal_logs') {
        const rows = state.logs.filter((l) =>
          (!f.log_date || l.log_date === f.log_date) &&
          (!f.gte || l.log_date >= (f.gte as string)) &&
          (!f.lte || l.log_date <= (f.lte as string)))
        // /day pide meal_items embebidos
        return { data: rows.map((r, i) => ({ id: `m${i}`, ...r, meal_items: [{ id: `i${i}`, kcal: r.total_kcal, protein: null, carbs: null, fat: null }] })), error: null }
      }
      if (table === 'day_closures') {
        if (upsertPayload) {
          state.upserts.push(upsertPayload)
          return { data: null, error: null }
        }
        const dates = (f.in as string[]) ?? []
        return { data: state.closures.filter((x) => x.user_id === f.user_id && dates.includes(x.log_date)), error: null }
      }
      return { data: null, error: null }
    }
    Object.assign(c, {
      select: () => c,
      eq: (col: string, v: unknown) => { f[col] = v; return c },
      in: (_col: string, v: unknown[]) => { f.in = v; return c },
      gte: (_col: string, v: unknown) => { f.gte = v; return c },
      lte: (_col: string, v: unknown) => { f.lte = v; return c },
      order: () => c,
      upsert: (p: Record<string, unknown>) => { upsertPayload = p; return c },
      maybeSingle: async () => ({ data: table === 'nutrition_targets' ? state.target : null, error: null }),
      then: (resolve: (v: unknown) => void) => Promise.resolve(result()).then(resolve),
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

import { GET as getWeek } from '@/app/api/tracker/week/route'
import { GET as getDay } from '@/app/api/tracker/day/route'
import { POST as closeDay } from '@/app/api/tracker/day/close/route'

const TODAY = '2026-10-22'
const req = (url: string) => {
  const r = new Request(url) as Request & { nextUrl: URL }
  r.nextUrl = new URL(url)
  return r as never
}
const post = (body: unknown) => new Request('http://x/api/tracker/day/close', { method: 'POST', body: JSON.stringify(body) }) as never

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(Date.UTC(2026, 9, 22, 12)))
  state.user = { id: 'user-1' }
  state.access = true
  state.target = { user_id: 'user-1', goal: 'maintenance', target_kcal: 2000, tdee_kcal: 2300, sex: 'female', hide_calories: false, updated_at: null }
  state.logs = [
    { log_date: '2026-10-19', total_kcal: 2000 },
    { log_date: '2026-10-20', total_kcal: 2000 },
    { log_date: '2026-10-21', total_kcal: 2000 },
    { log_date: TODAY, total_kcal: 300 }, // desayuno de hoy
  ]
  state.closures = []
  state.upserts = []
})
afterEach(() => { vi.useRealTimers() })

describe('GET /api/tracker/week', () => {
  it('con hoy abierto, la ventana termina ayer y el desayuno no baja el promedio', async () => {
    const body = await (await getWeek(req(`http://x/api/tracker/week?today=${TODAY}`))).json()
    expect(body.todayClosed).toBe(false)
    expect(body.days.map((d: { date: string }) => d.date)).not.toContain(TODAY)
    expect(body.days[6].date).toBe('2026-10-21')
    expect(body.adjustment.kind).toBe('mantener')
    expect(body.adjustment.average).toBe(2000)
    expect(body.adjustment.loggedDays).toBe(3)
  })

  it('con hoy cerrado, hoy entra en la ventana y en el promedio', async () => {
    state.closures = [{ user_id: 'user-1', log_date: TODAY }]
    state.logs[3].total_kcal = 1700
    const body = await (await getWeek(req(`http://x/api/tracker/week?today=${TODAY}`))).json()
    expect(body.todayClosed).toBe(true)
    expect(body.days[6]).toEqual({ date: TODAY, consumed: 1700 })
    expect(body.adjustment.loggedDays).toBe(4)
    expect(body.adjustment.average).toBe(1925)
  })

  it('pide 8 días de una vez y solo cuenta los de la ventana', async () => {
    state.logs.push(
      { log_date: '2026-10-14', total_kcal: 9999 }, // hace 8 días: nunca entra
      { log_date: '2026-10-15', total_kcal: 1000 }, // hace 7 días: solo con hoy abierto
    )
    const open = await (await getWeek(req(`http://x/api/tracker/week?today=${TODAY}`))).json()
    expect(open.days[0]).toEqual({ date: '2026-10-15', consumed: 1000 })
    expect(open.days.map((d: { consumed: number }) => d.consumed)).not.toContain(9999)

    state.closures = [{ user_id: 'user-1', log_date: TODAY }]
    const closed = await (await getWeek(req(`http://x/api/tracker/week?today=${TODAY}`))).json()
    expect(closed.days[0].date).toBe('2026-10-16')
    expect(closed.days.map((d: { date: string }) => d.date)).not.toContain('2026-10-15')
  })

  it('401 sin sesión y 403 sin plan', async () => {
    state.user = null
    expect((await getWeek(req(`http://x/api/tracker/week?today=${TODAY}`))).status).toBe(401)
    state.user = { id: 'user-1' }
    state.access = false
    expect((await getWeek(req(`http://x/api/tracker/week?today=${TODAY}`))).status).toBe(403)
  })

  it('acepta `end` como alias de `today`', async () => {
    const body = await (await getWeek(req(`http://x/api/tracker/week?end=${TODAY}`))).json()
    expect(body.today).toBe(TODAY)
  })

  it('ignora una fecha "hoy" implausible y usa la UTC', async () => {
    const body = await (await getWeek(req('http://x/api/tracker/week?today=2030-01-01'))).json()
    expect(body.today).toBe(TODAY)
  })
})

describe('GET /api/tracker/day', () => {
  it('401 sin sesión y 403 sin plan, también con fecha inválida', async () => {
    state.user = null
    expect((await getDay(req(`http://x/api/tracker/day?date=${TODAY}&today=${TODAY}`))).status).toBe(401)
    expect((await getDay(req(`http://x/api/tracker/day?date=nope&today=${TODAY}`))).status).toBe(401)
    state.user = { id: 'user-1' }
    state.access = false
    const res = await getDay(req(`http://x/api/tracker/day?date=${TODAY}&today=${TODAY}`))
    expect(res.status).toBe(403)
    expect(await res.json()).not.toHaveProperty('meals')
  })

  it('hoy abierto → en_curso con progreso, sin "por debajo"', async () => {
    const body = await (await getDay(req(`http://x/api/tracker/day?date=${TODAY}&today=${TODAY}`))).json()
    expect(body.closed).toBe(false)
    expect(body.report.status).toBe('en_curso')
    expect(body.report.progressPct).toBe(15)
  })

  it('hoy cerrado por la usuaria → estado normal', async () => {
    state.closures = [{ user_id: 'user-1', log_date: TODAY }]
    const body = await (await getDay(req(`http://x/api/tracker/day?date=${TODAY}&today=${TODAY}`))).json()
    expect(body.closed).toBe(true)
    expect(body.report.status).toBe('por_debajo')
  })

  it('un día anterior cuenta como cerrado sin fila en day_closures', async () => {
    const body = await (await getDay(req(`http://x/api/tracker/day?date=2026-10-21&today=${TODAY}`))).json()
    expect(body.closed).toBe(true)
    expect(body.report.status).toBe('en_zona')
  })
})

describe('GET /api/tracker/day — alertas', () => {
  it('día anterior bajo 1.200 → floorAlert; hoy abierto con poco → sin alerta', async () => {
    state.logs.push({ log_date: '2026-10-18', total_kcal: 900 })
    const past = await (await getDay(req(`http://x/api/tracker/day?date=2026-10-18&today=${TODAY}`))).json()
    expect(past.report.floorAlert).toBe(true)
    const now = await (await getDay(req(`http://x/api/tracker/day?date=${TODAY}&today=${TODAY}`))).json()
    expect(now.report.floorAlert).toBe(false)
  })

  it('pasa el objetivo de la usuaria: déficit por encima del TDEE → sobre_gasto', async () => {
    state.target = { ...state.target, goal: 'deficit', target_kcal: 1955, tdee_kcal: 2300 }
    state.logs.push({ log_date: '2026-10-17', total_kcal: 2400 })
    const body = await (await getDay(req(`http://x/api/tracker/day?date=2026-10-17&today=${TODAY}`))).json()
    expect(body.report.ceilingAlert).toBe('sobre_gasto')
  })
})

describe('POST /api/tracker/day/close', () => {
  it('cierra hoy (upsert idempotente en day_closures)', async () => {
    const res = await closeDay(post({ date: TODAY, today: TODAY }))
    expect(res.status).toBe(200)
    expect(state.upserts).toEqual([{ user_id: 'user-1', log_date: TODAY }])
  })

  it('un día anterior ya está cerrado: no escribe', async () => {
    const body = await (await closeDay(post({ date: '2026-10-20', today: TODAY }))).json()
    expect(body.alreadyClosed).toBe(true)
    expect(state.upserts).toHaveLength(0)
  })

  it('400 para un día futuro', async () => {
    expect((await closeDay(post({ date: '2026-10-23', today: TODAY }))).status).toBe(400)
  })

  it('400 con fecha inválida', async () => {
    expect((await closeDay(post({ date: 'mañana', today: TODAY }))).status).toBe(400)
  })

  it('401 sin sesión', async () => {
    state.user = null
    expect((await closeDay(post({ date: TODAY, today: TODAY }))).status).toBe(401)
  })
})
