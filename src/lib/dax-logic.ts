// Pure DAX business logic — no DB, no Next.js, easy to unit-test

// Higher number = higher plan tier
export const PLAN_RANK: Record<string, number> = {
  premium:          3,
  training_club:    2,
  gym_virtual_core: 1,
  nutri_app:        0.5, // app Nutri Virtual 9 €/mes (7 días de prueba); nunca supera a un plan de coaching
}

// Plans that unlock Nutri Virtual (includes Gym Virtual)
export const NUTRI_PLANS = ['training_club', 'premium', 'gym_virtual_core', 'nutri_app'] as const
// Plans that unlock Motor de Identidad (Gym Virtual excluded)
export const IDENTITY_PLANS = ['training_club', 'premium'] as const

/**
 * Given a list of currently active DAX plan slugs, return the highest-ranked one.
 * Returns null when the list is empty (no active products → revoke access).
 */
export function computeEffectivePlan(activePlans: string[]): string | null {
  if (activePlans.length === 0) return null
  return activePlans.reduce((best, p) =>
    (PLAN_RANK[p] ?? 0) > (PLAN_RANK[best] ?? 0) ? p : best
  )
}

/**
 * Decide what to do with the access row given the current DB state.
 * Pure function — no side effects.
 *
 * Rules:
 *  - If the existing row was NOT created by DAX, never touch it (case e).
 *  - If effective plan exists → update/insert.
 *  - If effective plan is null → revoke or skip (nothing to revoke if row absent).
 */
export function determineAccessAction(
  currentSource: string | null | undefined,
  effectivePlan: string | null,
  hasExistingRow: boolean,
): 'update' | 'insert' | 'revoke' | 'skip' {
  // Case (e): source is not 'dax' (e.g. 'stripe', 'manual') — never touch
  if (hasExistingRow && currentSource !== 'dax') return 'skip'

  if (effectivePlan !== null) {
    return hasExistingRow ? 'update' : 'insert'
  }

  // effectivePlan is null (all DAX products revoked)
  return hasExistingRow ? 'revoke' : 'skip'
}
