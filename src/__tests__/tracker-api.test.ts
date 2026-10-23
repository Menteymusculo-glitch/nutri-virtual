/**
 * requireTrackerUserWith: la lectura va en paralelo con la comprobación del plan,
 * pero nunca empieza sin sesión y su resultado se descarta sin plan.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { state } = vi.hoisted(() => ({
  state: {
    user: { id: 'user-1' } as { id: string } | null,
    access: true,
    events: [] as string[],
  },
}))

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: {},
  getServerUser: async () => state.user,
  hasTrackerAccess: async () => {
    state.events.push('access:start')
    await new Promise((r) => setTimeout(r, 5))
    state.events.push('access:end')
    return state.access
  },
}))

import { requireTrackerUserWith } from '@/lib/trackerApi'

beforeEach(() => {
  state.user = { id: 'user-1' }
  state.access = true
  state.events = []
})

describe('requireTrackerUserWith', () => {
  it('sin sesión: 401 y la lectura no se ejecuta', async () => {
    state.user = null
    const read = vi.fn(async () => 'datos')
    const auth = await requireTrackerUserWith(read)
    expect(auth.ok).toBe(false)
    if (!auth.ok) expect(auth.response.status).toBe(401)
    expect(read).not.toHaveBeenCalled()
  })

  it('sin plan: 403 y no devuelve los datos leídos', async () => {
    state.access = false
    const auth = await requireTrackerUserWith(async () => 'secreto')
    expect(auth.ok).toBe(false)
    if (!auth.ok) {
      expect(auth.response.status).toBe(403)
      expect(await auth.response.text()).not.toContain('secreto')
    }
  })

  it('con plan: devuelve la usuaria y los datos; la lectura recibe su id', async () => {
    const read = vi.fn(async (id: string) => `datos de ${id}`)
    const auth = await requireTrackerUserWith(read)
    expect(auth).toMatchObject({ ok: true, user: { id: 'user-1' }, data: 'datos de user-1' })
  })

  it('la lectura empieza antes de que termine la comprobación del plan', async () => {
    await requireTrackerUserWith(async () => { state.events.push('read:start') })
    expect(state.events.indexOf('read:start')).toBeLessThan(state.events.indexOf('access:end'))
  })
})
