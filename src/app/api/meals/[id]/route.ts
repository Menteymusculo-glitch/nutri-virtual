import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { requireTrackerUser, serverError } from '@/lib/trackerApi'
import { isUuid } from '@/lib/trackerValidation'

// Borra una comida solo si pertenece a la usuaria (los items caen en cascada).
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  if (!isUuid(id)) return NextResponse.json({ error: 'Comida no encontrada.' }, { status: 404 })

  const { count, error } = await supabaseAdmin
    .from('meal_logs')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', auth.user.id)
  if (error) return serverError('meals/delete', error)
  if (!count) return NextResponse.json({ error: 'Comida no encontrada.' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
