import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { loadTarget, requireTrackerUser, serverError, todayUtc } from '@/lib/trackerApi'
import { isValidDate, lastNDates, weekAdjustment } from '@/lib/calorieReport'
import { WEEK_WINDOW_DAYS } from '@/lib/nutritionConstants'

// Últimos 7 días (terminando en ?end=AAAA-MM-DD, la fecha local de la usuaria) + ajuste semanal.
export async function GET(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const end = req.nextUrl.searchParams.get('end') ?? todayUtc()
  if (!isValidDate(end)) return NextResponse.json({ error: 'Fecha inválida (formato AAAA-MM-DD).' }, { status: 400 })
  const dates = lastNDates(end, WEEK_WINDOW_DAYS)

  const [{ data: target, error: targetError }, { data: logs, error: logsError }] = await Promise.all([
    loadTarget(auth.user.id),
    supabaseAdmin
      .from('meal_logs')
      .select('log_date, total_kcal')
      .eq('user_id', auth.user.id)
      .gte('log_date', dates[0])
      .lte('log_date', end),
  ])
  if (targetError) return serverError('tracker/week target', targetError)
  if (logsError) return serverError('tracker/week logs', logsError)

  const byDate = new Map<string, number>(dates.map((d) => [d, 0]))
  for (const l of logs ?? []) {
    const d = String(l.log_date)
    if (byDate.has(d)) byDate.set(d, byDate.get(d)! + Number(l.total_kcal))
  }
  const days = dates.map((date) => ({ date, consumed: Math.round(byDate.get(date)!) }))

  return NextResponse.json({
    end,
    target,
    days,
    adjustment: weekAdjustment({ days, target: target?.target_kcal, tdee: target?.tdee_kcal, sex: target?.sex }),
  })
}
