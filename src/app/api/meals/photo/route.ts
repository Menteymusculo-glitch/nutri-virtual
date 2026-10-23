import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, getTrackerAccess, supabaseAdmin } from '@/lib/auth-server'
import { serverError } from '@/lib/trackerApi'
import { readBytesLimited, readJsonLimited } from '@/lib/requestBody'
import { clientIp, countRecentFailures, hashedKey, recordFailure } from '@/lib/rateLimit'
import { PHOTO_MAX_UPLOAD_BYTES, stripJpegMetadata } from '@/lib/photoFile'
import { checkPhotoQuota, photoDailyQuota } from '@/lib/photoQuota'
import { PHOTO_QUOTA_WINDOW_MS } from '@/lib/nutritionConstants'
import { PHOTO_MESSAGES } from '@/lib/photoCopy'
import { analyzeMealPhoto, type VisionFailure } from '@/lib/vision'
import { isLowConfidence } from '@/lib/visionSchema'
import { photoSearchQuery, pickFoodMatch } from '@/lib/photoMatch'
import { deleteOwnPhoto, isOwnPhotoPath, loadPhotoConsent, newPhotoPath, removePhotos, uploadPhoto } from '@/lib/mealPhotos'

// La llamada al modelo tiene su propio límite de 20 s; esto deja margen para el resto.
export const maxDuration = 30

const USER_SCOPE = 'photo_user'
const IP_SCOPE = 'photo_ip'

const json = (body: unknown, status = 200, headers?: Record<string, string>) => NextResponse.json(body, { status, headers })
const unavailable = () => json({ error: PHOTO_MESSAGES.unavailable, code: 'vision_unavailable' }, 503)

const VISION_FAILURE: Record<VisionFailure, { status: number; error: string; code: string }> = {
  unavailable: { status: 503, error: PHOTO_MESSAGES.unavailable, code: 'vision_unavailable' },
  timeout: { status: 504, error: PHOTO_MESSAGES.timeout, code: 'vision_timeout' },
  busy: { status: 503, error: PHOTO_MESSAGES.busy, code: 'vision_busy' },
  error: { status: 502, error: PHOTO_MESSAGES.failed, code: 'vision_error' },
}

interface FoodRow {
  id: string; name: string; name_norm: string; aliases: string[] | null
  kcal_100g: number; protein_100g: number | null; carbs_100g: number | null; fat_100g: number | null
  prep_state: string | null; quality: string | null; sim: number | null
}

