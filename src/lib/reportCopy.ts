// Todos los textos del tracker en un solo sitio, para que Ray los revise.
// Tono: directo, empoderador, elegante. Sin culpa ni castigo.
// Los tests (src/__tests__/report-copy.test.ts) fallan si aparece una palabra prohibida.
import type { DayReport, WeekAdjustment, EnergyBalance, CeilingAlert } from '@/lib/calorieReport'
import { KCAL_FLOOR } from '@/lib/nutritionConstants'

// Palabras y expresiones que NUNCA deben aparecer en la interfaz.
// Se comparan en minúsculas y sin acentos.
export const FORBIDDEN_TERMS = [
  'te pasaste', 'pasaste', 'fallaste', 'fallo', 'fracaso', 'fracasaste', 'trampa',
  'mal dia', 'culpa', 'castigo', 'castigar', 'compensar', 'compensa', 'compensacion',
  'excediste', 'exceso', 'pecado', 'portarse mal', 'te portaste', 'quiero que',
  'deberias', 'prohibido', 'arruinaste', 'malo', 'mala',
]

export const SUPPORT_URL = 'mailto:soporte@menteymusculo.com?subject=Necesito%20apoyo%20con%20mi%20alimentaci%C3%B3n'

export const fmtKcal = (n: number) => `${Math.round(n).toLocaleString('es-ES')} kcal`

