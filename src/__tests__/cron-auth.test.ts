/**
 * Autorización de los crons: sin CRON_SECRET (o vacía) se rechaza siempre,
 * también la cabecera "Bearer undefined".
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: {
    from: () => {
      const c: Record<string, unknown> = {}
      Object.assign(c, {
        select: () => c,
        eq: () => c,
        not: () => c,
        then: (resolve: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(resolve),
      })
      return c
    },
  },
}))

import { isCronAuthorized } from '@/lib/cronAuth'
import { GET as expireAccess } from '@/app/api/cron/expire-access/route'

const env = process.env.CRON_SECRET
const call = (auth?: string) =>
  expireAccess(new Request('http://x/api/cron/expire-access', { headers: auth ? { authorization: auth } : {} }) as never)

beforeEach(() => { process.env.CRON_SECRET = 'secreto-de-prueba' })
afterEach(() => {
  if (env === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = env
})

describe('isCronAuthorized', () => {
  it('solo acepta exactamente Bearer <CRON_SECRET>', () => {
    expect(isCronAuthorized('Bearer abc', 'abc')).toBe(true)
    expect(isCronAuthorized('Bearer abcd', 'abc')).toBe(false)
    expect(isCronAuthorized('bearer abc', 'abc')).toBe(false)
    expect(isCronAuthorized('abc', 'abc')).toBe(false)
    expect(isCronAuthorized(null, 'abc')).toBe(false)
  })
  it('sin secreto o con secreto vacío rechaza siempre', () => {
    expect(isCronAuthorized('Bearer undefined', undefined)).toBe(false)
    expect(isCronAuthorized('Bearer ', '')).toBe(false)
    expect(isCronAuthorized('Bearer    ', '   ')).toBe(false)
  })
})

describe('GET /api/cron/expire-access', () => {
  it('variable ausente → 401', async () => {
    delete process.env.CRON_SECRET
    expect((await call('Bearer undefined')).status).toBe(401)
    expect((await call()).status).toBe(401)
  })

  it('variable vacía → 401', async () => {
    process.env.CRON_SECRET = ''
    expect((await call('Bearer ')).status).toBe(401)
  })

  it('cabecera "Bearer undefined" o incorrecta → 401', async () => {
    expect((await call('Bearer undefined')).status).toBe(401)
    expect((await call('Bearer otro')).status).toBe(401)
    expect((await call()).status).toBe(401)
  })

  it('secreto correcto → 200', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const res = await call('Bearer secreto-de-prueba')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, expired: 0, warned: 0 })
    log.mockRestore()
  })
})
