/**
 * /api/verify-code: límite de 5 intentos fallidos / 15 min por IP+email,
 * IP guardada con hash y comparación en tiempo constante.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { rows, state, mockFrom } = vi.hoisted(() => {
  const rows: { scope: string; key_hash: string; created_at: string }[] = []
  const state = { dbError: null as { message: string } | null }

  function chain() {
    const f: { eq: Record<string, unknown>; gte?: string; lt?: string } = { eq: {} }
    let op: 'select' | 'insert' | 'delete' = 'select'
    let payload: Record<string, string> = {}
    const match = (r: (typeof rows)[number]) =>
      Object.entries(f.eq).every(([k, v]) => (r as Record<string, unknown>)[k] === v) &&
      (!f.gte || r.created_at >= f.gte) && (!f.lt || r.created_at < f.lt)
    const c: Record<string, unknown> = {}
    Object.assign(c, {
      select: () => c,
      eq: (k: string, v: unknown) => { f.eq[k] = v; return c },
      gte: (_k: string, v: string) => { f.gte = v; return c },
      lt: (_k: string, v: string) => { f.lt = v; return c },
      insert: (p: Record<string, string>) => { op = 'insert'; payload = p; return c },
      delete: () => { op = 'delete'; return c },
      then: (resolve: (v: unknown) => void) => {
        if (state.dbError) return Promise.resolve({ data: null, count: null, error: state.dbError }).then(resolve)
        if (op === 'insert') rows.push({ scope: payload.scope, key_hash: payload.key_hash, created_at: new Date().toISOString() })
        if (op === 'delete') for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i])) rows.splice(i, 1)
        return Promise.resolve({ data: null, count: rows.filter(match).length, error: null }).then(resolve)
      },
    })
    return c
  }
  return { rows, state, mockFrom: vi.fn(() => chain()) }
})

vi.mock('@/lib/auth-server', () => ({ supabaseAdmin: { from: mockFrom } }))

import { POST } from '@/app/api/verify-code/route'
import { rateLimitKey, safeEqual, clientIp } from '@/lib/rateLimit'

process.env.ACCESS_CODE = 'MENTE2026'

const call = (code: string, ip = '1.2.3.4', email = 'ana@example.com') =>
  POST(new Request('http://x/api/verify-code', {
    method: 'POST',
    headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
    body: JSON.stringify({ code, email }),
  }) as never)

beforeEach(() => {
  rows.length = 0
  state.dbError = null
})

describe('POST /api/verify-code', () => {
  it('código correcto (sin distinguir mayúsculas ni espacios) → 200', async () => {
    expect((await call('  mente2026 ')).status).toBe(200)
  })

  it('código incorrecto → 401 y registra el intento con la IP en hash', async () => {
    expect((await call('NOPE')).status).toBe(401)
    expect(rows).toHaveLength(1)
    expect(rows[0].key_hash).not.toContain('1.2.3.4')
    expect(rows[0].key_hash).not.toContain('ana@example.com')
  })

  it('5 fallos → el 6.º intento devuelve 429, incluso con el código correcto', async () => {
    for (let i = 0; i < 5; i++) expect((await call('MAL' + i)).status).toBe(401)
    const res = await call('MENTE2026')
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('900')
    expect((await res.json()).error).toMatch(/15 minutos/)
  })

  it('el límite es por IP+email: otra IP u otro email no se bloquea', async () => {
    for (let i = 0; i < 5; i++) await call('MAL')
    expect((await call('MENTE2026', '5.6.7.8')).status).toBe(200)
    expect((await call('MENTE2026', '1.2.3.4', 'bea@example.com')).status).toBe(200)
  })

  it('los fallos de hace más de 15 minutos no cuentan', async () => {
    const key = rateLimitKey('1.2.3.4', 'ana@example.com')
    const old = new Date(Date.now() - 16 * 60 * 1000).toISOString()
    for (let i = 0; i < 5; i++) rows.push({ scope: 'verify_code', key_hash: key, created_at: old })
    expect((await call('MENTE2026')).status).toBe(200)
  })

  it('un acierto limpia los fallos previos', async () => {
    for (let i = 0; i < 3; i++) await call('MAL')
    await call('MENTE2026')
    expect(rows).toHaveLength(0)
  })

  it('si el limitador falla, falla cerrado con 503', async () => {
    state.dbError = { message: 'relation "rate_limits" does not exist' }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await call('MENTE2026')).status).toBe(503)
    spy.mockRestore()
  })

  it('código ausente o no texto → 401', async () => {
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ code: 123 }) }) as never)
    expect(res.status).toBe(401)
  })
})

describe('helpers del limitador', () => {
  it('safeEqual compara bien también con longitudes distintas', () => {
    expect(safeEqual('ABC', 'ABC')).toBe(true)
    expect(safeEqual('ABC', 'ABCD')).toBe(false)
    expect(safeEqual('', 'A')).toBe(false)
  })
  it('rateLimitKey depende de la sal y normaliza el email', () => {
    expect(rateLimitKey('1.1.1.1', 'A@X.com', 's')).toBe(rateLimitKey('1.1.1.1', ' a@x.com', 's'))
    expect(rateLimitKey('1.1.1.1', 'a@x.com', 's1')).not.toBe(rateLimitKey('1.1.1.1', 'a@x.com', 's2'))
  })
  it('clientIp toma la primera IP de x-forwarded-for', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('9.9.9.9')
    expect(clientIp(new Headers({ 'x-real-ip': '8.8.8.8' }))).toBe('8.8.8.8')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
