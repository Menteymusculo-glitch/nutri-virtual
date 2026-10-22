import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { loadClosedDates, loadTarget, requireTrackerUser, resolveToday, serverError } from '@/lib/trackerApi'
import { weekAdjustment, weekWindow } from '@/lib/calorieReport'

// Últimos 7 días COMPLETOS + ajuste semanal.
// ?today=AAAA-MM-DD (fecha local de la usuaria; `end` se acepta como alias antiguo).
// El día de hoy solo entra si la usuaria lo cerró; si no, la ventana termina ayer.
export async function GET(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const params = req.nextUrl.searchParams
  const today = resolveToday(params.get('today') ?? params.get('end'))

  const [{ data: target, error: targetError }, { data: closedToday, error: closedError }] = await Promise.all([
    loadTarget(auth.user.id),
    loadClosedDates(auth.user.id, [today]),
  ])
  if (targetError) return serverError('tracker/week target', targetError)
  if (closedError) return serverError('tracker/week closures', closedError)

  const todayClosed = closedToday.includes(today)
  const dates = weekWindow(today, todayClosed)

  const { data: logs, error: logsError } = await supabaseAdmin
    .from('meal_logs')
    .select('log_date, total_kcal')
    .eq('user_id', auth.user.id)
    .gte('log_date', dates[0])
    .lte('log_date', dates[dates.length - 1])
  if (logsError) return serverError('tracker/week logs', logsError)

  const byDate = new Map<string, number>(dates.map((d) => [d, 0]))
  for (const l of logs ?? []) {
    const d = String(l.log_date)
    if (byDate.has(d)) byDate.set(d, byDate.get(d)! + Number(l.total_kcal))
  }
  const days = dates.map((date) => ({ date, consumed: Math.round(byDate.get(date)!) }))

  return NextResponse.json({
    today,
    todayClosed,
    target,
    days,
    adjustment: weekAdjustment({
      days, target: target?.target_kcal, tdee: target?.tdee_kcal, sex: target?.sex,
      today, closedDates: closedToday,
    }),
  })
}
