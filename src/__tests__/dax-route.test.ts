/**
 * Tests de integración para el webhook handler de DAX.
 * Mock de Supabase a nivel de módulo; las funciones puras (computeEffectivePlan, etc.)
 * corren con su implementación real para cubrir el flujo completo.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Env: debe estar antes de cualquier import del handler
process.env.DAX_WEBHOOK_SECRET = 'test-secret'

// ── Estado compartido del mock ────────────────────────────────────────────────
// vi.hoisted: se ejecuta ANTES de que se resuelvan los imports de vi.mock

const { mockDB, mockFrom, mockListUsers, mockInviteUser } = vi.hoisted(() => {
  type Sub = { user_id: string; email: string; plan: string; status: string }
  type AccessRow = {
    id: string; user_id: string; source: string
    plan: string; status: string; email?: string
  }
  type AuthUser = { id: string; email: string }

  const mockDB = {
    processedEvents: new Set<string>(),
    subscriptions:   [] as Sub[],
    accessRow:       null as AccessRow | null,
    authUsers:       [] as AuthUser[],
    nextInviteId:    'invited-user-1',
  }

  // ── Supabase fluent-chain mock ─────────────────────────────────────────────
  function buildChain(table: string) {
    const s: {
      filters: Record<string, unknown>
      updatePayload: Record<string, unknown> | null
    } = { filters: {}, updatePayload: null }

    const c: any = {
      select() { return c },

      eq(col: string, val: unknown) { s.filters[col] = val; return c },

      update(payload: Record<string, unknown>) {
        s.updatePayload = payload
        return c
      },

      upsert(payload: Record<string, unknown>) {
        if (table === 'dax_subscriptions') {
          const existing = mockDB.subscriptions.find(
            (x) => x.email === payload.email && x.plan === payload.plan,
          )
          if (existing) Object.assign(existing, payload)
          else mockDB.subscriptions.push({ ...payload } as Sub)
        }
        return Promise.resolve({ data: null, error: null })
      },

      insert(payload: Record<string, unknown>) {
        if (table === 'dax_events_processed') {
          mockDB.processedEvents.add(payload.event_id as string)
        }
        if (table === 'access') {
          mockDB.accessRow = { ...payload, id: 'acc-1' } as AccessRow
        }
        return Promise.resolve({ data: null, error: null })
      },

      maybeSingle() {
        if (table === 'dax_events_processed') {
          const id = s.filters.event_id as string
          const found = Boolean(id && mockDB.processedEvents.has(id))
          return Promise.resolve({ data: found ? { event_id: id } : null, error: null })
        }
        if (table === 'access') {
          const uid = s.filters.user_id as string
          const row = uid
            ? (mockDB.accessRow?.user_id === uid ? mockDB.accessRow : null)
            : mockDB.accessRow
          return Promise.resolve({ data: row ?? null, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      },

      // Thenable: awaitable para update chains y array selects
      then(resolve: (v: unknown) => void, reject?: (e: unknown) => void): Promise<unknown> {
        if (s.updatePayload) {
          if (table === 'dax_subscriptions') {
            const email = s.filters.email as string
            const plan  = s.filters.plan  as string
            const sub = mockDB.subscriptions.find((x) => x.email === email && x.plan === plan)
            if (sub) Object.assign(sub, s.updatePayload)
          }
          if (table === 'access') {
            const uid = s.filters.user_id as string
            if (mockDB.accessRow && mockDB.accessRow.user_id === uid) {
              Object.assign(mockDB.accessRow, s.updatePayload)
            }
          }
          return Promise.resolve({ data: null, error: null }).then(resolve, reject)
        }
        // Array select (getActiveDaxPlans)
        if (table === 'dax_subscriptions') {
          const uid    = s.filters.user_id as string
          const status = s.filters.status  as string | undefined
          const plans  = mockDB.subscriptions
            .filter((x) => x.user_id === uid && (!status || x.status === status))
            .map((x) => ({ plan: x.plan }))
          return Promise.resolve({ data: plans, error: null }).then(resolve, reject)
        }
        return Promise.resolve({ data: null, error: null }).then(resolve, reject)
      },
    }

    return c
  }

  const mockFrom = vi.fn((table: string) => buildChain(table))

  const mockListUsers = vi.fn().mockImplementation(async () => ({
    data: { users: mockDB.authUsers },
    error: null,
  }))

  const mockInviteUser = vi.fn().mockImplementation(async () => ({
    data: { user: { id: mockDB.nextInviteId } },
    error: null,
  }))

  return { mockDB, mockFrom, mockListUsers, mockInviteUser }
})

// ── Reemplazar @/lib/auth-server con el mock ──────────────────────────────────

vi.mock('@/lib/auth-server', () => ({
  supabaseAdmin: {
    from:  mockFrom,
    auth: {
      admin: {
        listUsers:           mockListUsers,
        inviteUserByEmail:   mockInviteUser,
      },
    },
  },
  NUTRI_PLANS:     ['training_club', 'premium', 'gym_virtual_core'],
  IDENTITY_PLANS:  ['training_club', 'premium'],
}))

// ── Import del handler (después de vi.mock) ───────────────────────────────────

import { POST } from '@/app/api/webhooks/dax/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(body: Record<string, unknown>, secret = 'test-secret'): Request {
  return new Request('http://localhost/api/webhooks/dax', {
    method: 'POST',
    headers: {
      'x-dax-webhook-secret': secret,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

const BASE = {
  event_id: 'evt-base',
  type: 'subscription_created',
  email: 'test@example.com',
  product: 'training_club',
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('dax webhook — integración', () => {
  beforeEach(() => {
    mockDB.processedEvents.clear()
    mockDB.subscriptions  = []
    mockDB.accessRow      = null
    mockDB.authUsers      = [{ id: 'user-1', email: 'test@example.com' }]
    mockDB.nextInviteId   = 'invited-user-1'
    mockFrom.mockClear()
    mockListUsers.mockClear()
    mockInviteUser.mockClear()
  })

  // ── Resolución de campos ──────────────────────────────────────────────────

  it('acepta campos en la raíz → 200 ok', async () => {
    const res = await POST(makeReq(BASE) as any)
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('acepta campos en body.customData → 200 ok', async () => {
    const res = await POST(makeReq({ customData: BASE }) as any)
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  // ── Idempotencia ──────────────────────────────────────────────────────────

  it('alta repetida con el mismo event_id → 200 skipped sin duplicados', async () => {
    // Primera llamada: procesada
    const res1 = await POST(makeReq(BASE) as any)
    expect(res1.status).toBe(200)
    expect((await res1.json()).skipped).toBeUndefined()

    // Segunda llamada: mismo event_id → skipped
    const res2 = await POST(makeReq(BASE) as any)
    expect(res2.status).toBe(200)
    const j2 = await res2.json()
    expect(j2.ok).toBe(true)
    expect(j2.skipped).toBe(true)

    // Solo se creó una suscripción
    const subs = mockDB.subscriptions.filter(
      (s) => s.email === 'test@example.com' && s.plan === 'training_club',
    )
    expect(subs).toHaveLength(1)
  })

  // ── Baja con otro producto activo ─────────────────────────────────────────

  it('baja de un producto cuando existe otro activo → plan efectivo = producto restante', async () => {
    // Alta TC
    await POST(makeReq({ ...BASE, event_id: 'evt-tc', product: 'training_club' }) as any)
    // Alta GVC
    await POST(makeReq({ ...BASE, event_id: 'evt-gvc', product: 'gym_virtual_core' }) as any)

    expect(mockDB.subscriptions).toHaveLength(2)
    expect(mockDB.accessRow?.plan).toBe('training_club') // plan más alto

    // Baja TC
    await POST(makeReq({
      event_id: 'evt-cancel-tc',
      type:     'subscription_cancelled',
      email:    'test@example.com',
      product:  'training_club',
    }) as any)

    const tcSub  = mockDB.subscriptions.find((s) => s.plan === 'training_club')
    const gvcSub = mockDB.subscriptions.find((s) => s.plan === 'gym_virtual_core')
    expect(tcSub?.status).toBe('revoked')
    expect(gvcSub?.status).toBe('active')
    expect(mockDB.accessRow?.plan).toBe('gym_virtual_core')
    expect(mockDB.accessRow?.status).toBe('active')
  })

  // ── Baja sin productos restantes ──────────────────────────────────────────

  it('baja cuando no queda ningún producto activo → access.status = revoked', async () => {
    // Alta TC
    await POST(makeReq({ ...BASE, event_id: 'evt-tc2', product: 'training_club' }) as any)
    expect(mockDB.accessRow?.status).toBe('active')

    // Baja TC (único producto)
    await POST(makeReq({
      event_id: 'evt-cancel-tc2',
      type:     'subscription_cancelled',
      email:    'test@example.com',
      product:  'training_club',
    }) as any)

    expect(mockDB.subscriptions.find((s) => s.plan === 'training_club')?.status).toBe('revoked')
    expect(mockDB.accessRow?.status).toBe('revoked')
  })

  // ── 400: solo nombres de claves en el log ─────────────────────────────────

  it('400 por campos faltantes: console.error registra solo nombres de claves, nunca valores', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(
      makeReq({ some_key: 'valor_secreto', customData: { other_key: 'otro_valor' } }) as any,
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Missing required fields/)

    // console.error fue llamado exactamente una vez
    const calls = spy.mock.calls.filter((c) => String(c[0]).includes('400'))
    expect(calls.length).toBeGreaterThan(0)

    const logText = calls[0].map(String).join(' ')

    // Debe contener los NOMBRES de las claves
    expect(logText).toContain('some_key')
    expect(logText).toContain('other_key')

    // NO debe contener los valores
    expect(logText).not.toContain('valor_secreto')
    expect(logText).not.toContain('otro_valor')

    // NO debe contener el secreto del header
    expect(logText).not.toContain('test-secret')

    spy.mockRestore()
  })
})
