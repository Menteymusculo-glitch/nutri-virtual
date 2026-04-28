import { MealPlan, FoodItem, Meal, AlternativeMeal } from '@/types'

// Per 100g values — sourced from official nutrition table
const FOOD_DB: Record<string, { cal: number; p: number; c: number; f: number }> = {
  huevo:          { cal: 143, p: 12.6, c: 0.7,  f: 9.5  },
  clara_huevo:    { cal: 52,  p: 10.9, c: 0.7,  f: 0.2  },
  pechuga_pollo:  { cal: 175, p: 26.4, c: 0.1,  f: 7.7  },
  pollo:          { cal: 167, p: 20.0, c: 0.0,  f: 9.7  },
  pavo:           { cal: 107, p: 21.9, c: 0.0,  f: 2.2  },
  salmon:         { cal: 160, p: 25.8, c: 0.0,  f: 5.5  },
  atun_fresco:    { cal: 109, p: 24.4, c: 0.0,  f: 0.5  },
  atun_enlatado:  { cal: 198, p: 29.1, c: 0.0,  f: 8.2  },
  tilapia:        { cal: 81,  p: 15.8, c: 0.0,  f: 1.9  },
  camaron:        { cal: 91,  p: 17.4, c: 1.2,  f: 1.3  },
  sardinas:       { cal: 208, p: 24.6, c: 0.0,  f: 11.5 },
  carne_res:      { cal: 123, p: 20.0, c: 0.0,  f: 5.0  },
  tofu:           { cal: 76,  p: 8.0,  c: 1.9,  f: 4.5  },
  tempeh:         { cal: 193, p: 19.0, c: 9.0,  f: 11.0 },
  queso_cabra:    { cal: 250, p: 17.0, c: 2.0,  f: 18.0 },
  yogur_griego:   { cal: 97,  p: 9.0,  c: 4.0,  f: 5.0  },
  aguacate:       { cal: 160, p: 2.0,  c: 8.5,  f: 14.7 },
  brocoli:        { cal: 34,  p: 2.8,  c: 6.6,  f: 0.4  },
  espinaca:       { cal: 23,  p: 2.9,  c: 3.6,  f: 0.4  },
  champinon:      { cal: 22,  p: 3.1,  c: 3.3,  f: 0.3  },
  esparragos:     { cal: 20,  p: 2.2,  c: 3.9,  f: 0.1  },
  pepino:         { cal: 12,  p: 0.6,  c: 2.2,  f: 0.2  },
  lechuga:        { cal: 14,  p: 0.9,  c: 3.0,  f: 0.1  },
  zucchini:       { cal: 14,  p: 0.6,  c: 2.2,  f: 0.2  },
  pimiento:       { cal: 24,  p: 0.9,  c: 5.1,  f: 0.2  },
  tomate:         { cal: 18,  p: 0.9,  c: 3.9,  f: 0.2  },
  kale:           { cal: 28,  p: 1.9,  c: 5.6,  f: 0.4  },
  zanahoria:      { cal: 41,  p: 0.9,  c: 9.6,  f: 0.2  },
  apio:           { cal: 16,  p: 0.7,  c: 3.0,  f: 0.2  },
  camote:         { cal: 101, p: 1.2,  c: 23.0, f: 0.3  },
  arroz_integral: { cal: 120, p: 2.9,  c: 24.9, f: 0.9  },
  quinoa:         { cal: 120, p: 4.4,  c: 21.3, f: 1.9  },
  avena:          { cal: 379, p: 13.2, c: 67.7, f: 6.5  },
  lenteja:        { cal: 115, p: 9.0,  c: 20.0, f: 0.4  },
  garbanzo:       { cal: 163, p: 8.8,  c: 27.3, f: 2.6  },
  almendra:       { cal: 607, p: 20.3, c: 20.4, f: 54.0 },
  nuez:           { cal: 654, p: 15.2, c: 13.7, f: 65.2 },
  chia:           { cal: 534, p: 18.3, c: 28.9, f: 42.2 },
  linaza:         { cal: 534, p: 18.3, c: 28.9, f: 42.2 },
  aceite_oliva:   { cal: 884, p: 0.0,  c: 0.0,  f: 100.0 },
  platano:        { cal: 89,  p: 1.1,  c: 22.8, f: 0.3  },
  arandano:       { cal: 57,  p: 0.7,  c: 14.5, f: 0.3  },
  proteina_polvo: { cal: 380, p: 78.0, c: 6.0,  f: 5.0  },
  leche_almendra: { cal: 13,  p: 0.4,  c: 0.4,  f: 1.1  },
  leche_avena:    { cal: 45,  p: 0.8,  c: 7.5,  f: 1.0  },
  leche_coco_beb: { cal: 17,  p: 0.2,  c: 0.8,  f: 1.3  },
}

