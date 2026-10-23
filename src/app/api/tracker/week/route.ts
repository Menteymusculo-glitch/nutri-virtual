import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { loadClosedDates, loadTarget, requireTrackerUserWith, resolveToday, serverError } from '@/lib/trackerApi'
import { weekAdjustment, weekWindow } from '@/lib/calorieReport'

// Últimos 7 días COMPLETOS + ajuste semanal.
// ?today=AAAA-MM-DD (fecha local de la usuaria; `end` se acepta como alias antiguo).
// El día de hoy solo entra si la usuaria lo cerró; si no, la ventana termina ayer.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const today = resolveToday(params.get('today') ?? params.get('end'))

  // La ventana depende de si hoy está cerrado; para no esperar a saberlo se piden
  // las comidas de los 8 días posibles (hace 7 días hasta hoy) y luego se filtran.
  const from = weekWindow(today, false)[0]
  const auth = await requireTrackerUserWith((userId) => Promise.all([
    loadTarget(userId),
    loadClosedDates(userId, [today]),
    supabaseAdmin
      .from('meal_logs')
      .select('log_date, total_kcal')
      .eq('user_id', userId)
      .gte('log_date', from)
      .lte('log_date', today)
      .then((r) => r),
  ]))
  if (!auth.ok) return auth.response
  const [
    { data: target, error: targetError },
    { data: closedToday, error: closedError },
    { data: logs, error: logsError },
  ] = auth.data
  if (targetError) return serverError('tracker/week target', targetError)
  if (closedError) return serverError('tracker/week closures', closedError)
  if (logsError) return serverError('tracker/week logs', logsError)

  const todayClosed = closedToday.includes(today)
  const dates = weekWindow(today, todayClosed)

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
      today, closedDates: closedToday, goal: target?.goal,
    }),
  })
}
