// Cuotas del análisis de fotos (pura). Las constantes viven en nutritionConstants.ts.
import {
  PHOTO_DAILY_QUOTA_DEFAULT, PHOTO_DAILY_QUOTA_NUTRI_APP, PHOTO_IP_DAILY_MAX,
} from '@/lib/nutritionConstants'

export function photoDailyQuota(plan: string | null | undefined): number {
  return plan === 'nutri_app' ? PHOTO_DAILY_QUOTA_NUTRI_APP : PHOTO_DAILY_QUOTA_DEFAULT
}

export type QuotaDecision = { ok: true } | { ok: false; reason: 'user' | 'ip' }

// usedByUser / usedByIp = intentos en las últimas 24 h, antes del actual.
export function checkPhotoQuota(params: { plan: string | null | undefined; usedByUser: number; usedByIp: number }): QuotaDecision {
  if (params.usedByUser >= photoDailyQuota(params.plan)) return { ok: false, reason: 'user' }
  if (params.usedByIp >= PHOTO_IP_DAILY_MAX) return { ok: false, reason: 'ip' }
  return { ok: true }
}
