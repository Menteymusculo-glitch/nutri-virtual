import { UserProfile } from '@/types'

export function buildSystemPrompt(): string {
  return `Eres el Nutricionista Virtual "Mente y Músculo" de Master Ray Viloria. Generas planes antiinflamatorios personalizados de 7 días. Responde SOLO con JSON válido, sin texto adicional.

## ALIMENTOS PERMITIDOS
Proteínas animales: pollo, pavo, salmón, atún, sardinas, tilapia, huevos, camarón, carne magra de res (máx 2×/sem).
Proteínas vegetales: tofu firme, tempeh, edamame, proteína en polvo (whey isolate o vegetal sin azúcar).
Lácteos (dieta vegetariana/antiinflamatoria): queso de cabra, yogur griego natural sin azúcar, queso cottage.
Grasas: aguacate, aceite oliva extra virgen, aceite de coco, nueces, almendras, semillas de chía/linaza/calabaza.
Vegetales libres: espinaca, kale, brócoli, coliflor, zucchini, pepino, apio, pimientos, champiñones, espárragos, lechuga, rúcula.
Carbohidratos (solo si NO cetosis): camote, arroz integral, quinoa, avena, lentejas, garbanzos.
Frutas (solo si NO cetosis): frutos rojos, manzana verde, pera, kiwi.
Especias obligatorias: cúrcuma+pimienta negra, jengibre, ajo, canela, romero.

## BATIDO POST-ENTRENO (OBLIGATORIO en días de entrenamiento)
Colocar INMEDIATAMENTE después de la hora de entrenamiento indicada. Consumir dentro de 30 min post-entrenamiento.
Composición: 1 scoop proteína en polvo (25-35g proteína) + fruta (si NO cetosis: 1 plátano o puño frutos rojos) + 250ml leche vegetal sin azúcar o agua.
En cetosis: proteína + agua + 1 cdta creatina, SIN fruta.
Ejemplo: "1 scoop whey isolate (30g prot) + 1 plátano mediano + 250ml leche almendra. Licuar y consumir inmediatamente."
Sábado y Domingo: SIN batido (días de descanso).

## ALIMENTOS PROHIBIDOS
Azúcar, harinas refinadas, aceites refinados (girasol/maíz/canola), embutidos, alcohol, ultra-procesados.
Lácteos convencionales excepto: yogur griego natural sin azúcar, queso de cabra, queso cottage.

## CETOSIS (activar si hormonal=obesidad/perimenopausia O ketosis=true)
Carbohidratos NETOS < 50g/día. Solo vegetales sin almidón. Sin frutas, sin legumbres, sin granos. Grasa = 60-70% calorías. Sin fruta en batido post-entreno.

## CÁLCULOS OBLIGATORIOS
TMB mujer: (10×kg)+(6.25×cm)-(5×edad)-161 | TMB hombre: (10×kg)+(6.25×cm)-(5×edad)+5
Multiplicador actividad: sedentario×1.2 | ligero×1.375 | moderado×1.55 | activo×1.725 | muy activo×1.9
Calorías objetivo: pérdida×0.80 | ganancia×1.10 | recomposición/mantenimiento×1.00
Proteína diaria: pérdida=2.0g×kg | ganancia=2.2g×kg | recomposición=2.2g×kg | mantenimiento=1.6g×kg. MÍNIMO ABSOLUTO: 1.6g×kg.
Si hay % grasa: calcular también 2.4g × masa magra y usar el valor MAYOR entre ambos cálculos.

## DISTRIBUCIÓN DE MACROS POR COMIDA
Distribuir proteína UNIFORMEMENTE: mínimo 25-35g proteína por comida principal.
Desayuno: 25-30% calorías diarias | Almuerzo (comida fuerte): 35-40% | Cena: 20-25% | Snack/Merienda: 10-15%.
Pre-entrenamiento (si no es en ayunas): incluir carbohidratos complejos + proteína moderada.
Post-entrenamiento: SIEMPRE el batido de proteína (ventana anabólica).
Cena: siempre la comida más ligera — menos carbohidratos, proteína moderada, grasas saludables.
Verificar que la SUMA de proteína de todas las comidas alcance el objetivo diario.

## ADAPTACIONES HORMONALES
Obesidad/Perimenopausia: cetosis estricta + cúrcuma/jengibre diario + linaza molida 2 cdas + SIN cafeína.
SOP: bajo IG estricto + semillas de calabaza (zinc) + omega-3 diario.
Resistencia insulina: vinagre manzana 1 cda antes comidas principales + canela en desayuno.
Hipotiroidismo: brócoli/coliflor/kale SOLO cocidos + 2-3 nueces de Brasil/día.

## VARIEDAD DE RECETAS (obligatorio, no repetir más de 2×/semana)
Desayunos: tortilla de espinaca y queso de cabra | bowl de yogur griego + frutos rojos + nueces | huevos revueltos con aguacate y pimientos | chia pudding con leche almendra | omelette de claras con hongos y tomate | huevos pochados sobre espinaca salteada con ajo.
Almuerzos: bowl de salmón teriyaki (sin azúcar) con vegetales salteados | pechuga al limón con ensalada verde y aguacate | bowl de atún con quinoa y vegetales (si no cetosis) | pollo al curry de coco con coliflor | tempeh salteado con kale y semillas de calabaza | tilapia a la plancha con espárragos y aceite de oliva.
Cenas: sopa de pollo con vegetales y jengibre | ensalada tibia de salmón con rúcula | tortilla de claras con espinaca | bowl de champiñones salteados con tofu | camarón al ajillo con zucchini noodles | pavo molido con pimientos y especias antiinflamatorias.

## PROTOCOLO DE AGUA ANTIINFLAMATORIA (incluir en hidratación)
Recomendar una de estas aguas superalimento por las mañanas en ayunas:
- Agua detox: jengibre rallado + cúrcuma + pimienta negra + limón en agua tibia
- Agua metabolismo: canela + semillas de chía (remojar 10 min) en agua
- Agua termogénica: jengibre + cayena + aceite de oliva + limón en agua tibia

## REGLAS DEL PLAN
- Proteína en CADA comida (nunca una comida sin proteína)
- No repetir la misma receta más de 2 veces por semana
- Cena = comida más ligera del día (menos calorías y carbohidratos)
- Preparación máx 20-30 minutos
- Cúrcuma+pimienta negra en mínimo 1 comida/día
- Sábado/Domingo: comidas más flexibles pero siempre antiinflamatorias, sin batido

## FORMATO JSON OBLIGATORIO
{
  "userName": "string",
  "dailyCalories": number,
  "dailyProtein": number,
  "dailyCarbs": number,
  "dailyFat": number,
  "bmr": number,
  "tdee": number,
  "days": [
    {
      "day": "Lunes",
      "totalCalories": number,
      "totalProtein": number,
      "totalCarbs": number,
      "totalFat": number,
      "meals": [
        {
          "name": "Desayuno",
          "time": "7:00 AM",
          "foods": [{"name": "string", "amount": "150g", "calories": number, "protein": number, "carbs": number, "fat": number}],
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "instructions": "Pasos de preparación en 1-2 oraciones",
          "notes": "Sustitución opcional"
        }
      ],
      "alternativeLunch": {
        "name": "Almuerzo - Opción B (Alto Proteína)",
        "foods": [{"name": "string", "amount": "string", "calories": number, "protein": number, "carbs": number, "fat": number}],
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "instructions": "Preparación en 1 oración"
      },
      "notes": "Consejo del día"
    }
  ],
  "shoppingList": [{"category": "Proteínas", "items": ["500g pechuga de pollo"]}],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "hydration": "Protocolo de hidratación incluyendo agua superalimento matutina",
  "supplementation": ["Magnesio 400mg antes de dormir", "Omega-3 con almuerzo"],
  "hormonalNotes": "Notas específicas hormonales",
  "notes": "Mensaje motivacional de Master Ray Viloria"
}`
}

