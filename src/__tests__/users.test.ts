import { vi, describe, it, expect, beforeEach } from 'vitest'

const { state, mockListUsers, mockInviteUser } = vi.hoisted(() => {
  const state = {
    accessRows: [] as { user_id: string | null; email: string }[],
    accessError: null as { message: string } | null,
    authUsers: [] as { id: string; email: string }[],
    perPageSeen: [] as number[],
  }

  const mockListUsers = vi.fn(async ({ page = 1, perPage = 50 }: { page?: number; perPage?: number }) => {
    state.perPageSeen.push(perPage)
    const start = (page - 1) * perPage
    const users = state.authUsers.slice(start, start + perPage)
    const hasMore = start + perPage < state.authUsers.length
    return { data: { users, nextPage: hasMore ? page + 1 : null, lastPage: 0, total: state.authUsers.length }, error: null }
  })

  const mockInviteUser = vi.fn(async (email: string) => ({
    data: { user: { id: `invited:${email}` } },
    error: null,
  }))

  return { state, mockListUsers, mockInviteUser }
})

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: {
    from: () => {
      const filters: Record<string, unknown> = {}
      const c = {
        select: () => c,
        eq: (col: string, val: unknown) => { filters[col] = val; return c },
        maybeSingle: async () => {
          if (state.accessError) return { data: null, error: state.accessError }
          const row = state.accessRows.find((r) => r.email === filters.email)
          return { data: row ?? null, error: null }
        },
      }
      return c
    },
    auth: { admin: { listUsers: mockListUsers, inviteUserByEmail: mockInviteUser } },
  },
}))

import { findOrCreateUser, findUserIdByEmail } from '@/lib/users'

function makeUsers(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `u${i}`, email: `user${i}@example.com` }))
}

describe('findUserIdByEmail', () => {
  beforeEach(() => {
    state.accessRows = []
    state.accessError = null
    state.authUsers = []
    state.perPageSeen = []
    mockListUsers.mockClear()
    mockInviteUser.mockClear()
  })

  it('usa la tabla access si hay fila con ese email (sin listar usuarios)', async () => {
    state.accessRows = [{ user_id: 'acc-user', email: 'ana@example.com' }]
    expect(await findUserIdByEmail('Ana@Example.com ')).toBe('acc-user')
    expect(mockListUsers).not.toHaveBeenCalled()
  })

  it('ignora filas de access con user_id nulo y cae a listUsers', async () => {
    state.accessRows = [{ user_id: null, email: 'ana@example.com' }]
    state.authUsers = [{ id: 'auth-ana', email: 'ana@example.com' }]
    expect(await findUserIdByEmail('ana@example.com')).toBe('auth-ana')
  })

  it('encuentra usuarios más allá de la primera página de 1000', async () => {
    state.authUsers = makeUsers(2500)
    expect(await findUserIdByEmail('user2400@example.com')).toBe('u2400')
    expect(mockListUsers).toHaveBeenCalledTimes(3)
    expect(state.perPageSeen.every((n) => n === 1000)).toBe(true)
  })

  it('devuelve null si no existe, tras recorrer todas las páginas', async () => {
    state.authUsers = makeUsers(2000)
    expect(await findUserIdByEmail('nadie@example.com')).toBeNull()
    expect(mockListUsers).toHaveBeenCalledTimes(2)
  })

  it('compara emails sin distinguir mayúsculas', async () => {
    state.authUsers = [{ id: 'x', email: 'Mixed@Example.COM' }]
    expect(await findUserIdByEmail('mixed@example.com')).toBe('x')
  })

  it('si la consulta a access falla, sigue con listUsers', async () => {
    state.accessError = { message: 'multiple rows' }
    state.authUsers = [{ id: 'y', email: 'dup@example.com' }]
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await findUserIdByEmail('dup@example.com')).toBe('y')
    warn.mockRestore()
  })
})

describe('findOrCreateUser', () => {
  beforeEach(() => {
    state.accessRows = []
    state.accessError = null
    state.authUsers = []
    mockListUsers.mockClear()
    mockInviteUser.mockClear()
  })

  it('no invita si el usuario ya existe en una página posterior', async () => {
    state.authUsers = makeUsers(1500)
    expect(await findOrCreateUser('user1499@example.com')).toBe('u1499')
    expect(mockInviteUser).not.toHaveBeenCalled()
  })

  it('invita con email normalizado y el redirect indicado si no existe', async () => {
    const id = await findOrCreateUser('  Nueva@Example.com', 'https://x.test/login')
    expect(id).toBe('invited:nueva@example.com')
    expect(mockInviteUser).toHaveBeenCalledWith('nueva@example.com', { redirectTo: 'https://x.test/login' })
  })
})
