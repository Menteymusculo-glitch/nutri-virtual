import { NextResponse } from 'next/server'
import { getServerUser, supabaseAdmin } from '@/lib/auth-server'
import { requireTrackerUser, serverError } from '@/lib/trackerApi'
import { isUuid } from '@/lib/trackerValidation'
import { deleteOwnPhoto, signedPhotoUrl } from '@/lib/mealPhotos'

const notFound = () => NextResponse.json({ error: 'Foto no encontrada.' }, { status: 404 })

async function ownMealPhoto(userId: string, mealId: string) {
  const { data, error } = await supabaseAdmin
    .from('meal_logs')
    .select('photo_path')
    .eq('id', mealId)
    .eq('user_id', userId)
    .maybeSingle()
  return { path: (data?.photo_path as string | null | undefined) ?? null, error }
}

// URL firmada de 60 s para ver la foto de una comida propia. Nunca URLs públicas.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  if (!isUuid(id)) return notFound()
  const { path, error } = await ownMealPhoto(auth.user.id, id)
  if (error) return serverError('meals/photo get', error)
  if (!path) return notFound()
  const signed = await signedPhotoUrl(path)
  if (signed.error || !signed.url) return serverError('meals/photo sign', signed.error)
  return NextResponse.json({ url: signed.url }, { headers: { 'Cache-Control': 'no-store' } })
}

// "Borrar esta foto": la comida se queda y la foto desaparece del Storage.
// Solo hace falta la sesión: borrar tus propios datos no depende del plan.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 })
  const { id } = await ctx.params
  if (!isUuid(id)) return notFound()
  const { path, error } = await ownMealPhoto(user.id, id)
  if (error) return serverError('meals/photo find', error)
  if (!path) return notFound()
  const deleteError = await deleteOwnPhoto(user.id, path)
  if (deleteError) return serverError('meals/photo delete', deleteError)
  return NextResponse.json({ ok: true })
}