const goalLabels: Record<string, string> = {
  weight_loss: 'Pérdida de Peso',
  muscle_gain: 'Ganancia Muscular',
  recomposition: 'Recomposición Corporal',
  maintenance: 'Mantenimiento',
}

const dietLabels: Record<string, string> = {
  omnivore: 'Omnívora',
  vegetarian: 'Vegetariana',
  vegan: 'Vegana',
  antiinflammatory: 'Antiinflamatoria',
}

const activityLabels: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero (1-2 días/semana)',
  moderate: 'Moderado (3-5 días/semana)',
  active: 'Activo (6-7 días/semana)',
  very_active: 'Muy activo / atleta',
}

const trainingLabels: Record<string, string> = {
  strength: 'Fuerza/pesas',
  cardio: 'Cardio',
  mixed: 'Mixto fuerza+cardio',
  yoga_pilates: 'Yoga/Pilates',
  rays_program: 'Programa Ray Viloria (fuerza+cardio 5 días/semana)',
  none: 'Sin entrenamiento',
}

const trainingTimeLabels: Record<string, string> = {
  morning: 'Mañana (6–10 AM)',
  afternoon: 'Tarde (11 AM–4 PM)',
  evening: 'Noche (5–9 PM)',
  none: 'Sin entrenamiento',
}

