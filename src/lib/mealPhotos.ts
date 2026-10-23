// Fotos de comida en Supabase Storage (bucket PRIVADO meal-photos) y consentimiento.
// Ruta de cada foto: {user_id}/{uuid}.jpg. El navegador nunca accede al bucket:
// sube por /api/meals/photo y ve las fotos con URLs firmadas de 60 s.
import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/auth-server'
import { PHOTO_CONSENT_VERSION } from '@/lib/photoCopy'

export const PHOTO_BUCKET = 'meal-photos'
export const SIGNED_URL_SECONDS = 60

const PHOTO_PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/

export function isPhotoPath(path: unknown): path is string {
  return typeof path === 'string' && PHOTO_PATH_RE.test(path)
}

// La foto es de esta usuaria: formato válido y dentro de su carpeta.
export function isOwnPhotoPath(userId: string, path: unknown): path is string {
  return isPhotoPath(path) && path.startsWith(`${userId.toLowerCase()}/`)
}

export function newPhotoPath(userId: string): string {
  return `${userId.toLowerCase()}/${randomUUID()}.jpg`
}

type StorageError = { message: string } | null

export async function uploadPhoto(path: string, jpeg: Uint8Array): Promise<StorageError> {
  const { error } = await supabaseAdmin.storage.from(PHOTO_BUCKET).upload(path, jpeg, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  return error
}

export async function removePhotos(paths: string[]): Promise<StorageError> {
  if (paths.length === 0) return null
  const { error } = await supabaseAdmin.storage.from(PHOTO_BUCKET).remove(paths)
  return error
}

export async function signedPhotoUrl(path: string): Promise<{ url: string | null; error: StorageError }> {
  const { data, error } = await supabaseAdmin.storage.from(PHOTO_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  return { url: data?.signedUrl ?? null, error }
}

// Borra una foto de la usuaria: del Storage y de cualquier comida que la use.
export async function deleteOwnPhoto(userId: string, path: string): Promise<StorageError> {
  const removeError = await removePhotos([path])
  if (removeError) return removeError
  const { error } = await supabaseAdmin
    .from('meal_logs')
    .update({ photo_path: null })
    .eq('user_id', userId)
    .eq('photo_path', path)
  return error
}

// Borra TODAS las fotos de una usuaria (al eliminar su cuenta). Si el bucket aún
// no existe (SQL sin ejecutar), no hay nada que borrar.
export async function deleteAllUserPhotos(userId: string): Promise<StorageError> {
  const folder = userId.toLowerCase()
  const bucket = supabaseAdmin.storage.from(PHOTO_BUCKET)
  for (let page = 0; page < 100; page++) {
    const { data, error } = await bucket.list(folder, { limit: 1000 })
    if (error) return /not found/i.test(error.message) ? null : error
    if (!data || data.length === 0) return null
    const { error: removeError } = await bucket.remove(data.map((f) => `${folder}/${f.name}`))
    if (removeError) return removeError
    if (data.length < 1000) return null
  }
  return null
}

// Consentimiento vigente: aceptado, no retirado y con la versión actual del texto.
export async function loadPhotoConsent(userId: string): Promise<{ consented: boolean; consentedAt: string | null; error: StorageError }> {
  const { data, error } = await supabaseAdmin
    .from('photo_consents')
    .select('version, consented_at, revoked_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { consented: false, consentedAt: null, error }
  const consented = !!data && !data.revoked_at && data.version === PHOTO_CONSENT_VERSION
  return { consented, consentedAt: consented ? (data!.consented_at as string) : null, error: null }
}
