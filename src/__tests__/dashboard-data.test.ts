/**
 * /api/dashboard-data: solo administradores pueden leer clients y checkins.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { state, mockFrom } = vi.hoisted(() => {
  const state = {
    user: null as { id: string } | null,
    admin: false,
    dbError: null as { message: string } | null,
  }
  const rows: Record<string, unknown[]> = {
    clients: [{ id: 'c1', name: 'Ana', profile: { weight: 70 }, created_at: '2026-10-01' }],
    checkins: [{ id: 'k1', client_name: 'Ana', week: 1 }],
  }
  const mockFrom = vi.fn((table: string) => {
    const c = {
      select: () => c,
      order: () => Promise.resolve({ data: state.dbError ? null : rows[table], error: state.dbError }),
    }
    return c
  })
  return { state, mockFrom }
})

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: { from: mockFrom },
  getServerUser: async () => state.user,
  isAdmin: async () => state.admin,
}))

import { GET } from '@/app/api/dashboard-data/route'
import { dashboardAccessMessage } from '@/lib/dashboardAccess'

beforeEach(() => {
  state.user = null
  state.admin = false
  state.dbError = null
  mockFrom.mockClear()
})

describe('GET /api/dashboard-data', () => {
  it('401 sin sesión y sin tocar la base de datos', async () => {
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.clients).toBeUndefined()
    expect(body.checkins).toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('403 con sesión que no es admin y sin tocar la base de datos', async () => {
    state.user = { id: 'member-1' }
    const res = await GET()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.clients).toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('200 con datos para admin', async () => {
    state.user = { id: 'admin-1' }
    state.admin = true
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.clients).toHaveLength(1)
    expect(body.checkins).toHaveLength(1)
  })

  it('500 sin filtrar el mensaje de la base de datos', async () => {
    state.user = { id: 'admin-1' }
    state.admin = true
    state.dbError = { message: 'relation "clients" secret detail' }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await GET()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('secret detail')
    spy.mockRestore()
  })
})

describe('dashboardAccessMessage', () => {
  it('mensaje para 401 y 403', () => {
    expect(dashboardAccessMessage(401)?.title).toMatch(/Inicia sesión/)
    expect(dashboardAccessMessage(403)?.title).toMatch(/administradores/)
  })
  it('null para otros estados', () => {
    expect(dashboardAccessMessage(200)).toBeNull()
    expect(dashboardAccessMessage(500)).toBeNull()
  })
})