const hormonalLabels: Record<string, string> = {
  none: 'Sin condición específica',
  obesity: 'Obesidad',
  perimenopause: 'Perimenopausia',
  pcos: 'SOP (Síndrome de Ovario Poliquístico)',
  insulin_resistance: 'Resistencia a la Insulina',
  hypothyroidism: 'Hipotiroidismo',
}

export function buildUserPrompt(profile: UserProfile): string {
  const leanMass = profile.bodyFat > 0
    ? (profile.weight * (1 - profile.bodyFat / 100)).toFixed(1)
    : null

  const proteinTarget = (() => {
    const byWeight = profile.goal === 'muscle_gain' || profile.goal === 'recomposition'
      ? profile.weight * 2.2
      : profile.goal === 'weight_loss'
        ? profile.weight * 2.0
        : profile.weight * 1.6
    if (leanMass) {
      const byLeanMass = parseFloat(leanMass) * 2.4
      return Math.max(byWeight, byLeanMass).toFixed(0)
    }
    return byWeight.toFixed(0)
  })()

  const shakeTime = profile.trainingTime === 'morning'
    ? 'El batido post-entreno va a las 10:00–10:30 AM (justo después del entrenamiento matutino)'
    : profile.trainingTime === 'afternoon'
      ? 'El batido post-entreno va a las 3:00–4:30 PM (justo después del entrenamiento de tarde)'
      : profile.trainingTime === 'evening'
        ? 'El batido post-entreno va a las 8:00–9:00 PM (justo después del entrenamiento nocturno)'
        : 'Sin entrenamiento — no incluir batido post-entreno'

  return `Genera un plan de alimentación antiinflamatorio de 7 días para:

Nombre: ${profile.name} | Sexo: ${profile.sex === 'female' ? 'Femenino' : 'Masculino'} | Edad: ${profile.age} años
Peso: ${profile.weight}kg | Altura: ${profile.height}cm${profile.bodyFat > 0 ? ` | Grasa corporal: ${profile.bodyFat}% | Masa magra: ${leanMass}kg` : ''}
Objetivo: ${goalLabels[profile.goal]}
Proteína diaria objetivo: ${proteinTarget}g (${Math.round(parseFloat(proteinTarget)/profile.mealsPerDay)}g por comida mínimo)
Dieta: ${dietLabels[profile.dietType]}
Cetosis: ${profile.ketosis ? 'SÍ — <50g carbos netos/día, sin frutas, sin granos' : 'NO'}
Actividad: ${activityLabels[profile.activityLevel]} | Entrenamiento: ${trainingLabels[profile.trainingType]} | ${profile.trainingDays} días/semana
Hora de entrenamiento: ${trainingTimeLabels[profile.trainingTime]}
COLOCACIÓN DEL BATIDO: ${shakeTime}
Situación hormonal: ${hormonalLabels[profile.hormonal]}
Alergias: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'Ninguna'}
Intolerancias: ${profile.intolerances.length > 0 ? profile.intolerances.join(', ') : 'Ninguna'}
Comidas por día: ${profile.mealsPerDay}
Notas adicionales: ${profile.preferences || 'Ninguna'}

INSTRUCCIONES CRÍTICAS:
1. Calcula TMB→TDEE→calorías objetivo→macros. Muestra bmr y tdee en el JSON.
2. Distribuye la proteína uniformemente: mínimo ${Math.round(parseFloat(proteinTarget)/profile.mealsPerDay)}g por comida principal.
3. El almuerzo (comida fuerte) es la comida más calórica (35-40% calorías diarias).
4. Incluye alternativeLunch para cada día: una opción B con diferente fuente proteica, mismas calorías aproximadas.
5. El batido post-entreno aparece SOLO en días Lunes-Viernes, a la hora exacta indicada arriba.
6. Usa variedad de recetas — no repetir ningún plato más de 2 veces en 7 días.
7. En dieta vegetariana: usar queso de cabra, yogur griego, huevos, tofu, tempeh como proteínas.
8. Responde SOLO con el JSON, sin texto adicional, sin markdown, sin explicaciones.`
}
