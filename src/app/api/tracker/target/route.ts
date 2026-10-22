import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { loadTarget, requireTrackerUser, serverError } from '@/lib/trackerApi'
import { parseTargetInput } from '@/lib/trackerValidation'
import { computeEnergy, targetKcal } from '@/lib/energy'

export async function GET() {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const { data, error } = await loadTarget(auth.user.id)
  if (error) return serverError('tracker/target get', error)
  return NextResponse.json({ target: data })
}

// Alta: requiere `goal` + `profile` (sexo, edad, peso, altura, actividad, % grasa opcional);
// el TDEE y el objetivo se calculan aquí con energy.ts.
// Después: se puede cambiar `goal` (recalcula el objetivo desde el TDEE guardado),
// `hide_calories`, o enviar un `profile` nuevo para recalcular el TDEE.
export async function PUT(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }
  const parsed = parseTargetInput(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const input = parsed.value

  const { data: current, error: loadError } = await loadTarget(auth.user.id)
  if (loadError) return serverError('tracker/target load', loadError)

  const goal = input.goal ?? current?.goal
  if (!goal) return NextResponse.json({ error: 'Elige tu objetivo.' }, { status: 400 })

  let tdeeKcal: number
  let sex: 'female' | 'male' | null
  if (input.profile) {
    const e = computeEnergy(input.profile, goal)
    tdeeKcal = e.tdeeKcal
    sex = input.profile.sex
  } else if (current) {
    tdeeKcal = current.tdee_kcal
    sex = current.sex
  } else {
    return NextResponse.json({ error: 'Necesitamos tus datos para calcular tu objetivo.' }, { status: 400 })
  }

  const row = {
    user_id: auth.user.id,
    goal,
    tdee_kcal: tdeeKcal,
    target_kcal: targetKcal(tdeeKcal, goal, sex),
    sex,
    hide_calories: input.hide_calories ?? current?.hide_calories ?? false,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('nutrition_targets')
    .upsert(row, { onConflict: 'user_id' })
    .select('user_id, goal, target_kcal, tdee_kcal, sex, hide_calories, updated_at')
    .single()
  if (error) return serverError('tracker/target upsert', error)

  return NextResponse.json({ target: data })
}