function norm(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
}

function matchFood(foodName: string): string | null {
  const n = norm(foodName)
  if (n.includes('clara') && n.includes('huevo')) return 'clara_huevo'
  if (n.includes('huevo')) return 'huevo'
  if ((n.includes('pechuga') || n.includes('filete de pollo')) && n.includes('pollo')) return 'pechuga_pollo'
  if (n.includes('pavo')) return 'pavo'
  if (n.includes('pollo')) return 'pollo'
  if (n.includes('salmon')) return 'salmon'
  if (n.includes('atun') || n.includes('tuna')) {
    return (n.includes('lata') || n.includes('enlatado') || n.includes('conserva')) ? 'atun_enlatado' : 'atun_fresco'
  }
  if (n.includes('tilapia')) return 'tilapia'
  if (n.includes('camaron') || n.includes('gamba')) return 'camaron'
  if (n.includes('sardina')) return 'sardinas'
  if (n.includes('carne') || n.includes('res') || n.includes('ternera') || n.includes('vaca')) return 'carne_res'
  if (n.includes('tofu')) return 'tofu'
  if (n.includes('tempeh')) return 'tempeh'
  if (n.includes('queso') && (n.includes('cabra') || n.includes('feta') || n.includes('cottage'))) return 'queso_cabra'
  if (n.includes('yogur') && n.includes('griego')) return 'yogur_griego'
  if (n.includes('aguacate') || n.includes('palta')) return 'aguacate'
  if (n.includes('brocoli')) return 'brocoli'
  if (n.includes('espinaca')) return 'espinaca'
  if (n.includes('champinon') || n.includes('hongo') || n.includes('portobello')) return 'champinon'
  if (n.includes('esparrag')) return 'esparragos'
  if (n.includes('pepino')) return 'pepino'
  if (n.includes('lechuga') || n.includes('rucula') || n.includes('acelga')) return 'lechuga'
  if (n.includes('zucchini') || n.includes('calabacin') || n.includes('zuchin')) return 'zucchini'
  if (n.includes('pimiento') || n.includes('capsicum')) return 'pimiento'
  if (n.includes('tomate')) return 'tomate'
  if (n.includes('kale') || n.includes('col rizada')) return 'kale'
  if (n.includes('zanahoria')) return 'zanahoria'
  if (n.includes('apio')) return 'apio'
  if (n.includes('camote') || n.includes('batata') || n.includes('boniato')) return 'camote'
  if (n.includes('arroz') && (n.includes('integral') || n.includes('brown'))) return 'arroz_integral'
  if (n.includes('quinoa') || n.includes('quinua')) return 'quinoa'
  if (n.includes('avena') || n.includes('oat')) return 'avena'
  if (n.includes('lenteja')) return 'lenteja'
  if (n.includes('garbanzo') || n.includes('chickpea')) return 'garbanzo'
  if (n.includes('leche') && n.includes('almendra')) return 'leche_almendra'
  if (n.includes('leche') && n.includes('avena')) return 'leche_avena'
  if (n.includes('leche') && (n.includes('coco') || n.includes('coconut'))) return 'leche_coco_beb'
  if (n.includes('leche') && (n.includes('vegetal') || n.includes('arroz') || n.includes('soja') || n.includes('plant'))) return 'leche_almendra'
  if (n.includes('almendra')) return 'almendra'
  if (n.includes('nuez') || n.includes('nueces') || n.includes('walnut')) return 'nuez'
  if (n.includes('chia')) return 'chia'
  if (n.includes('linaza') || n.includes('lino')) return 'linaza'
  if (n.includes('aceite') && n.includes('oliva')) return 'aceite_oliva'
  if (n.includes('platano') || n.includes('banana') || n.includes('guineo')) return 'platano'
  if (n.includes('arandano') || n.includes('blueberry') || n.includes('frutos rojos') || n.includes('berr')) return 'arandano'
  if (n.includes('proteina') || n.includes('whey') || n.includes('scoop') || n.includes('suero') || n.includes('guisante en polvo')) return 'proteina_polvo'
  return null
}

