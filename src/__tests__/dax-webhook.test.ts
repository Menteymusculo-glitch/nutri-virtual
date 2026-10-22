import { describe, it, expect } from 'vitest'
import {
  computeEffectivePlan,
  determineAccessAction,
  PLAN_RANK,
  NUTRI_PLANS,
  IDENTITY_PLANS,
} from '@/lib/dax-logic'

// ─── computeEffectivePlan ────────────────────────────────────────────────────

describe('computeEffectivePlan', () => {
  // (a) Ambos productos activos → gana el más alto
  it('(a) training_club + gym_virtual_core → training_club', () => {
    expect(computeEffectivePlan(['training_club', 'gym_virtual_core'])).toBe('training_club')
  })

  it('(a) premium + training_club → premium', () => {
    expect(computeEffectivePlan(['premium', 'training_club'])).toBe('premium')
  })

  it('(a) premium + gym_virtual_core → premium', () => {
    expect(computeEffectivePlan(['premium', 'gym_virtual_core'])).toBe('premium')
  })

  // (b) Cancela training_club, queda gym_virtual_core activo
  it('(b) solo gym_virtual_core activo → gym_virtual_core', () => {
    expect(computeEffectivePlan(['gym_virtual_core'])).toBe('gym_virtual_core')
  })

  // (c) Cancela gym_virtual_core, queda training_club activo
  it('(c) solo training_club activo → training_club', () => {
    expect(computeEffectivePlan(['training_club'])).toBe('training_club')
  })

  // (d) Sin productos activos → null (revocar acceso)
  it('(d) lista vacía → null', () => {
    expect(computeEffectivePlan([])).toBeNull()
  })
})

// ─── determineAccessAction ───────────────────────────────────────────────────

describe('determineAccessAction', () => {
  it('sin fila + plan efectivo → insert', () => {
    expect(determineAccessAction(null, 'training_club', false)).toBe('insert')
  })

  it('fila dax + plan efectivo → update', () => {
    expect(determineAccessAction('dax', 'gym_virtual_core', true)).toBe('update')
  })

  it('fila dax + sin plan efectivo → revoke', () => {
    expect(determineAccessAction('dax', null, true)).toBe('revoke')
  })

  it('sin fila + sin plan efectivo → skip', () => {
    expect(determineAccessAction(null, null, false)).toBe('skip')
  })

  it('(e) source=stripe → skip (no tocar nunca)', () => {
    expect(determineAccessAction('stripe', 'training_club', true)).toBe('skip')
  })

  it('(e) source=manual → skip', () => {
    expect(determineAccessAction('manual', 'premium', true)).toBe('skip')
  })
})

// ─── PLAN_RANK ───────────────────────────────────────────────────────────────

describe('PLAN_RANK', () => {
  it('premium > training_club > gym_virtual_core', () => {
    expect(PLAN_RANK.premium).toBeGreaterThan(PLAN_RANK.training_club)
    expect(PLAN_RANK.training_club).toBeGreaterThan(PLAN_RANK.gym_virtual_core)
    expect(PLAN_RANK.gym_virtual_core).toBeGreaterThan(0)
  })
})

// ─── (f) Separación NUTRI_PLANS / IDENTITY_PLANS ────────────────────────────

describe('plan gates', () => {
  it('(f) gym_virtual_core en NUTRI_PLANS', () => {
    expect(NUTRI_PLANS).toContain('gym_virtual_core')
  })

  it('(f) gym_virtual_core NO en IDENTITY_PLANS', () => {
    expect(IDENTITY_PLANS).not.toContain('gym_virtual_core')
  })

  it('training_club y premium en ambos planes', () => {
    expect(NUTRI_PLANS).toContain('training_club')
    expect(NUTRI_PLANS).toContain('premium')
    expect(IDENTITY_PLANS).toContain('training_club')
    expect(IDENTITY_PLANS).toContain('premium')
  })
})

describe('nutri_app (app 9 €/mes con prueba de 7 días)', () => {
  it('da acceso a Nutri Virtual pero no al Motor de Identidad', () => {
    expect(NUTRI_PLANS).toContain('nutri_app')
    expect(IDENTITY_PLANS).not.toContain('nutri_app')
  })
  it('tiene rango menor que gym_virtual_core', () => {
    expect(PLAN_RANK.nutri_app).toBeGreaterThan(0)
    expect(PLAN_RANK.nutri_app).toBeLessThan(PLAN_RANK.gym_virtual_core)
  })
  it('un plan de coaching activo gana sobre nutri_app', () => {
    expect(computeEffectivePlan(['nutri_app', 'training_club'])).toBe('training_club')
    expect(computeEffectivePlan(['nutri_app', 'gym_virtual_core'])).toBe('gym_virtual_core')
  })
  it('al cancelar el plan de coaching queda nutri_app', () => {
    expect(computeEffectivePlan(['nutri_app'])).toBe('nutri_app')
  })
})

// ─── resolveWebhookFields — lógica de extracción root / customData ───────────
// Prueba la misma lógica que usa el handler, sin necesidad de levantar HTTP.

type RawBody = Record<string, unknown>

function resolveFields(body: RawBody) {
  const cd = (body.customData && typeof body.customData === 'object')
    ? body.customData as Record<string, unknown>
    : {}
  return {
    event_id: (body.event_id ?? cd.event_id) as string | undefined,
    type:     (body.type     ?? cd.type)     as string | undefined,
    email:    (body.email    ?? cd.email)     as string | undefined,
    product:  (body.product  ?? cd.product)   as string | undefined,
    rootKeys: Object.keys(body),
    cdKeys:   Object.keys(cd),
  }
}

describe('webhook field resolution', () => {
  const FULL = { event_id: 'e1', type: 'subscription_created', email: 'x@x.com', product: 'training_club' }

  it('campos en la raíz → se leen correctamente', () => {
    const r = resolveFields(FULL)
    expect(r.event_id).toBe('e1')
    expect(r.type).toBe('subscription_created')
    expect(r.email).toBe('x@x.com')
    expect(r.product).toBe('training_club')
  })

  it('campos solo en customData → se leen correctamente', () => {
    const r = resolveFields({ customData: FULL })
    expect(r.event_id).toBe('e1')
    expect(r.type).toBe('subscription_created')
    expect(r.email).toBe('x@x.com')
    expect(r.product).toBe('training_club')
  })

  it('campos repartidos entre root y customData → root tiene precedencia', () => {
    const r = resolveFields({
      event_id: 'root-id',
      type: 'root-type',
      customData: { event_id: 'cd-id', type: 'cd-type', email: 'x@x.com', product: 'training_club' },
    })
    expect(r.event_id).toBe('root-id')
    expect(r.type).toBe('root-type')
    expect(r.email).toBe('x@x.com')     // viene de customData
    expect(r.product).toBe('training_club') // viene de customData
  })

  it('campos ausentes → undefined en los cuatro, keys disponibles para el log', () => {
    const r = resolveFields({ foo: 'bar', customData: { baz: 'qux' } })
    expect(r.event_id).toBeUndefined()
    expect(r.type).toBeUndefined()
    expect(r.email).toBeUndefined()
    expect(r.product).toBeUndefined()
    expect(r.rootKeys).toContain('foo')
    expect(r.cdKeys).toContain('baz')
  })
})
