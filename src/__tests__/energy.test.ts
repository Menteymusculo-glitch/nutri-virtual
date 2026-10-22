import { describe, it, expect } from 'vitest'
import {
  mifflinStJeor, katchMcArdle, bmr, tdee, targetKcal, computeEnergy, validateEnergyInput,
  ACTIVITY_FACTORS,
} from '@/lib/energy'
import { KCAL_FLOOR_FEMALE, KCAL_FLOOR_MALE } from '@/lib/nutritionConstants'

const woman = { sex: 'female' as const, weightKg: 70, heightCm: 165, age: 45, activity: 'moderate' as const }

describe('mifflinStJeor', () => {
  it('mujer: 10w + 6.25h − 5a − 161', () => {
    expect(mifflinStJeor(woman)).toBeCloseTo(10 * 70 + 6.25 * 165 - 5 * 45 - 161) // 1345.25
  })
  it('hombre: +5', () => {
    expect(mifflinStJeor({ sex: 'male', weightKg: 80, heightCm: 180, age: 40 })).toBeCloseTo(800 + 1125 - 200 + 5)
  })
})

describe('katchMcArdle', () => {
  it('370 + 21.6 × masa magra', () => {
    expect(katchMcArdle(50)).toBeCloseTo(1450)
  })
})

describe('bmr', () => {
  it('sin composición corporal usa Mifflin-St Jeor', () => {
    expect(bmr(woman)).toEqual({ kcal: 1345, method: 'mifflin_st_jeor' })
  })
  it('con % de grasa usa Katch-McArdle con la masa magra derivada', () => {
    // 70 kg × (1 − 0.30) = 49 kg magra → 370 + 21.6×49 = 1428.4
    expect(bmr({ ...woman, bodyFatPct: 30 })).toEqual({ kcal: 1428, method: 'katch_mcardle' })
  })
  it('masa magra directa tiene prioridad sobre el % de grasa', () => {
    expect(bmr({ ...woman, leanMassKg: 50, bodyFatPct: 40 }).kcal).toBe(1450)
  })
  it('ignora masa magra imposible (≥ peso) y cae a Mifflin', () => {
    expect(bmr({ ...woman, leanMassKg: 80 }).method).toBe('mifflin_st_jeor')
  })
})

describe('tdee', () => {
  it('BMR × factor de actividad', () => {
    expect(tdee(1345, 'moderate')).toBe(Math.round(1345 * ACTIVITY_FACTORS.moderate))
    expect(tdee(1500, 'sedentary')).toBe(1800)
  })
})

describe('targetKcal', () => {
  it('déficit = TDEE × 0.85', () => {
    expect(targetKcal(2000, 'deficit', 'female')).toBe(1700)
  })
  it('mantenimiento = TDEE', () => {
    expect(targetKcal(2000, 'maintenance', 'female')).toBe(2000)
  })
  it('superávit = TDEE × 1.10', () => {
    expect(targetKcal(2000, 'surplus', 'female')).toBe(2200)
  })
  it('respeta el suelo femenino', () => {
    expect(targetKcal(1300, 'deficit', 'female')).toBe(KCAL_FLOOR_FEMALE)
  })
  it('respeta el suelo masculino', () => {
    expect(targetKcal(1700, 'deficit', 'male')).toBe(KCAL_FLOOR_MALE)
  })
  it('sin sexo conocido usa el suelo más protector', () => {
    expect(targetKcal(1300, 'deficit', null)).toBe(KCAL_FLOOR_MALE)
  })
})

describe('computeEnergy', () => {
  it('encadena BMR → TDEE → objetivo', () => {
    const e = computeEnergy(woman, 'deficit')
    expect(e.bmrKcal).toBe(1345)
    expect(e.tdeeKcal).toBe(2085) // 1345 × 1.55 = 2084.75
    expect(e.targetKcal).toBe(1772) // 2085 × 0.85 = 1772.25
  })
})

describe('validateEnergyInput', () => {
  it('acepta datos válidos', () => {
    expect(validateEnergyInput(woman).ok).toBe(true)
  })
  it.each([
    [{ ...woman, sex: undefined }],
    [{ ...woman, weightKg: 10 }],
    [{ ...woman, heightCm: 300 }],
    [{ ...woman, age: 12 }],
    [{ ...woman, activity: 'couch' as never }],
    [{ ...woman, bodyFatPct: 90 }],
    [{ ...woman, weightKg: NaN }],
  ])('rechaza datos inválidos %#', (input) => {
    expect(validateEnergyInput(input).ok).toBe(false)
  })
})
