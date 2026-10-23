/**
 * Rutas /api/admin/*: 401 solo sin sesión, 403 con sesión sin rol admin.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { state, mockFrom, admin } = vi.hoisted(() => {
  const state = { user: null as { id: string } | null, isAdmin: false, writes: 0 }
  const c: Record<string, unknown> = {}
  Object.assign(c, {
    select: () => c,
    eq: () => c,
    update: () => { state.writes++; return c },
    insert: () => { state.writes++; return c },
    delete: () => { state.writes++; return c },
    single: async () => ({ data: { id: 'acc-1' }, error: null }),
    then: (resolve: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(resolve),
  })
  const admin = {
    listUsers: vi.fn(async () => ({ data: { users: [{ id: 'u2', email: 'b@x.com', created_at: '2026-10-01', user_metadata: {} }] }, error: null })),
    createUser: vi.fn(async () => { state.writes++; return { data: { user: { id: 'new' } }, error: null } }),
    deleteUser: vi.fn(async () => { state.writes++; return { data: null, error: null } }),
  }
  return { state, mockFrom: vi.fn(() => c), admin }
})

vi.mock('@/lib/mealPhotos', () => ({ deleteAllUserPhotos: async () => null }))

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: { from: mockFrom, auth: { admin } },
  getServerUser: async () => state.user,
  isAdmin: async () => state.isAdmin,
}))

import { PATCH } from '@/app/api/admin/access/route'
import { GET, POST, DELETE } from '@/app/api/admin/users/route'

const json = (method: string, body: unknown) =>
  new Request('http://x', { method, body: JSON.stringify(body) }) as never

const calls = {
  'GET /users': () => GET(),
  'POST /users': () => POST(json('POST', { email: 'n@x.com', password: 'secreto123' })),
  'DELETE /users': () => DELETE(json('DELETE', { userId: 'u2' })),
  'PATCH /access': () => PATCH(json('PATCH', { userId: 'u2', status: 'active' })),
}

beforeEach(() => {
  state.user = null
  state.isAdmin = false
  state.writes = 0
  admin.listUsers.mockClear()
})

describe.each(Object.entries(calls))('%s', (_name, call) => {
  it('401 sin sesión, sin escribir', async () => {
    expect((await call()).status).toBe(401)
    expect(state.writes).toBe(0)
  })

  it('403 con sesión que no es admin, sin escribir', async () => {
    state.user = { id: 'member' }
    expect((await call()).status).toBe(403)
    expect(state.writes).toBe(0)
  })

  it('admin pasa el control de acceso', async () => {
    state.user = { id: 'admin' }
    state.isAdmin = true
    const res = await call()
    expect([401, 403]).not.toContain(res.status)
  })
})

describe('GET /api/admin/users con admin', () => {
  it('devuelve la lista', async () => {
    state.user = { id: 'admin' }
    state.isAdmin = true
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toHaveLength(1)
  })
})
