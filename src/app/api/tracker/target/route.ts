import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { loadTarget, requireTrackerUser, requireTrackerUserWith, serverError } from '@/lib/trackerApi'
import { parseTargetInput } from '@/lib/trackerValidation'
import { computeEnergy, targetKcal } from '@/lib/energy'

export async function GET() {
  const auth = await requireTrackerUserWith(loadTarget)
  if (!auth.ok) return auth.response

  const { data, error } = auth.data
  if (error) return serverError('tracker/target get', error)
  return NextResponse.json({ target: data })
}

// Alta: requiere `goal` + `profile` (sexo, edad, peso, altura, actividad, % grasa opcional);
// el TDEE y el objetivo se calculan aquí con energy.ts.
// Después: se puede cambiar `goal` (recalcula el objetivo desde el TDEE guardado),
// `hide_calories`, o enviar un `profile` nuevo para recalcular el TDEE.
export async function PUT(req: NextRequest) {
  // Como en POST /api/meals: sin sesión o sin plan se responde 401/403 antes que 400.
  let body: unknown
  let badJson = false
  try {
    body = await req.json()
  } catch {
    badJson = true
  }
  const parsed = badJson ? null : parseTargetInput(body)
  if (!parsed || !parsed.ok) {
    const auth = await requireTrackerUser()
    if (!auth.ok) return auth.response
    return NextResponse.json({ error: parsed ? parsed.error : 'JSON inválido.' }, { status: 400 })
  }
  const input = parsed.value

  // Leer el objetivo actual (solo lectura) en paralelo con el plan; el upsert va después.
  const auth = await requireTrackerUserWith(loadTarget)
  if (!auth.ok) return auth.response
  const { data: current, error: loadError } = auth.data
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
