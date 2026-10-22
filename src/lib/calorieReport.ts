// Reporte diario y ajuste semanal. Solo números y estados: los textos viven en
// src/lib/reportCopy.ts. Reglas de producto: sección 2 de PROMPT_TRACKER_CALORIAS.md.
import {
  kcalFloor,
  MAINTENANCE_TOLERANCE_PCT,
  MAX_WEEKLY_ADJUSTMENT_PCT,
  MIN_LOGGED_DAYS_FOR_ADJUSTMENT,
  ON_TARGET_TOLERANCE_PCT,
  WEEK_WINDOW_DAYS,
  ZONE_TOLERANCE_PCT,
  type Sex,
} from '@/lib/nutritionConstants'

// 'en_curso': día abierto con registros. Los estados en_zona / por_debajo / por_encima
// solo existen cuando el día está cerrado (lo cerró la usuaria o ya pasó).
export type DayStatus = 'en_zona' | 'por_debajo' | 'por_encima' | 'en_curso' | 'sin_registros' | 'sin_objetivo'
export type BalanceKind = 'deficit' | 'mantenimiento' | 'superavit'

export interface EnergyBalance {
  kind: BalanceKind
  kcal: number // diferencia absoluta respecto al TDEE, redondeada
  tdee: number
}

export interface DayReport {
  status: DayStatus
  consumed: number
  target: number | null
  deviationPct: number | null // entero con signo; null sin objetivo
  onTarget: boolean // dentro de ±1%
  balance: EnergyBalance | null
  closed: boolean
  progressPct: number | null // % del objetivo consumido (para la barra de progreso)
}

// Evita que errores de coma flotante saquen de la zona un ±10% exacto.
const EPS = 1e-9

function isPositive(n: number | null | undefined): n is number {
  return typeof n === 'number' && isFinite(n) && n > 0
}

export function energyBalance(consumed: number, tdee: number | null | undefined): EnergyBalance | null {
  if (!isPositive(tdee)) return null
  const diff = consumed - tdee
  const pct = (diff / tdee) * 100
  const kind: BalanceKind =
    Math.abs(pct) <= MAINTENANCE_TOLERANCE_PCT + EPS ? 'mantenimiento' : pct < 0 ? 'deficit' : 'superavit'
  return { kind, kcal: Math.round(Math.abs(diff)), tdee: Math.round(tdee) }
}

function statusFor(rawPct: number): 'en_zona' | 'por_debajo' | 'por_encima' {
  if (Math.abs(rawPct) <= ZONE_TOLERANCE_PCT + EPS) return 'en_zona'
  return rawPct < 0 ? 'por_debajo' : 'por_encima'
}

export function dayReport(p: {
  consumed: number
  target: number | null | undefined
  tdee: number | null | undefined
  closed: boolean
}): DayReport {
  const consumed = isFinite(p.consumed) && p.consumed > 0 ? Math.round(p.consumed) : 0
  const closed = p.closed
  const empty = { deviationPct: null, onTarget: false, balance: null, closed }

  if (!isPositive(p.target)) {
    return { status: 'sin_objetivo', consumed, target: null, progressPct: null, ...empty }
  }
  const target = Math.round(p.target)
  const progressPct = Math.round((consumed / target) * 100)

  // Sin registros no hay "por debajo": simplemente aún no hay datos.
  if (consumed === 0) {
    return { status: 'sin_registros', consumed, target, progressPct, ...empty }
  }

  // Día abierto: solo progreso. Nada de "por debajo" a media mañana.
  if (!closed) {
    return { status: 'en_curso', consumed, target, progressPct, ...empty }
  }

  const rawPct = ((consumed - target) / target) * 100
  return {
    status: statusFor(rawPct),
    consumed,
    target,
    deviationPct: Math.round(rawPct),
    onTarget: Math.abs(rawPct) <= ON_TARGET_TOLERANCE_PCT + EPS,
    balance: energyBalance(consumed, p.tdee),
    closed,
    progressPct,
  }
}

// Un día está cerrado si es anterior a hoy (fecha local) o si la usuaria lo cerró.
export function isDayClosed(date: string, today: string, closedDates: Iterable<string> = []): boolean {
  if (date < today) return true
  for (const d of closedDates) if (d === date) return true
  return false
}

// Ventana del ajuste semanal: los últimos 7 días COMPLETOS. Si hoy está abierto,
// la ventana termina ayer; si la usuaria cerró hoy, termina hoy.
export function weekWindow(today: string, todayClosed: boolean, n = WEEK_WINDOW_DAYS): string[] {
  return lastNDates(todayClosed ? today : shiftDate(today, -1), n)
}

export interface DayTotal {
  date: string // YYYY-MM-DD
  consumed: number
}

