import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, hasAccess, supabaseAdmin } from '@/lib/auth-server'
import { readJsonLimited } from '@/lib/requestBody'
import { MAX_CHECKIN_BODY_BYTES, parseCheckinInput } from '@/lib/saveValidation'

// Guarda el check-in semanal en `checkins`. Cualquier plan activo puede usarlo.
// El dueño (user_id) sale SIEMPRE de la sesión. Un check-in por usuaria y semana:
// si ya existe, se actualiza el suyo.
export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Inicia sesión para guardar tu check-in.' }, { status: 401 })
  if (!(await hasAccess(user.id))) {
    return NextResponse.json({ error: 'Necesitas un plan activo para guardar check-ins.' }, { status: 403 })
  }

  const body = await readJsonLimited(req, MAX_CHECKIN_BODY_BYTES)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  const parsed = parseCheckinInput(body.value)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const checkin = parsed.value

  const { data: existing, error: findError } = await supabaseAdmin
    .from('checkins')
    .select('id')
    .eq('user_id', user.id)
    .eq('week', checkin.week)
    .maybeSingle()
  if (findError) {
    console.error('[save-checkin] find', findError.message)
    return NextResponse.json({ error: 'Error guardando el check-in.' }, { status: 500 })
  }

  const { error } = existing
    ? await supabaseAdmin.from('checkins').update(checkin).eq('id', existing.id).eq('user_id', user.id)
    : await supabaseAdmin.from('checkins').insert({ ...checkin, user_id: user.id })
  if (error) {
    console.error('[save-checkin] write', error.message)
    return NextResponse.json({ error: 'Error guardando el check-in.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated: !!existing })
}
