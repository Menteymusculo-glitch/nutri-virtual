import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { loadTarget, requireTrackerUser, serverError, todayUtc } from '@/lib/trackerApi'
import { dayReport, isValidDate } from '@/lib/calorieReport'
import { sumNutrients } from '@/lib/mealMath'

// Comidas del día (fecha local de la usuaria) + reporte diario.
export async function GET(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const date = req.nextUrl.searchParams.get('date') ?? todayUtc()
  if (!isValidDate(date)) return NextResponse.json({ error: 'Fecha inválida (formato AAAA-MM-DD).' }, { status: 400 })

  const [{ data: target, error: targetError }, { data: meals, error: mealsError }] = await Promise.all([
    loadTarget(auth.user.id),
    supabaseAdmin
      .from('meal_logs')
      .select('id, logged_at, log_date, meal_type, source, total_kcal, meal_items(id, food_id, name, grams, kcal, protein, carbs, fat, confidence)')
      .eq('user_id', auth.user.id)
      .eq('log_date', date)
      .order('logged_at', { ascending: true }),
  ])
  if (targetError) return serverError('tracker/day target', targetError)
  if (mealsError) return serverError('tracker/day meals', mealsError)

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

  return NextResponse.json({
    date,
    target,
    meals: list,
    totals,
    report: dayReport({ consumed: totals.kcal, target: target?.target_kcal, tdee: target?.tdee_kcal }),
  })
}
