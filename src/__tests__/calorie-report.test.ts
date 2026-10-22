import { describe, it, expect } from 'vitest'
import { dayReport, weekAdjustment, energyBalance, lastNDates, isValidDate, type DayTotal } from '@/lib/calorieReport'
import { KCAL_FLOOR_FEMALE, KCAL_FLOOR_MALE } from '@/lib/nutritionConstants'

describe('dayReport — estado', () => {
  const base = { target: 2000, tdee: 2300 }

  it('0 kcal → sin_registros (no "por debajo")', () => {
    const r = dayReport({ ...base, consumed: 0 })
    expect(r.status).toBe('sin_registros')
    expect(r.deviationPct).toBeNull()
    expect(r.balance).toBeNull()
  })

  it('sin objetivo → sin_objetivo', () => {
    expect(dayReport({ consumed: 1500, target: null, tdee: 2000 }).status).toBe('sin_objetivo')
    expect(dayReport({ consumed: 1500, target: 0, tdee: 2000 }).status).toBe('sin_objetivo')
    expect(dayReport({ consumed: 1500, target: undefined, tdee: 2000 }).status).toBe('sin_objetivo')
  })

  it('justo +10% → en_zona', () => {
    const r = dayReport({ ...base, consumed: 2200 })
    expect(r.status).toBe('en_zona')
    expect(r.deviationPct).toBe(10)
  })

  it('justo −10% → en_zona', () => {
    const r = dayReport({ ...base, consumed: 1800 })
    expect(r.status).toBe('en_zona')
    expect(r.deviationPct).toBe(-10)
  })

  it('+10.05% → por_encima', () => {
    expect(dayReport({ ...base, consumed: 2201 }).status).toBe('por_encima')
  })

  it('−10.05% → por_debajo', () => {
    expect(dayReport({ ...base, consumed: 1799 }).status).toBe('por_debajo')
  })

  it('±10% exacto con objetivos que generan coma flotante', () => {
    expect(dayReport({ consumed: 1870, target: 1700, tdee: 2000 }).status).toBe('en_zona') // +10%
    expect(dayReport({ consumed: 1530, target: 1700, tdee: 2000 }).status).toBe('en_zona') // −10%
  })

  it('dentro de ±1% → onTarget', () => {
    expect(dayReport({ ...base, consumed: 2020 }).onTarget).toBe(true) // +1%
    expect(dayReport({ ...base, consumed: 1980 }).onTarget).toBe(true) // −1%
    expect(dayReport({ ...base, consumed: 2000 }).onTarget).toBe(true)
  })

  it('fuera de ±1% → no onTarget', () => {
    expect(dayReport({ ...base, consumed: 2021 }).onTarget).toBe(false)
    expect(dayReport({ ...base, consumed: 1979 }).onTarget).toBe(false)
  })

  it('desviación redondeada con signo', () => {
    expect(dayReport({ ...base, consumed: 2080 }).deviationPct).toBe(4)
    expect(dayReport({ ...base, consumed: 1500 }).deviationPct).toBe(-25)
  })

  it('kcal negativas o NaN se tratan como 0', () => {
    expect(dayReport({ ...base, consumed: -50 }).status).toBe('sin_registros')
    expect(dayReport({ ...base, consumed: NaN }).status).toBe('sin_registros')
  })
})

describe('energyBalance (déficit / mantenimiento / superávit vs TDEE)', () => {
  it('±5% del TDEE → mantenimiento', () => {
    expect(energyBalance(2100, 2000)?.kind).toBe('mantenimiento') // +5%
    expect(energyBalance(1900, 2000)?.kind).toBe('mantenimiento') // −5%
  })
  it('por debajo → déficit con el número', () => {
    expect(energyBalance(1600, 2000)).toEqual({ kind: 'deficit', kcal: 400, tdee: 2000 })
  })
  it('por encima → superávit con el número', () => {
    expect(energyBalance(2300, 2000)).toEqual({ kind: 'superavit', kcal: 300, tdee: 2000 })
  })
  it('sin TDEE → null', () => {
    expect(energyBalance(2000, null)).toBeNull()
    expect(energyBalance(2000, 0)).toBeNull()
  })
  it('dayReport incluye el balance', () => {
    expect(dayReport({ consumed: 1700, target: 1700, tdee: 2000 }).balance?.kind).toBe('deficit')
  })
})

function week(values: number[]): DayTotal[] {
  return values.map((consumed, i) => ({ date: `2026-10-${String(10 + i).padStart(2, '0')}`, consumed }))
}

