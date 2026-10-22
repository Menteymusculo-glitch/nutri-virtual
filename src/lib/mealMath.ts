// Cálculo de kcal y macros de una comida a partir de valores por 100 g.

export interface FoodPer100 {
  kcal_100g: number
  protein_100g?: number | null
  carbs_100g?: number | null
  fat_100g?: number | null
}

export interface Nutrients {
  kcal: number
  protein: number | null
  carbs: number | null
  fat: number | null
}

const round1 = (n: number) => Math.round(n * 10) / 10

function scale(per100: number | null | undefined, grams: number): number | null {
  if (per100 == null || !isFinite(Number(per100))) return null
  return round1((Number(per100) * grams) / 100)
}

export function kcalFor(food: FoodPer100, grams: number): Nutrients {
  if (!isFinite(grams) || grams <= 0) return { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  return {
    kcal: Math.round((Number(food.kcal_100g) * grams) / 100),
    protein: scale(food.protein_100g, grams),
    carbs: scale(food.carbs_100g, grams),
    fat: scale(food.fat_100g, grams),
  }
}

// Suma kcal (entero) y macros (1 decimal). Un macro desconocido cuenta como 0.
export function sumNutrients(items: Nutrients[]): { kcal: number; protein: number; carbs: number; fat: number } {
  const t = items.reduce<{ kcal: number; protein: number; carbs: number; fat: number }>(
    (acc, i) => ({
      kcal: acc.kcal + (i.kcal || 0),
      protein: acc.protein + (i.protein ?? 0),
      carbs: acc.carbs + (i.carbs ?? 0),
      fat: acc.fat + (i.fat ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
  return { kcal: Math.round(t.kcal), protein: round1(t.protein), carbs: round1(t.carbs), fat: round1(t.fat) }
}

// Normaliza nombres para buscar en foods.name_norm: minúsculas, sin acentos,
// solo letras/números/espacios, espacios colapsados.
export function normalizeFoodName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
