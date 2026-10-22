import { describe, it, expect } from 'vitest'
import { COPY, FORBIDDEN_TERMS, dayCopy, weekCopy, deviationPhrase, balancePhrase } from '@/lib/reportCopy'
import { dayReport, weekAdjustment, type DayTotal } from '@/lib/calorieReport'

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
  dayReport({ consumed, target: 2000, tdee: 2300 }),
  dayReport({ consumed, target: null, tdee: null }),
])

const wk = (vals: number[]): DayTotal[] => vals.map((consumed, i) => ({ date: `2026-10-1${i}`, consumed }))
const weekScenarios = [
  weekAdjustment({ days: wk([2000]), target: 2000, tdee: 2300, sex: 'female' }),
  weekAdjustment({ days: wk([2000, 2000, 2000]), target: 2000, tdee: 2300, sex: 'female' }),
  weekAdjustment({ days: wk([2600, 2600, 2600]), target: 2000, tdee: 2300, sex: 'female' }),
  weekAdjustment({ days: wk([1500, 1500, 1500]), target: 2000, tdee: 2300, sex: 'female' }),
  weekAdjustment({ days: wk([900, 900, 900]), target: 1300, tdee: 1500, sex: 'female' }),
  weekAdjustment({ days: wk([2000, 2000, 2000]), target: null, tdee: null, sex: null }),
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
    expect(deviationPhrase(dayReport({ consumed: 2010, target: 2000, tdee: 2300 }))).toBe('Estás justo en tu objetivo')
  })

  it('porcentaje con dirección', () => {
    expect(deviationPhrase(dayReport({ consumed: 2080, target: 2000, tdee: 2300 }))).toBe('Estás un 4% por encima de tu objetivo')
    expect(deviationPhrase(dayReport({ consumed: 1500, target: 2000, tdee: 2300 }))).toBe('Estás un 25% por debajo de tu objetivo')
  })

  it('el estado en zona dice "En tu zona" y muestra consumidas y objetivo', () => {
    const c = dayCopy(dayReport({ consumed: 2080, target: 2000, tdee: 2300 }))
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
