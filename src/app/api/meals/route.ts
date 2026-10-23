import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { requireTrackerUser, requireTrackerUserWith, serverError } from '@/lib/trackerApi'
import { parseMealInput } from '@/lib/trackerValidation'
import { kcalFor, sumNutrients } from '@/lib/mealMath'

// Crea una comida. Las kcal se calculan SIEMPRE aquí desde la tabla foods:
// nunca se aceptan kcal enviadas por el cliente.
export async function POST(req: NextRequest) {
  // El cuerpo se lee antes de autenticar, pero ante un JSON inválido o datos que no
  // validan se responde primero 401/403 si no hay sesión o plan.
  let body: unknown
  let badJson = false
  try {
    body = await req.json()
  } catch {
    badJson = true
  }
  const parsed = badJson ? null : parseMealInput(body)
  if (!parsed || !parsed.ok) {
    const auth = await requireTrackerUser()
    if (!auth.ok) return auth.response
    return NextResponse.json({ error: parsed ? parsed.error : 'JSON inválido.' }, { status: 400 })
  }
  const meal = parsed.value
  const foodIds = [...new Set(meal.items.map((i) => i.food_id))]

  // Leer los alimentos (solo lectura) en paralelo con la comprobación del plan;
  // las inserciones van después, cuando el acceso ya está confirmado.
  const auth = await requireTrackerUserWith(async () =>
    await supabaseAdmin
      .from('foods')
      .select('id, name, kcal_100g, protein_100g, carbs_100g, fat_100g')
      .in('id', foodIds),
  )
  if (!auth.ok) return auth.response
  const { data: foods, error: foodsError } = auth.data
  if (foodsError) return serverError('meals/post foods', foodsError)

  const byId = new Map((foods ?? []).map((f) => [f.id as string, f]))
  if (byId.size !== foodIds.length) {
    return NextResponse.json({ error: 'Algún alimento ya no existe. Vuelve a buscarlo.' }, { status: 400 })
  }

  const items = meal.items.map((i) => {
    const food = byId.get(i.food_id)!
    const n = kcalFor(food, i.grams)
    return {
      food_id: i.food_id, name: food.name as string, grams: i.grams,
      kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat,
      confidence: i.confidence,
    }
  })
  const totals = sumNutrients(items)

  const { data: log, error: logError } = await supabaseAdmin
    .from('meal_logs')
    .insert({
      user_id: auth.user.id,
      log_date: meal.log_date,
      meal_type: meal.meal_type,
      source: meal.source,
      total_kcal: totals.kcal,
    })
    .select('id')
    .single()
  if (logError || !log) return serverError('meals/post log', logError)

  const { error: itemsError } = await supabaseAdmin
    .from('meal_items')
    .insert(items.map((i) => ({ ...i, meal_id: log.id })))
  if (itemsError) {
    // Sin transacciones en supabase-js: deshacemos la cabecera para no dejar comidas vacías.
    const { error: rollbackError } = await supabaseAdmin.from('meal_logs').delete().eq('id', log.id)
    if (rollbackError) console.error('[meals/post rollback]', rollbackError.message)
    return serverError('meals/post items', itemsError)
  }

  return NextResponse.json({ ok: true, meal: { id: log.id, total_kcal: totals.kcal, items } }, { status: 201 })
}
