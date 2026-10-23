/**
 * Comprobaciones de acceso: una sola lectura de `access` por comprobación, con la
 * misma regla de siempre (admin pasa; si no, activo y con un plan permitido).
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { state, mockFrom } = vi.hoisted(() => {
  const state = {
    row: null as { role: string | null; status: string | null; plan: string | null } | null,
    queries: 0,
    selects: [] as string[],
  }
  const mockFrom = vi.fn(() => {
    state.queries++
    const c: Record<string, unknown> = {}
    Object.assign(c, {
      select: (cols: string) => { state.selects.push(cols); return c },
      eq: () => c,
      single: async () => (state.row
        ? { data: state.row, error: null }
        : { data: null, error: { code: 'PGRST116', message: 'no rows' } }),
    })
    return c
  })
  return { state, mockFrom }
})

vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: mockFrom }) }))
vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: vi.fn() }))

import { hasAccess, hasNutriAccess, hasTrackerAccess, hasIdentityAccess } from '@/lib/auth-server'

beforeEach(() => {
  state.row = null
  state.queries = 0
  state.selects = []
})

describe('comprobaciones de acceso', () => {
  it('hacen una sola consulta a access', async () => {
    state.row = { role: null, status: 'active', plan: 'premium' }
    await hasTrackerAccess('u1')
    expect(state.queries).toBe(1)
    expect(state.selects).toEqual(['role, status, plan'])
  })

  it('admin pasa siempre, aunque no esté activo ni tenga plan', async () => {
    state.row = { role: 'admin', status: 'expired', plan: null }
    expect(await hasAccess('u1')).toBe(true)
    expect(await hasNutriAccess('u1')).toBe(true)
    expect(await hasTrackerAccess('u1')).toBe(true)
    expect(await hasIdentityAccess('u1')).toBe(true)
  })

  it('activo con plan de nutrición', async () => {
    state.row = { role: 'user', status: 'active', plan: 'gym_virtual_core' }
    expect(await hasNutriAccess('u1')).toBe(true)
    expect(await hasTrackerAccess('u1')).toBe(true)
    expect(await hasIdentityAccess('u1')).toBe(false) // gym_virtual_core no incluye Motor de Identidad
  })

  it('nutri_app da acceso al tracker', async () => {
    state.row = { role: null, status: 'active', plan: 'nutri_app' }
    expect(await hasTrackerAccess('u1')).toBe(true)
  })

  it('inactivo no pasa aunque el plan sea válido', async () => {
    state.row = { role: null, status: 'expired', plan: 'premium' }
    expect(await hasAccess('u1')).toBe(false)
    expect(await hasTrackerAccess('u1')).toBe(false)
  })

  it('activo con un plan que no está en la lista', async () => {
    state.row = { role: null, status: 'active', plan: 'legacy' }
    expect(await hasAccess('u1')).toBe(true) // hasAccess no mira el plan
    expect(await hasNutriAccess('u1')).toBe(false)
  })

  it('sin fila en access → sin acceso', async () => {
    expect(await hasAccess('u1')).toBe(false)
    expect(await hasTrackerAccess('u1')).toBe(false)
  })
})
