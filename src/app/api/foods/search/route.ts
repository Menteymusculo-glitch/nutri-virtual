import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { requireTrackerUser, serverError } from '@/lib/trackerApi'
import { normalizeFoodName } from '@/lib/mealMath'
import { rankFoodMatches } from '@/lib/foodSearch'

const MAX_RESULTS = 20
const MAX_CANDIDATES = 80

interface FoodRow {
  id: string
  name: string
  name_norm: string
  aliases: string[] | null
  kcal_100g: number
  protein_100g: number | null
  carbs_100g: number | null
  fat_100g: number | null
  prep_state: string | null
  quality: string | null
  sim: number | null
}

// Busca por nombre y alias (sin acentos ni mayúsculas) y devuelve cada alimento
// con su estado (crudo/cocido…), la calidad del dato y sus porciones caseras.
export async function GET(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const q = normalizeFoodName(req.nextUrl.searchParams.get('q') ?? '').slice(0, 60)
  if (q.length < 2) return NextResponse.json({ foods: [] })

  const { data, error } = await supabaseAdmin.rpc('search_foods', { q, max_rows: MAX_CANDIDATES })
  if (error) return serverError('foods/search', error)

  const ranked = rankFoodMatches((data ?? []) as FoodRow[], q, MAX_RESULTS)

  const portionsByFood = new Map<string, { label: string; grams: number }[]>()
  if (ranked.length) {
    const { data: portions, error: portionsError } = await supabaseAdmin
      .from('food_portions')
      .select('food_id, label, grams')
      .in('food_id', ranked.map((f) => f.id))
      .order('grams', { ascending: true })
    if (portionsError) return serverError('foods/search portions', portionsError)
    for (const p of (portions ?? []) as { food_id: string; label: string; grams: number }[]) {
      const list = portionsByFood.get(p.food_id) ?? []
      list.push({ label: p.label, grams: Number(p.grams) })
      portionsByFood.set(p.food_id, list)
    }
  }

  const foods = ranked.map((f) => ({
    id: f.id, name: f.name, kcal_100g: f.kcal_100g,
    protein_100g: f.protein_100g, carbs_100g: f.carbs_100g, fat_100g: f.fat_100g,
    prep_state: f.prep_state, quality: f.quality ?? 'approx',
    portions: portionsByFood.get(f.id) ?? [],
  }))
  return NextResponse.json({ foods })
}
