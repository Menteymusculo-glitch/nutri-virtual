/**
 * /api/tracker/photo-consent: aceptar con la versión vigente, consultar y retirar.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { state } = vi.hoisted(() => ({
  state: {
    user: { id: 'user-1' } as { id: string } | null,
    access: true,
    row: null as Record<string, unknown> | null,
    writes: [] as { op: string; payload: Record<string, unknown> }[],
  },
}))

vi.mock('@/lib/auth-server', () => ({
  getServerUser: async () => state.user,
  hasTrackerAccess: async () => state.access,
  supabaseAdmin: {
    from: () => {
      const c: Record<string, unknown> = {}
      let op = 'select'
      let payload: Record<string, unknown> = {}
      Object.assign(c, {
        select: () => c,
        eq: () => c,
        is: () => c,
        maybeSingle: async () => ({ data: state.row, error: null }),
        upsert: (p: Record<string, unknown>) => { op = 'upsert'; payload = p; return c },
        update: (p: Record<string, unknown>) => { op = 'update'; payload = p; return c },
        then: (resolve: (v: unknown) => void) => {
          state.writes.push({ op, payload })
          return Promise.resolve({ error: null }).then(resolve)
        },
      })
      return c
    },
  },
}))

import { GET, POST, DELETE } from '@/app/api/tracker/photo-consent/route'
import { PHOTO_CONSENT_VERSION } from '@/lib/photoCopy'

const post = (body: unknown) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }) as never)

beforeEach(() => {
  state.user = { id: 'user-1' }
  state.access = true
  state.row = null
  state.writes = []
})

describe('photo-consent', () => {
  it('sin fila → no hay consentimiento', async () => {
    expect(await (await GET()).json()).toMatchObject({ consented: false, version: PHOTO_CONSENT_VERSION })
  })

  it('consentimiento retirado o de otra versión → no vale', async () => {
    state.row = { version: PHOTO_CONSENT_VERSION, consented_at: '2026-10-23T10:00:00Z', revoked_at: '2026-10-24T10:00:00Z' }
    expect((await (await GET()).json()).consented).toBe(false)
    state.row = { version: '2020-01-01', consented_at: '2026-10-23T10:00:00Z', revoked_at: null }
    expect((await (await GET()).json()).consented).toBe(false)
    state.row = { version: PHOTO_CONSENT_VERSION, consented_at: '2026-10-23T10:00:00Z', revoked_at: null }
    expect(await (await GET()).json()).toMatchObject({ consented: true, consented_at: '2026-10-23T10:00:00Z' })
  })

  it('aceptar guarda versión y fecha; con otra versión responde 409', async () => {
    expect((await post({ version: 'vieja' })).status).toBe(409)
    expect(state.writes).toEqual([])
    const res = await post({ version: PHOTO_CONSENT_VERSION })
    expect(res.status).toBe(200)
    expect(state.writes[0].op).toBe('upsert')
    expect(state.writes[0].payload).toMatchObject({ user_id: 'user-1', version: PHOTO_CONSENT_VERSION, revoked_at: null })
    expect(typeof state.writes[0].payload.consented_at).toBe('string')
  })

  it('aceptar exige plan; retirar solo exige sesión', async () => {
    state.access = false
    expect((await post({ version: PHOTO_CONSENT_VERSION })).status).toBe(403)
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(state.writes[0]).toMatchObject({ op: 'update' })
    expect(typeof state.writes[0].payload.revoked_at).toBe('string')
    state.user = null
    expect((await DELETE()).status).toBe(401)
  })
})
