import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { requireTrackerUser, serverError } from '@/lib/trackerApi'
import { isUuid } from '@/lib/trackerValidation'
import { removePhotos } from '@/lib/mealPhotos'

// Borra una comida solo si pertenece a la usuaria (los items caen en cascada).
// Si tenía foto, la foto se borra también del Storage.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  if (!isUuid(id)) return NextResponse.json({ error: 'Comida no encontrada.' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('meal_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('photo_path')
  if (error) return serverError('meals/delete', error)
  if (!data || data.length === 0) return NextResponse.json({ error: 'Comida no encontrada.' }, { status: 404 })

  const photos = data.map((m) => m.photo_path as string | null).filter((p): p is string => !!p)
  const photoError = await removePhotos(photos)
  if (photoError) return serverError('meals/delete photo', photoError)

  return NextResponse.json({ ok: true })
}