export type WeekAdjustment =
  | { kind: 'sin_objetivo'; loggedDays: number }
  | { kind: 'pocos_datos'; loggedDays: number; needed: number }
  | {
      kind: 'mantener' | 'subir' | 'bajar'
      loggedDays: number
      average: number
      target: number
      deviationPct: number
      adjustKcal: number // cambio diario sugerido (positivo), 0 en 'mantener'
      suggestedDaily: number // ingesta diaria sugerida para la próxima semana
      limitedByFloor: boolean // el suelo calórico obligó a subir la sugerencia
      balance: EnergyBalance | null
    }

// Se calcula sobre el PROMEDIO de los días con registro de la ventana (no sobre un día suelto).
// Los días sin registro no cuentan como 0 kcal: son datos que faltan.
// La sugerencia es un nuevo promedio diario; nunca "compensar" un día con el siguiente.
// Con `today`, el día actual (y cualquier fecha futura) solo cuenta si está en `closedDates`.
export function weekAdjustment(p: {
  days: DayTotal[]
  target: number | null | undefined
  tdee: number | null | undefined
  sex: Sex | null | undefined
  today?: string
  closedDates?: Iterable<string>
}): WeekAdjustment {
  const closedDates = [...(p.closedDates ?? [])]
  const eligible = p.today ? p.days.filter((d) => isDayClosed(d.date, p.today!, closedDates)) : p.days
  const logged = eligible.filter((d) => isFinite(d.consumed) && d.consumed > 0)
  const loggedDays = logged.length

  if (!isPositive(p.target)) return { kind: 'sin_objetivo', loggedDays }
  if (loggedDays < MIN_LOGGED_DAYS_FOR_ADJUSTMENT) {
    return { kind: 'pocos_datos', loggedDays, needed: MIN_LOGGED_DAYS_FOR_ADJUSTMENT }
  }

  const floor = kcalFloor(p.sex)
  // Un objetivo guardado por debajo del suelo se eleva al suelo.
  const target = Math.max(Math.round(p.target), floor)
  const average = Math.round(logged.reduce((s, d) => s + d.consumed, 0) / loggedDays)
  const rawPct = ((average - target) / target) * 100
  const deviationPct = Math.round(rawPct)
  const balance = energyBalance(average, p.tdee)
  const cap = Math.round((target * MAX_WEEKLY_ADJUSTMENT_PCT) / 100)

  const status = statusFor(rawPct)
  if (status === 'en_zona') {
    // Aunque esté en zona, nunca sugerimos mantener una ingesta por debajo del suelo.
    const suggestedDaily = Math.max(average, floor)
    return {
      kind: suggestedDaily > average ? 'subir' : 'mantener',
      loggedDays, average, target, deviationPct,
      adjustKcal: suggestedDaily - average,
      suggestedDaily,
      limitedByFloor: suggestedDaily > average,
      balance,
    }
  }

  if (status === 'por_encima') {
    const adjust = Math.min(average - target, cap)
    const suggested = average - adjust
    const suggestedDaily = Math.max(suggested, floor)
    return {
      kind: 'bajar',
      loggedDays, average, target, deviationPct,
      adjustKcal: average - suggestedDaily,
      suggestedDaily,
      limitedByFloor: suggestedDaily > suggested,
      balance,
    }
  }

  // por_debajo: subir como máximo el tope, pero nunca quedarse bajo el suelo
  // (la seguridad del suelo prima sobre el tope del 10%).
  const adjust = Math.min(target - average, cap)
  const suggested = average + adjust
  const suggestedDaily = Math.max(suggested, floor)
  return {
    kind: 'subir',
    loggedDays, average, target, deviationPct,
    adjustKcal: suggestedDaily - average,
    suggestedDaily,
    limitedByFloor: suggestedDaily > suggested,
    balance,
  }
}

export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) + days * 86_400_000).toISOString().slice(0, 10)
}

// La fecha local que envía el navegador solo puede diferir un día de la fecha UTC del servidor.
export function isPlausibleToday(today: string, nowMs = Date.now()): boolean {
  if (!isValidDate(today)) return false
  const utc = new Date(nowMs).toISOString().slice(0, 10)
  return today === utc || today === shiftDate(utc, -1) || today === shiftDate(utc, 1)
}

// Últimos N días (incluido `endDate`) en formato YYYY-MM-DD, del más antiguo al más reciente.
export function lastNDates(endDate: string, n: number): string[] {
  const [y, m, d] = endDate.split('-').map(Number)
  const end = Date.UTC(y, m - 1, d)
  return Array.from({ length: n }, (_, i) => new Date(end - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10))
}

export function isValidDate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}