describe('weekAdjustment', () => {
  const base = { target: 2000, tdee: 2300, sex: 'female' as const }

  it('menos de 3 días con registro → pocos_datos, sin sugerencia', () => {
    const w = weekAdjustment({ ...base, days: week([2500, 0, 2600, 0, 0, 0, 0]) })
    expect(w).toEqual({ kind: 'pocos_datos', loggedDays: 2, needed: 3 })
  })

  it('0 días → pocos_datos', () => {
    expect(weekAdjustment({ ...base, days: [] }).kind).toBe('pocos_datos')
  })

  it('sin objetivo → sin_objetivo', () => {
    expect(weekAdjustment({ ...base, target: null, days: week([2000, 2000, 2000]) }).kind).toBe('sin_objetivo')
  })

  it('exactamente 3 días ya permite sugerir', () => {
    expect(weekAdjustment({ ...base, days: week([2000, 2000, 2000]) }).kind).toBe('mantener')
  })

  it('promedia solo los días con registro (los vacíos no cuentan como 0)', () => {
    const w = weekAdjustment({ ...base, days: week([2000, 0, 2100, 0, 1900, 0, 0]) })
    if (w.kind !== 'mantener') throw new Error(w.kind)
    expect(w.average).toBe(2000)
    expect(w.loggedDays).toBe(3)
    expect(w.adjustKcal).toBe(0)
    expect(w.suggestedDaily).toBe(2000)
  })

  it('usa el promedio, no un día suelto: un día alto no dispara ajuste si la media está en zona', () => {
    const w = weekAdjustment({ ...base, days: week([3000, 1800, 1800, 1800, 1800, 1800, 1800]) })
    expect(w.kind).toBe('mantener') // media 1971
  })

  it('por encima: el ajuste se limita al 10% del objetivo', () => {
    const w = weekAdjustment({ ...base, days: week([2600, 2600, 2600, 2600]) })
    if (w.kind !== 'bajar') throw new Error(w.kind)
    expect(w.adjustKcal).toBe(200) // 10% de 2000, no 600
    expect(w.suggestedDaily).toBe(2400)
    expect(w.limitedByFloor).toBe(false)
    expect(w.deviationPct).toBe(30)
  })

  it('por encima pero cerca: el ajuste es la diferencia si es menor que el tope', () => {
    // Objetivo 2000, tope 200; media 2210 (+10.5%) → bajar 200 (≤ 210)
    const w = weekAdjustment({ ...base, days: week([2210, 2210, 2210]) })
    if (w.kind !== 'bajar') throw new Error(w.kind)
    expect(w.adjustKcal).toBe(200)
  })

  it('por debajo: subir como máximo el 10% del objetivo', () => {
    const w = weekAdjustment({ ...base, days: week([1500, 1500, 1500]) })
    if (w.kind !== 'subir') throw new Error(w.kind)
    expect(w.adjustKcal).toBe(200)
    expect(w.suggestedDaily).toBe(1700)
  })

  it('ajuste que chocaría con el suelo: la sugerencia nunca queda bajo el suelo', () => {
    // Objetivo 1300, media 900 → +130 daría 1030 < 1200 → se sube al suelo.
    const w = weekAdjustment({ target: 1300, tdee: 1500, sex: 'female', days: week([900, 900, 900]) })
    if (w.kind !== 'subir') throw new Error(w.kind)
    expect(w.suggestedDaily).toBe(KCAL_FLOOR_FEMALE)
    expect(w.limitedByFloor).toBe(true)
  })

  it('objetivo guardado por debajo del suelo se eleva al suelo', () => {
    const w = weekAdjustment({ target: 1000, tdee: 1400, sex: 'male', days: week([1500, 1500, 1500]) })
    if (w.kind !== 'mantener') throw new Error(w.kind)
    expect(w.target).toBe(KCAL_FLOOR_MALE)
  })

  it('bajar nunca sugiere menos del suelo', () => {
    // Objetivo bajo el suelo (1100 → 1200); media 1500 (+25%), tope 120 → 1380 ≥ 1200
    const w = weekAdjustment({ target: 1100, tdee: 1400, sex: 'female', days: week([1500, 1500, 1500]) })
    if (w.kind !== 'bajar') throw new Error(w.kind)
    expect(w.suggestedDaily).toBeGreaterThanOrEqual(KCAL_FLOOR_FEMALE)
    expect(w.adjustKcal).toBeLessThanOrEqual(120)
  })

  it('en zona pero bajo el suelo → sugiere subir al suelo', () => {
    // Objetivo 1200 (suelo), media 1100 (−8%, en zona)
    const w = weekAdjustment({ target: 1200, tdee: 1500, sex: 'female', days: week([1100, 1100, 1100]) })
    if (w.kind !== 'subir') throw new Error(w.kind)
    expect(w.suggestedDaily).toBe(1200)
    expect(w.limitedByFloor).toBe(true)
  })

  it('incluye el balance del promedio frente al TDEE', () => {
    const w = weekAdjustment({ ...base, days: week([2000, 2000, 2000]) })
    if (w.kind !== 'mantener') throw new Error(w.kind)
    expect(w.balance).toEqual({ kind: 'deficit', kcal: 300, tdee: 2300 })
  })
})

describe('fechas', () => {
  it('lastNDates devuelve 7 días terminando en la fecha dada', () => {
    expect(lastNDates('2026-03-02', 3)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02'])
    expect(lastNDates('2026-10-22', 7)).toHaveLength(7)
  })
  it('isValidDate', () => {
    expect(isValidDate('2026-10-22')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('22-10-2026')).toBe(false)
    expect(isValidDate(undefined)).toBe(false)
  })
})
