import { describe, it, expect } from 'vitest'
import {
  COPY, FORBIDDEN_TERMS, SUPPORT_URL, dayCopy, weekCopy, deviationPhrase, balancePhrase, progressPhrase, alertsCopy,
} from '@/lib/reportCopy'
import { dayReport, weekAdjustment, type DayTotal } from '@/lib/calorieReport'

// Los casos de estado (en_zona / por_debajo / por_encima) son de días cerrados.
const closedDay = (p: Omit<Parameters<typeof dayReport>[0], 'closed'>) => dayReport({ ...p, closed: true })

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function findForbidden(text: string): string[] {
  const t = norm(text)
  return FORBIDDEN_TERMS.filter((term) => new RegExp(`(^|[^a-z])${term}([^a-z]|$)`).test(t))
}

function collectStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectStrings(x, out))
  return out
}

// Escenarios que cubren todas las ramas de dayCopy y weekCopy.
const dayScenarios = [0, 900, 1500, 1800, 1990, 2000, 2080, 2200, 2500, 4000].flatMap((consumed) => [
  closedDay({ consumed, target: 2000, tdee: 2300 }),
  closedDay({ consumed, target: null, tdee: null }),
  dayReport({ consumed, target: 2000, tdee: 2300, closed: false }),
  dayReport({ consumed, target: null, tdee: null, closed: false }),
  dayReport({ consumed, target: 1500, tdee: 1800, closed: true, goal: 'deficit' }),
  dayReport({ consumed, target: 2000, tdee: 2000, closed: true, goal: 'maintenance' }),
])

const wk = (vals: number[]): DayTotal[] => vals.map((consumed, i) => ({ date: `2026-10-1${i}`, consumed }))
const weekScenarios = [
  weekAdjustment({ days: wk([2000]), target: 2000, tdee: 2300, sex: 'female' }),
  weekAdjustment({ days: wk([2000, 2000, 2000]), target: 2000, tdee: 2300, sex: 'female' }),
  weekAdjustment({ days: wk([2600, 2600, 2600]), target: 2000, tdee: 2300, sex: 'female' }),
  weekAdjustment({ days: wk([1500, 1500, 1500]), target: 2000, tdee: 2300, sex: 'female' }),
  weekAdjustment({ days: wk([900, 900, 900]), target: 1300, tdee: 1500, sex: 'female' }),
  weekAdjustment({ days: wk([2000, 2000, 2000]), target: null, tdee: null, sex: null }),
  weekAdjustment({ days: wk([1000, 1000, 1000]), target: 1500, tdee: 1800, sex: 'female', goal: 'deficit' }),
  weekAdjustment({ days: wk([2400, 2400, 2400]), target: 1955, tdee: 2300, sex: 'female', goal: 'deficit' }),
]

const allStrings = [
  ...collectStrings(COPY),
  ...dayScenarios.flatMap((r) => [dayCopy(r), dayCopy(r, { hideCalories: true })]).flatMap((c) => collectStrings(c)),
  ...weekScenarios.flatMap((w) => [weekCopy(w), weekCopy(w, { hideCalories: true })]).flatMap((c) => collectStrings(c)),
]

describe('reportCopy — lenguaje sin culpa', () => {
  it('hay textos que revisar', () => {
    expect(allStrings.length).toBeGreaterThan(50)
  })

  it('ningún texto contiene palabras prohibidas', () => {
    const offenders = allStrings.map((s) => ({ s, hits: findForbidden(s) })).filter((x) => x.hits.length)
    expect(offenders).toEqual([])
  })

  it('el detector sí atrapa las expresiones prohibidas', () => {
    expect(findForbidden('Hoy te pasaste un poco')).toContain('te pasaste')
    expect(findForbidden('Fallaste tu objetivo')).toContain('fallaste')
    expect(findForbidden('Fue un MAL DÍA')).toContain('mal dia')
    expect(findForbidden('Mañana puedes compensar')).toContain('compensar')
    expect(findForbidden('Un día de trampa')).toContain('trampa')
    // No da falsos positivos con palabras que contienen el término
    expect(findForbidden('malestar')).toEqual([])
  })
})

describe('reportCopy — contenido', () => {
  it('"justo en tu objetivo" dentro de ±1%', () => {
    expect(deviationPhrase(closedDay({ consumed: 2010, target: 2000, tdee: 2300 }))).toBe('Estás justo en tu objetivo')
  })

  it('porcentaje con dirección', () => {
    expect(deviationPhrase(closedDay({ consumed: 2080, target: 2000, tdee: 2300 }))).toBe('Estás un 4% por encima de tu objetivo')
    expect(deviationPhrase(closedDay({ consumed: 1500, target: 2000, tdee: 2300 }))).toBe('Estás un 25% por debajo de tu objetivo')
  })

  it('el estado en zona dice "En tu zona" y muestra consumidas y objetivo', () => {
    const c = dayCopy(closedDay({ consumed: 2080, target: 2000, tdee: 2300 }))
    expect(c.label).toBe('En tu zona')
    expect(c.numbers).toMatch(/2080 kcal de 2000 kcal|2\.080 kcal de 2\.000 kcal/)
  })

  it('balance frente al TDEE con número', () => {
    expect(balancePhrase({ kind: 'deficit', kcal: 300, tdee: 2300 })).toMatch(/déficit de 300 kcal/)
    expect(balancePhrase({ kind: 'mantenimiento', kcal: 50, tdee: 2300 })).toMatch(/mantenimiento/)
  })

  it('modo ocultar calorías: ningún número en el reporte diario ni semanal', () => {
    for (const r of dayScenarios) {
      expect(collectStrings(dayCopy(r, { hideCalories: true })).join(' ')).not.toMatch(/\d/)
    }
    for (const w of weekScenarios) {
      const text = collectStrings(weekCopy(w, { hideCalories: true }).headline).join(' ')
      expect(text).not.toMatch(/kcal/)
      expect(weekCopy(w, { hideCalories: true }).detail.join(' ')).not.toMatch(/kcal/)
    }
  })

  it('el ajuste semanal nunca propone comer menos "mañana" para compensar', () => {
    for (const w of weekScenarios) {
      const t = norm(weekCopy(w).detail.join(' '))
      expect(t).not.toMatch(/manana (come|comer|reduce|reducir)/)
    }
  })
})

