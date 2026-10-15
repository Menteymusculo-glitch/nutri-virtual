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
  // Sin fila existente + hay plan → insert
  it('sin fila + plan efectivo → insert', () => {
    expect(determineAccessAction(null, 'training_club', false)).toBe('insert')
  })

  // Fila DAX existente + plan efectivo → update
  it('fila dax + plan efectivo → update', () => {
    expect(determineAccessAction('dax', 'gym_virtual_core', true)).toBe('update')
  })

  // Fila DAX + sin planes activos → revoke
  it('fila dax + sin plan efectivo → revoke', () => {
    expect(determineAccessAction('dax', null, true)).toBe('revoke')
  })

  // Sin fila + sin planes activos → skip (nada que revocar)
  it('sin fila + sin plan efectivo → skip', () => {
    expect(determineAccessAction(null, null, false)).toBe('skip')
  })

  // (e) Fila de Stripe → nunca tocar, incluso si hay plan efectivo
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