// Analiza la foto del plato y devuelve una PROPUESTA (no guarda ninguna comida).
// Cuerpo: la foto en JPEG (image/jpeg), ya comprimida en el navegador.
export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user) return json({ error: 'Inicia sesión para continuar.' }, 401)

  const userKey = hashedKey('user', user.id)
  const ipKey = hashedKey('ip', clientIp(req.headers))
  const [access, consent, usedByUser, usedByIp] = await Promise.all([
    getTrackerAccess(user.id),
    loadPhotoConsent(user.id),
    countRecentFailures(USER_SCOPE, userKey, PHOTO_QUOTA_WINDOW_MS),
    countRecentFailures(IP_SCOPE, ipKey, PHOTO_QUOTA_WINDOW_MS),
  ])
  if (!access.allowed) return json({ error: 'Tu plan no incluye el registro diario.', code: 'no_plan' }, 403)
  if (consent.error) { console.error('[meals/photo] consent', consent.error.message); return unavailable() }
  if (!consent.consented) return json({ error: PHOTO_MESSAGES.consentRequired, code: 'consent_required' }, 403)

  // Si el limitador no responde, falla cerrado (como /api/verify-code).
  if (usedByUser.error || usedByIp.error) {
    console.error('[meals/photo] rate limit', (usedByUser.error ?? usedByIp.error)!.message)
    return unavailable()
  }
  const quota = checkPhotoQuota({ plan: access.plan, usedByUser: usedByUser.count, usedByIp: usedByIp.count })
  if (!quota.ok) {
    const retry = { 'Retry-After': String(PHOTO_QUOTA_WINDOW_MS / 1000) }
    return quota.reason === 'user'
      ? json({ error: PHOTO_MESSAGES.quotaUser(photoDailyQuota(access.plan)), code: 'quota_user' }, 429, retry)
      : json({ error: PHOTO_MESSAGES.quotaIp, code: 'quota_ip' }, 429, retry)
  }

  // Tipo y tamaño también en el servidor: solo JPEG, como máximo 3 MB, sin metadatos.
  const contentType = req.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  if (contentType !== 'image/jpeg') return json({ error: PHOTO_MESSAGES.notJpeg }, 415)
  const body = await readBytesLimited(req, PHOTO_MAX_UPLOAD_BYTES)
  if (!body.ok) return json({ error: body.error }, body.status)
  const jpeg = stripJpegMetadata(body.bytes)
  if (!jpeg) return json({ error: PHOTO_MESSAGES.notJpeg }, 415)

  // Cuenta el intento ANTES de llamar al modelo (cuentan los análisis, se guarden o no).
  const [userRecordError, ipRecordError] = await Promise.all([
    recordFailure(USER_SCOPE, userKey, PHOTO_QUOTA_WINDOW_MS),
    recordFailure(IP_SCOPE, ipKey, PHOTO_QUOTA_WINDOW_MS),
  ])
  if (userRecordError || ipRecordError) {
    console.error('[meals/photo] record attempt', (userRecordError ?? ipRecordError)!.message)
    return unavailable()
  }

  // Subida al bucket privado y análisis, en paralelo.
  const photoPath = newPhotoPath(user.id)
  // Sin propuesta la foto no sirve: no se deja en el Storage.
  const discardPhoto = async () => {
    const cleanupError = await removePhotos([photoPath])
    if (cleanupError) console.error('[meals/photo] cleanup', cleanupError.message)
  }
  const [uploadError, vision] = await Promise.all([uploadPhoto(photoPath, jpeg), analyzeMealPhoto(jpeg)])
  if (uploadError || !vision.ok) {
    if (!uploadError) await discardPhoto()
    if (uploadError) return serverError('meals/photo upload', uploadError)
    const failure = VISION_FAILURE[(vision as { reason: VisionFailure }).reason]
    return json({ error: failure.error, code: failure.code }, failure.status)
  }

  // Cada elemento se busca en foods con el mismo buscador del tracker.
  const { items } = vision.output
  const queries = [...new Set(items.map((i) => photoSearchQuery(i.name)).filter((q) => q.length >= 2))]
  const searches = await Promise.all(queries.map((q) => supabaseAdmin.rpc('search_foods', { q, max_rows: 40 }).then((r) => r)))
  const failed = searches.find((s) => s.error)
  if (failed) {
    await discardPhoto()
    return serverError('meals/photo search', failed.error)
  }
  const candidatesByQuery = new Map(queries.map((q, i) => [q, (searches[i].data ?? []) as FoodRow[]]))
  const matches = items.map((i) => {
    const q = photoSearchQuery(i.name)
    return pickFoodMatch(candidatesByQuery.get(q) ?? [], q, i.prep)
  })

  const matchedIds = [...new Set(matches.filter((m): m is FoodRow => !!m).map((m) => m.id))]
  const portionsByFood = new Map<string, { label: string; grams: number }[]>()
  if (matchedIds.length) {
    const { data: portions, error: portionsError } = await supabaseAdmin
      .from('food_portions')
      .select('food_id, label, grams')
      .in('food_id', matchedIds)
      .order('grams', { ascending: true })
    if (portionsError) {
      await discardPhoto()
      return serverError('meals/photo portions', portionsError)
    }
    for (const p of (portions ?? []) as { food_id: string; label: string; grams: number }[]) {
      const list = portionsByFood.get(p.food_id) ?? []
      list.push({ label: p.label, grams: Number(p.grams) })
      portionsByFood.set(p.food_id, list)
    }
  }

  // Del modelo solo salen nombre, gramos, preparación y confianza. Las kcal por
  // 100 g vienen de foods; el total lo calcula el navegador con mealMath y el
  // servidor lo recalcula al guardar.
  return json({
    photo_path: photoPath,
    no_food: items.length === 0,
    low_confidence: isLowConfidence(items),
    items: items.map((i, idx) => {
      const f = matches[idx]
      return {
        name: i.name,
        grams: i.grams,
        prep: i.prep,
        confidence: i.confidence,
        food: f ? {
          id: f.id, name: f.name, kcal_100g: f.kcal_100g,
          protein_100g: f.protein_100g, carbs_100g: f.carbs_100g, fat_100g: f.fat_100g,
          prep_state: f.prep_state, quality: f.quality ?? 'approx',
          portions: portionsByFood.get(f.id) ?? [],
        } : null,
      }
    }),
  })
}

// Descarta una foto analizada que no se llegó a guardar (o borra una ya guardada).
// Solo hace falta la sesión: borrar tus propios datos no depende del plan.
export async function DELETE(req: NextRequest) {
  const user = await getServerUser()
  if (!user) return json({ error: 'Inicia sesión para continuar.' }, 401)
  const body = await readJsonLimited(req, 1024)
  if (!body.ok) return json({ error: body.error }, body.status)
  const path = (body.value as { photo_path?: unknown } | null)?.photo_path
  if (!isOwnPhotoPath(user.id, path)) return json({ error: 'Foto no encontrada.' }, 404)
  const error = await deleteOwnPhoto(user.id, path)
  if (error) return serverError('meals/photo delete', error)
  return json({ ok: true })
}
