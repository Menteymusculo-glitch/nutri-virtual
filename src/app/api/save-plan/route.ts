import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, hasNutriAccess, supabaseAdmin } from '@/lib/auth-server'
import { readJsonLimited } from '@/lib/requestBody'
import { MAX_PLAN_BODY_BYTES, parsePlanInput } from '@/lib/saveValidation'

// Guarda el plan de la usuaria en `clients`. El dueño (user_id) sale SIEMPRE de la
// sesión; cualquier user_id/email/id del cuerpo se ignora. Si ya tiene un registro,
// se actualiza el suyo (nunca el de otra usuaria).
export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Inicia sesión para guardar tu plan.' }, { status: 401 })
  if (!(await hasNutriAccess(user.id))) {
    return NextResponse.json({ error: 'Tu plan no incluye Nutri Virtual.' }, { status: 403 })
  }

  const body = await readJsonLimited(req, MAX_PLAN_BODY_BYTES)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  const parsed = parsePlanInput(body.value)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { name, profile, plan } = parsed.value

  const { data: existing, error: findError } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (findError) {
    console.error('[save-plan] find', findError.message)
    return NextResponse.json({ error: 'Error guardando el plan.' }, { status: 500 })
  }

  const { error } = existing
    ? await supabaseAdmin
        .from('clients')
        .update({ name, profile, plan })
        .eq('id', existing.id)
        .eq('user_id', user.id)
    : await supabaseAdmin.from('clients').insert({ user_id: user.id, name, profile, plan })
  if (error) {
    console.error('[save-plan] write', error.message)
    return NextResponse.json({ error: 'Error guardando el plan.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated: !!existing })
}