describe('reportCopy — día en curso', () => {
  const open = (consumed: number) => dayReport({ consumed, target: 1800, tdee: 2100, closed: false })

  it('muestra progreso "Llevas X de Y kcal" y no "por debajo"', () => {
    const c = dayCopy(open(650))
    expect(c.label).toBe('Tu día en curso')
    expect(c.numbers).toMatch(/^Llevas 650 de 1\.?800 kcal$/)
    expect(c.deviation).toBeNull()
    expect(c.balance).toBeNull()
    const all = collectStrings(c).join(' ').toLowerCase()
    expect(all).not.toMatch(/por debajo|por encima|en tu zona|déficit|superávit/)
  })

  it('invita a cerrar el día', () => {
    expect(dayCopy(open(650)).encouragement).toMatch(/ciérralo/i)
  })

  it('modo ocultar calorías: sin números también con el día abierto', () => {
    expect(collectStrings(dayCopy(open(650), { hideCalories: true })).join(' ')).not.toMatch(/\d/)
  })

  it('progressPhrase sin objetivo', () => {
    expect(progressPhrase({ consumed: 500, target: null })).toBe('Llevas 500 kcal')
  })
})

describe('reportCopy — alertas de suelo y techo', () => {
  const closed = (consumed: number, goal: 'deficit' | 'maintenance' = 'deficit') =>
    dayReport({ consumed, target: goal === 'deficit' ? 1500 : 2000, tdee: goal === 'deficit' ? 1800 : 2000, closed: true, goal })

  it('día cerrado con 1.199: alerta de suelo con cifra y enlace a soporte', () => {
    const [a] = dayCopy(closed(1199)).alerts
    expect(a.kind).toBe('suelo')
    expect(a.text).toMatch(/por debajo del mínimo diario recomendado \(1\.?200 kcal\)/)
    expect(a.text).toMatch(/Tu cuerpo necesita energía para rendir y recuperarse/)
    expect(a.linkLabel).toBe('Si quieres, hablemos')
  })

  it('justo 1.200: sin alerta de suelo', () => {
    expect(dayCopy(closed(1200)).alerts).toEqual([])
  })

  it('día en curso: sin alertas aunque vaya por debajo de 1.200', () => {
    const r = dayReport({ consumed: 500, target: 1500, tdee: 1800, closed: false, goal: 'deficit' })
    expect(dayCopy(r).alerts).toEqual([])
  })

  it('modo oculto: la alerta de suelo SÍ aparece, sin cifras', () => {
    const c = dayCopy(closed(900), { hideCalories: true })
    expect(c.alerts.map((a) => a.kind)).toEqual(['suelo'])
    expect(c.alerts[0].text).not.toMatch(/\d/)
  })

  it('techo con objetivo déficit: mensaje de "no hubo déficit"; en el TDEE exacto, nada', () => {
    const over = dayCopy(closed(1801))
    expect(over.alerts.map((a) => a.kind)).toEqual(['techo'])
    expect(over.alerts[0].text).toBe(
      'Hoy estuviste por encima de tu gasto estimado, así que no hubo déficit. Es información, no un juicio: lo que cuenta es la tendencia de la semana.',
    )
    expect(dayCopy(closed(1800)).alerts).toEqual([])
  })

  it('modo oculto: la alerta de techo no se muestra', () => {
    expect(dayCopy(closed(2500), { hideCalories: true }).alerts).toEqual([])
  })

  it('mantenimiento: por encima del objetivo +10% no duplica el mensaje del estado', () => {
    const c = dayCopy(closed(2500, 'maintenance'))
    expect(c.label).toBe('Por encima de tu objetivo')
    expect(c.alerts).toEqual([])
  })

  it('semana: alerta de suelo con el promedio, sin repetir la nota de mínimo', () => {
    const w = weekAdjustment({ days: wk([1000, 1000, 1000]), target: 1500, tdee: 1800, sex: 'female', goal: 'deficit' })
    const c = weekCopy(w)
    expect(c.alerts.map((a) => a.kind)).toEqual(['suelo'])
    expect(c.alerts[0].text).toMatch(/^Tu promedio de la semana está por debajo/)
    expect(c.detail.join(' ')).not.toMatch(/mínimo diario recomendado/)
  })

  it('semana: techo con objetivo déficit', () => {
    const w = weekAdjustment({ days: wk([2400, 2400, 2400]), target: 1955, tdee: 2300, sex: 'female', goal: 'deficit' })
    expect(weekCopy(w).alerts.map((a) => a.kind)).toEqual(['techo'])
  })

  it('alertsCopy sin alertas → lista vacía', () => {
    expect(alertsCopy({ floorAlert: false, ceilingAlert: null }, 'dia')).toEqual([])
  })

  it('la nota de objetivo ajustado y el soporte usan el nuevo correo', () => {
    expect(COPY.targetFloorNote).toBe('Tu objetivo se ajustó al mínimo diario recomendado. Si quieres revisarlo, escribe a soporte.')
    expect(SUPPORT_URL).toMatch(/^mailto:soporte@menteymusculo\.com/)
  })
})
