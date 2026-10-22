import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { requireTrackerUser, serverError } from '@/lib/trackerApi'
import { normalizeFoodName } from '@/lib/mealMath'
import { rankFoods } from '@/lib/trackerValidation'

const MAX_RESULTS = 20

export async function GET(req: NextRequest) {
  const auth = await requireTrackerUser()
  if (!auth.ok) return auth.response

  const q = normalizeFoodName(req.nextUrl.searchParams.get('q') ?? '').slice(0, 60)
  if (q.length < 2) return NextResponse.json({ foods: [] })

  // name_norm solo contiene [a-z0-9 ], así que no hace falta escapar % ni _.
  const { data, error } = await supabaseAdmin
    .from('foods')
    .select('id, name, name_norm, kcal_100g, protein_100g, carbs_100g, fat_100g')
    .ilike('name_norm', `%${q}%`)
    .limit(60)
  if (error) return serverError('foods/search', error)

  const foods = rankFoods(data ?? [], q, MAX_RESULTS).map((f) => ({
    id: f.id, name: f.name, kcal_100g: f.kcal_100g,
    protein_100g: f.protein_100g, carbs_100g: f.carbs_100g, fat_100g: f.fat_100g,
  }))
  return NextResponse.json({ foods })
}
