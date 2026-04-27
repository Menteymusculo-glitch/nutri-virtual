import { MealPlan, ShoppingCategory } from '@/types'

const CATEGORY_MAP: Record<string, string> = {
  // Proteínas animales
  pollo: 'Proteínas', pechuga: 'Proteínas', pavo: 'Proteínas',
  salmón: 'Proteínas', salmon: 'Proteínas', atún: 'Proteínas', tuna: 'Proteínas',
  sardinas: 'Proteínas', tilapia: 'Proteínas', camarón: 'Proteínas',
  huevo: 'Proteínas', huevos: 'Proteínas',
  res: 'Proteínas', carne: 'Proteínas',
  // Proteínas vegetales
  tofu: 'Proteínas', tempeh: 'Proteínas', edamame: 'Proteínas',
  proteína: 'Proteínas', whey: 'Proteínas', batido: 'Proteínas',
  lentejas: 'Legumbres y granos', garbanzos: 'Legumbres y granos',
  frijoles: 'Legumbres y granos', quinoa: 'Legumbres y granos',
  arroz: 'Legumbres y granos', avena: 'Legumbres y granos',
  // Lácteos
  'queso de cabra': 'Lácteos', 'yogur griego': 'Lácteos',
  queso: 'Lácteos', yogur: 'Lácteos', cottage: 'Lácteos',
  // Vegetales
  espinaca: 'Vegetales', kale: 'Vegetales', brócoli: 'Vegetales',
  coliflor: 'Vegetales', zucchini: 'Vegetales', pepino: 'Vegetales',
  apio: 'Vegetales', pimiento: 'Vegetales', champiñón: 'Vegetales',
  champiñones: 'Vegetales', espárragos: 'Vegetales', lechuga: 'Vegetales',
  rúcula: 'Vegetales', cebolla: 'Vegetales', ajo: 'Vegetales',
  jitomate: 'Vegetales', tomate: 'Vegetales', camote: 'Vegetales',
  batata: 'Vegetales', zanahoria: 'Vegetales', calabacín: 'Vegetales',
  // Frutas
  plátano: 'Frutas', banana: 'Frutas', manzana: 'Frutas',
  arándanos: 'Frutas', frutos: 'Frutas', fresas: 'Frutas',
  frambuesas: 'Frutas', limón: 'Frutas', pera: 'Frutas', kiwi: 'Frutas',
  mango: 'Frutas',
  // Grasas
  aguacate: 'Grasas saludables', palta: 'Grasas saludables',
  nueces: 'Grasas saludables', almendras: 'Grasas saludables',
  pistachos: 'Grasas saludables', chía: 'Grasas saludables',
  linaza: 'Grasas saludables', 'aceite de oliva': 'Grasas saludables',
  'aceite de coco': 'Grasas saludables', mantequilla: 'Grasas saludables',
  // Otros
  cúrcuma: 'Especias y condimentos', jengibre: 'Especias y condimentos',
  canela: 'Especias y condimentos', romero: 'Especias y condimentos',
  pimienta: 'Especias y condimentos', orégano: 'Especias y condimentos',
  vinagre: 'Especias y condimentos', aceite: 'Especias y condimentos',
  'leche de almendra': 'Bebidas', 'leche vegetal': 'Bebidas',
  'té verde': 'Bebidas', agua: 'Bebidas',
  creatina: 'Suplementos',
}

function categorize(foodName: string): string {
  const lower = foodName.toLowerCase()
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return cat
  }
  return 'Otros'
}

function parseGrams(amount: string): number {
  const match = amount.match(/(\d+(?:\.\d+)?)\s*(g|gr|kg|ml|l|unid|unidades?|scoop|cdas?|cdtas?|taza|porciones?)?/i)
  if (!match) return 0
  let value = parseFloat(match[1])
  const unit = (match[2] || 'g').toLowerCase()
  if (unit === 'kg' || unit === 'l') value *= 1000
  return value
}

function formatAmount(grams: number, unit: string): string {
  if (unit === 'unidades' || unit === 'unid') {
    return `${Math.ceil(grams)} unidades`
  }
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`
  return `${Math.ceil(grams)} g`
}

function detectUnit(amount: string): string {
  const lower = amount.toLowerCase()
  if (lower.includes('unid') || lower.includes('pieza') || lower.includes('scoop')) return 'unidades'
  if (lower.includes('ml') || lower.includes('litro') || lower.includes('taza')) return 'ml'
  return 'g'
}

export function calculateShoppingList(plan: MealPlan): ShoppingCategory[] {
  // Aggregate all food items across all days
  const totals: Record<string, { grams: number; unit: string; category: string }> = {}

  for (const day of plan.days) {
    for (const meal of day.meals) {
      // Skip batido post-entreno from shopping list grouping — it has fixed ingredients
      for (const food of meal.foods) {
        const key = food.name.toLowerCase().trim()
        const grams = parseGrams(food.amount)
        const unit = detectUnit(food.amount)
        const category = categorize(food.name)

        if (!totals[key]) {
          totals[key] = { grams: 0, unit, category }
        }
        totals[key].grams += grams
      }
    }
  }

  // Group by category
  const grouped: Record<string, string[]> = {}
  for (const [name, data] of Object.entries(totals)) {
    if (data.grams === 0) continue
    const cat = data.category
    if (!grouped[cat]) grouped[cat] = []
    // Capitalize first letter
    const displayName = name.charAt(0).toUpperCase() + name.slice(1)
    grouped[cat].push(`${displayName}: ${formatAmount(data.grams, data.unit)}`)
  }

  // Sort categories in logical order
  const order = ['Proteínas', 'Lácteos', 'Legumbres y granos', 'Vegetales', 'Frutas', 'Grasas saludables', 'Especias y condimentos', 'Bebidas', 'Suplementos', 'Otros']
  const result: ShoppingCategory[] = []

  for (const cat of order) {
    if (grouped[cat] && grouped[cat].length > 0) {
      result.push({ category: cat, items: grouped[cat].sort() })
    }
  }

  // Add any remaining categories not in order
  for (const [cat, items] of Object.entries(grouped)) {
    if (!order.includes(cat)) {
      result.push({ category: cat, items })
    }
  }

  return result
}
