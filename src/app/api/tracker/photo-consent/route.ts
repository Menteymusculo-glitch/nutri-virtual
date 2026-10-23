import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, supabaseAdmin } from '@/lib/auth-server'
import { requireTrackerUser, serverError } from '@/lib/trackerApi'
import { readJsonLimited } from '@/lib/requestBody'
import { loadPhotoConsent } from '@/lib/mealPhotos'
import { PHOTO_CONSENT_VERSION } from '@/lib/photoCopy'

// Consentimiento explícito para analizar fotos (versión + fecha).
export async function GET() {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response
  const consent = await loadPhotoConsent(auth.user.id)
  if (consent.error) return serverError('photo-consent get', consent.error)
  return NextResponse.json({ consented: consent.consented, consented_at: consent.consentedAt, version: PHOTO_CONSENT_VERSION })
}

// Acepta. Cuerpo: { version }, que debe ser la versión del texto que se le mostró.
export async function POST(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response
  const body = await readJsonLimited(req, 1024)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  if ((body.value as { version?: unknown } | null)?.version !== PHOTO_CONSENT_VERSION) {
    return NextResponse.json({ error: 'El texto del permiso cambió. Recarga la página y vuelve a leerlo.' }, { status: 409 })
  }
  const consentedAt = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('photo_consents')
    .upsert({ user_id: auth.user.id, version: PHOTO_CONSENT_VERSION, consented_at: consentedAt, revoked_at: null }, { onConflict: 'user_id' })
  if (error) return serverError('photo-consent post', error)
  return NextResponse.json({ consented: true, consented_at: consentedAt, version: PHOTO_CONSENT_VERSION })
}

// Retira el permiso. Solo hace falta la sesión: retirarlo no depende del plan.
export async function DELETE() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 })
  const { error } = await supabaseAdmin
    .from('photo_consents')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('revoked_at', null)
  if (error) return serverError('photo-consent delete', error)
  return NextResponse.json({ consented: false })
}