function parseGrams(amount: string, foodName: string): number | null {
  const n = norm(amount)

  const grMatch = amount.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grs|gramos)(?!\w)/i)
  if (grMatch) return parseFloat(grMatch[1].replace(',', '.'))

  const mlMatch = amount.match(/(\d+(?:[.,]\d+)?)\s*ml/i)
  if (mlMatch) return parseFloat(mlMatch[1])

  const huevoMatch = amount.match(/(\d+)\s*huevo/i)
  if (huevoMatch) return parseInt(huevoMatch[1]) * 55

  if (norm(foodName).includes('aguacate') || n.includes('aguacate')) {
    if (amount.includes('1/2') || amount.includes('½')) return 75
    if (/^1\s/.test(amount.trim())) return 150
  }

  const scoopMatch = amount.match(/(\d*)\s*scoop/i)
  if (scoopMatch) return (parseInt(scoopMatch[1]) || 1) * 30

  const cdtaMatch = amount.match(/(\d+(?:[.,]\d+)?)\s*cdta/i)
  if (cdtaMatch) return parseFloat(cdtaMatch[1]) * 5

  const cdasMatch = amount.match(/(\d+(?:[.,]\d+)?)\s*cdas?/i)
  if (cdasMatch) return parseFloat(cdasMatch[1]) * 15

  if (n.includes('taza')) {
    if (amount.includes('1/2') || amount.includes('½')) return 120
    const tazaMatch = amount.match(/(\d+)\s*taza/i)
    return tazaMatch ? parseInt(tazaMatch[1]) * 240 : 240
  }

  if (n.includes('puno') || n.includes('punado')) return 30

  return null
}

function calcFood(food: FoodItem): boolean {
  const key = matchFood(food.name)
  const grams = parseGrams(food.amount, food.name)
  if (!key || grams === null) return false

  const db = FOOD_DB[key]
  const f = grams / 100
  food.calories = Math.round(db.cal * f)
  food.protein  = Math.round(db.p * f * 10) / 10
  food.carbs    = Math.round(db.c * f * 10) / 10
  food.fat      = Math.round(db.f * f * 10) / 10
  return true
}

function recalcMealTotals(meal: Meal | AlternativeMeal) {
  const matched = meal.foods.map(calcFood)
  if (matched.some(Boolean)) {
    meal.calories = Math.round(meal.foods.reduce((s, f) => s + f.calories, 0))
    meal.protein  = Math.round(meal.foods.reduce((s, f) => s + f.protein, 0) * 10) / 10
    meal.carbs    = Math.round(meal.foods.reduce((s, f) => s + f.carbs, 0) * 10) / 10
    meal.fat      = Math.round(meal.foods.reduce((s, f) => s + f.fat, 0) * 10) / 10
  }
}

export function recalculateMacros(plan: MealPlan): MealPlan {
  for (const day of plan.days) {
    for (const meal of day.meals) recalcMealTotals(meal)
    if (day.alternativeLunch) recalcMealTotals(day.alternativeLunch)
    day.totalCalories = Math.round(day.meals.reduce((s, m) => s + m.calories, 0))
    day.totalProtein  = Math.round(day.meals.reduce((s, m) => s + m.protein, 0) * 10) / 10
    day.totalCarbs    = Math.round(day.meals.reduce((s, m) => s + m.carbs, 0) * 10) / 10
    day.totalFat      = Math.round(day.meals.reduce((s, m) => s + m.fat, 0) * 10) / 10
  }
  return plan
}
