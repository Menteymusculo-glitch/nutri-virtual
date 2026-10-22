import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { requireTrackerUser, resolveToday, serverError } from '@/lib/trackerApi'
import { isValidDate } from '@/lib/calorieReport'

// "Cerrar mi día". Body: { date: 'AAAA-MM-DD', today: 'AAAA-MM-DD' }.
// Los días anteriores a hoy ya cuentan como cerrados; no se pueden cerrar días futuros.
export async function POST(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  let body: { date?: unknown; today?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const today = resolveToday(typeof body.today === 'string' ? body.today : null)
  const date = body.date ?? today
  if (!isValidDate(date)) return NextResponse.json({ error: 'Fecha inválida (formato AAAA-MM-DD).' }, { status: 400 })
  if (date > today) return NextResponse.json({ error: 'No puedes cerrar un día que aún no ha llegado.' }, { status: 400 })
  if (date < today) return NextResponse.json({ ok: true, date, closed: true, alreadyClosed: true })

  const { error } = await supabaseAdmin
    .from('day_closures')
    .upsert({ user_id: auth.user.id, log_date: date }, { onConflict: 'user_id,log_date', ignoreDuplicates: true })
  if (error) return serverError('tracker/day/close', error)

  return NextResponse.json({ ok: true, date, closed: true })
}
