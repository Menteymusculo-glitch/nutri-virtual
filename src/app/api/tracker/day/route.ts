import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { loadClosedDates, loadTarget, requireTrackerUser, resolveToday, serverError } from '@/lib/trackerApi'
import { dayReport, isDayClosed, isValidDate } from '@/lib/calorieReport'
import { sumNutrients } from '@/lib/mealMath'

// Comidas del día + reporte diario.
// ?date=AAAA-MM-DD (día a mostrar) y ?today=AAAA-MM-DD (fecha local de la usuaria).
// Un día está cerrado si es anterior a hoy o si la usuaria lo cerró.
export async function GET(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const today = resolveToday(req.nextUrl.searchParams.get('today'))
  const date = req.nextUrl.searchParams.get('date') ?? today
  if (!isValidDate(date)) return NextResponse.json({ error: 'Fecha inválida (formato AAAA-MM-DD).' }, { status: 400 })

  const [
    { data: target, error: targetError },
    { data: meals, error: mealsError },
    { data: closedDates, error: closedError },
  ] = await Promise.all([
    loadTarget(auth.user.id),
    supabaseAdmin
      .from('meal_logs')
      .select('id, logged_at, log_date, meal_type, source, total_kcal, meal_items(id, food_id, name, grams, kcal, protein, carbs, fat, confidence)')
      .eq('user_id', auth.user.id)
      .eq('log_date', date)
      .order('logged_at', { ascending: true }),
    // Solo hace falta mirar la tabla si el día no es anterior a hoy.
    date < today ? Promise.resolve({ data: [] as string[], error: null }) : loadClosedDates(auth.user.id, [date]),
  ])
  if (targetError) return serverError('tracker/day target', targetError)
  if (mealsError) return serverError('tracker/day meals', mealsError)
  if (closedError) return serverError('tracker/day closures', closedError)

  const list = (meals ?? []).map((m) => ({ ...m, total_kcal: Number(m.total_kcal) }))
  const items = list.flatMap((m) =>
    (m.meal_items ?? []).map((i) => ({
      kcal: Number(i.kcal),
      protein: i.protein == null ? null : Number(i.protein),
      carbs: i.carbs == null ? null : Number(i.carbs),
      fat: i.fat == null ? null : Number(i.fat),
    })),
  )
  const totals = sumNutrients(items)
  const closed = isDayClosed(date, today, closedDates)

  return NextResponse.json({
    date,
    today,
    closed,
    target,
    meals: list,
    totals,
    report: dayReport({ consumed: totals.kcal, target: target?.target_kcal, tdee: target?.tdee_kcal, closed, goal: target?.goal }),
  })
}