export const COPY = {
  pageTitle: 'Tu registro diario',
  supportLink: '¿Necesitas apoyo? Habla con Ray',
  guideNote: 'Las cifras son una guía para ver tu tendencia, no una medida exacta.',
  addMeal: 'Añadir comida',
  closeDay: 'Cerrar mi día',
  closeDayHint: 'Ciérralo cuando hayas registrado tu última comida para ver tu resumen del día.',
  dayClosed: 'Día cerrado. ¡Gracias por registrar!',
  targetFloorNote: 'Tu objetivo se ajustó al mínimo diario recomendado. Si quieres revisarlo, escribe a soporte.',
  supportCta: 'Si quieres, hablemos',
  deleteMeal: 'Quitar',
  confirmDelete: '¿Quitar esta comida del registro?',
  noMeals: 'Aún no hay comidas registradas hoy. Te invito a añadir la primera: cada registro es una victoria.',
  savedMeal: '¡Registrado! Cada registro es una victoria.',
  loadError: 'No hemos podido cargar tus datos. Inténtalo de nuevo en un momento.',
  noAccess: 'El registro diario forma parte de Nutri Virtual. Si ya tienes un plan activo y no puedes entrar, escríbenos y lo revisamos.',
  searchPlaceholder: 'Busca un alimento (ej. arepa, arroz, pollo)',
  gramsLabel: 'Gramos',
  unitGrams: 'gramos',
  quantityLabel: 'Cantidad',
  unitLabel: 'Medida',
  estimateBadge: 'estimación',
  estimateHint: 'Valor aproximado: aún lo estamos revisando.',
  sourcesNote: 'Valores por 100 g de USDA FoodData Central y estimaciones propias.',
  sourcesLink: 'Ver fuentes',
  noResults: 'No encontramos ese alimento. Prueba con un nombre más general.',
  hiddenModeNote: 'Modo "solo plan": las calorías están ocultas. Puedes mostrarlas cuando quieras en Ajustes.',
  tabs: { hoy: 'Hoy', semana: 'Semana', ajustes: 'Ajustes' },
  mealTypes: { desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', snack: 'Snack' } as Record<string, string>,
  goals: {
    deficit: 'Perder grasa (déficit suave)',
    maintenance: 'Mantener',
    surplus: 'Ganar músculo (superávit suave)',
  } as Record<string, string>,
  settings: {
    goalLabel: 'Tu objetivo',
    hideLabel: 'Ocultar calorías (modo "solo plan")',
    hideHint: 'Seguirás registrando tus comidas, pero sin ver números. Ideal si contar te genera tensión.',
    save: 'Guardar cambios',
    saved: 'Cambios guardados.',
    recalc: 'Actualizar mis datos',
  },
  welcome: {
    title: 'Bienvenida a tu registro diario',
    paragraphs: [
      'Aquí vas a ver, día a día, cómo se acerca lo que comes a tu objetivo. Sin juicios: solo información para decidir mejor.',
      'Las cifras son una guía. Lo que importa es la tendencia de la semana, no un día suelto.',
      'Cada registro es una victoria. Lo estás haciendo muy bien por el simple hecho de estar aquí.',
    ],
    formIntro: 'Para calcular tu objetivo necesito algunos datos. Si ya hiciste tu plan nutricional, los hemos rellenado por ti.',
    start: 'Empezar',
  },
}

const STATUS_LABEL: Record<DayReport['status'], string> = {
  en_zona: 'En tu zona',
  por_debajo: 'Por debajo de tu objetivo',
  por_encima: 'Por encima de tu objetivo',
  en_curso: 'Tu día en curso',
  sin_registros: 'Tu día empieza aquí',
  sin_objetivo: 'Define tu objetivo',
}

export function statusLabel(status: DayReport['status']): string {
  return STATUS_LABEL[status]
}

// Frase de desviación: "estás un 4% por encima de tu objetivo" / "justo en tu objetivo".
export function deviationPhrase(r: Pick<DayReport, 'deviationPct' | 'onTarget'>): string | null {
  if (r.deviationPct === null) return null
  if (r.onTarget) return 'Estás justo en tu objetivo'
  const pct = Math.abs(r.deviationPct)
  return `Estás un ${pct}% ${r.deviationPct > 0 ? 'por encima' : 'por debajo'} de tu objetivo`
}

export function balancePhrase(b: EnergyBalance | null, subject = 'Hoy'): string | null {
  if (!b) return null
  const ref = `respecto a tu gasto estimado (${fmtKcal(b.tdee)})`
  if (b.kind === 'mantenimiento') return `${subject} equivale a mantenimiento ${ref}.`
  const word = b.kind === 'deficit' ? 'un déficit' : 'un superávit'
  return `${subject} equivale a ${word} de ${fmtKcal(b.kcal)} ${ref}.`
}

const STATUS_ENCOURAGEMENT: Record<DayReport['status'], string> = {
  en_zona: 'Lo estás haciendo muy bien.',
  por_debajo: 'Recuerda nutrirte bien: tu cuerpo necesita energía para rendir y recuperarse.',
  por_encima: 'Es información, no un juicio. Lo que cuenta es la tendencia de la semana.',
  en_curso: 'Cada registro es una victoria. Cuando termines tu día, ciérralo para ver tu resumen.',
  sin_registros: 'Te invito a registrar tu primera comida. Cada registro es una victoria.',
  sin_objetivo: 'Te invito a definir tu objetivo en Ajustes para ver tu reporte.',
}

// "Llevas 650 de 1.800 kcal"
export function progressPhrase(r: Pick<DayReport, 'consumed' | 'target'>): string {
  const n = (x: number) => Math.round(x).toLocaleString('es-ES')
  return r.target ? `Llevas ${n(r.consumed)} de ${n(r.target)} kcal` : `Llevas ${n(r.consumed)} kcal`
}

// ── Alertas de suelo y techo ─────────────────────────────────────────────────
export interface AlertCopy {
  kind: 'suelo' | 'techo'
  text: string
  linkLabel?: string // solo la de suelo enlaza a soporte
}

const floorRef = (hide: boolean) => (hide ? '' : ` (${fmtKcal(KCAL_FLOOR)})`)

export function floorAlertText(scope: 'dia' | 'semana', hide: boolean): string {
  const subject = scope === 'dia' ? 'Este día estuviste' : 'Tu promedio de la semana está'
  return `${subject} por debajo del mínimo diario recomendado${floorRef(hide)}. Tu cuerpo necesita energía para rendir y recuperarse.`
}

const CEILING_TEXT: Record<'dia' | 'semana', string> = {
  dia: 'Hoy estuviste por encima de tu gasto estimado, así que no hubo déficit. Es información, no un juicio: lo que cuenta es la tendencia de la semana.',
  semana: 'Tu promedio de la semana estuvo por encima de tu gasto estimado, así que no hubo déficit. Es información, no un juicio: lo que cuenta es la tendencia.',
}

// Reglas:
// - Suelo: siempre se muestra (es de seguridad), también en modo oculto pero sin cifras.
// - Techo: solo 'sobre_gasto' (objetivo déficit) tiene texto propio; 'sobre_techo' coincide
//   con el estado "Por encima de tu objetivo" y no se repite. En modo oculto no se muestra.
export function alertsCopy(
  a: { floorAlert: boolean; ceilingAlert: CeilingAlert },
  scope: 'dia' | 'semana',
  opts: { hideCalories?: boolean } = {},
): AlertCopy[] {
  const hide = !!opts.hideCalories
  const out: AlertCopy[] = []
  if (a.floorAlert) out.push({ kind: 'suelo', text: floorAlertText(scope, hide), linkLabel: COPY.supportCta })
  if (a.ceilingAlert === 'sobre_gasto' && !hide) out.push({ kind: 'techo', text: CEILING_TEXT[scope] })
  return out
}

export interface DayCopy {
  label: string
  numbers: string | null // "1.650 kcal de 1.800 kcal" o, con el día abierto, "Llevas 650 de 1.800 kcal"
  deviation: string | null
  balance: string | null
  encouragement: string
  alerts: AlertCopy[]
}

export function dayCopy(r: DayReport, opts: { hideCalories?: boolean } = {}): DayCopy {
  const label = statusLabel(r.status)
  // Si ya sale la alerta de suelo, no repetimos el mensaje de "nutrirte bien".
  const encouragement = r.floorAlert && r.status === 'por_debajo'
    ? 'Gracias por registrar: cada registro te da información valiosa.'
    : STATUS_ENCOURAGEMENT[r.status]
  const alerts = alertsCopy(r, 'dia', opts)
  if (opts.hideCalories) {
    // Solo estado, ánimo y alerta de suelo; ningún número.
    return { label, numbers: null, deviation: null, balance: null, encouragement, alerts }
  }
  if (r.status === 'en_curso') {
    // Día abierto: solo progreso, sin desviación ni balance.
    return { label, numbers: progressPhrase(r), deviation: null, balance: null, encouragement, alerts }
  }
  return {
    label,
    numbers: r.target ? `${fmtKcal(r.consumed)} de ${fmtKcal(r.target)}` : r.consumed ? fmtKcal(r.consumed) : null,
    deviation: deviationPhrase(r),
    balance: balancePhrase(r.balance),
    encouragement,
    alerts,
  }
}

export interface WeekCopy {
  headline: string
  detail: string[]
  alerts: AlertCopy[]
}

export function weekCopy(w: WeekAdjustment, opts: { hideCalories?: boolean } = {}): WeekCopy {
  if (w.kind === 'sin_objetivo') {
    return { headline: 'Define tu objetivo', detail: ['Te invito a definir tu objetivo en Ajustes para ver tu semana.'], alerts: [] }
  }
  if (w.kind === 'pocos_datos') {
    const dias = w.loggedDays === 1 ? '1 día completo' : `${w.loggedDays} días completos`
    return {
      headline: 'Sigamos sumando registros',
      detail: [
        `Llevas ${dias} con registro en los últimos 7. Con al menos ${w.needed} podremos sugerirte un ajuste fiable.`,
        'El día de hoy cuenta cuando lo cierras.',
        'Te invito a seguir registrando: cada registro es una victoria.',
      ],
      alerts: [],
    }
  }

  const hide = !!opts.hideCalories
  const avg = hide ? null : `Tu promedio de los últimos 7 días es ${fmtKcal(w.average)} (objetivo: ${fmtKcal(w.target)}).`
  const days = `Basado en ${w.loggedDays} días completos con registro.`
  const balance = hide ? null : balancePhrase(w.balance, 'Tu promedio')
  const noRebound = 'Es un ajuste suave del promedio diario, no hace falta comer menos al día siguiente de un día con más.'
  const floorNote = 'Por tu bienestar, no sugerimos bajar del mínimo diario recomendado.'

  const alerts = alertsCopy(w, 'semana', opts)
  const lines = (main: string | null, ...rest: (string | null)[]) =>
    [avg, main, balance, ...rest, days].filter((x): x is string => !!x)

  if (w.kind === 'mantener') {
    return {
      alerts,
      headline: 'Vas en tu zona',
      detail: lines('Lo estás haciendo muy bien: te invito a mantener este ritmo.'),
    }
  }
  if (w.kind === 'bajar') {
    return {
      alerts,
      headline: 'Un pequeño ajuste',
      detail: lines(
        hide
          ? 'Tu promedio está por encima de tu objetivo. Te invito a reducir un poco las raciones esta semana.'
          : `Te invito a apuntar a unas ${fmtKcal(w.suggestedDaily)} diarias esta semana (unas ${w.adjustKcal} kcal menos al día).`,
        noRebound,
        w.limitedByFloor ? floorNote : null,
      ),
    }
  }
  return {
    alerts,
    headline: 'Dale más energía a tu cuerpo',
    detail: lines(
      hide
        ? 'Tu promedio está por debajo de tu objetivo. Te invito a añadir un poco más en tus comidas esta semana.'
        : `Te invito a apuntar a unas ${fmtKcal(w.suggestedDaily)} diarias esta semana (unas ${w.adjustKcal} kcal más al día).`,
      'Nutrirte bien también es parte del proceso.',
      // Con promedio bajo el suelo ya sale la alerta de suelo; no la repetimos aquí.
      w.limitedByFloor && !w.floorAlert ? 'Por tu bienestar, te recomendamos no quedarte por debajo del mínimo diario recomendado.' : null,
    ),
  }
}
