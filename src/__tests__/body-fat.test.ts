import { describe, it, expect } from 'vitest'
import { computeNavyBodyFat, getCategory, healthyRange } from '@/lib/bodyFat'

describe('computeNavyBodyFat', () => {
  it('mujer 165 cm, cuello 33, cintura 80, cadera 100 → ~30% (valor de referencia US Navy)', () => {
    const r = computeNavyBodyFat({ gender: 'female', heightCm: 165, neckCm: 33, waistCm: 80, hipCm: 100 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.bf).toBeGreaterThan(27)
      expect(r.bf).toBeLessThan(33)
      expect(r.high - r.low).toBeCloseTo(8, 5)
    }
  })

  it('hombre 180 cm, cuello 38, cintura 90 → ~19-20%', () => {
    const r = computeNavyBodyFat({ gender: 'male', heightCm: 180, neckCm: 38, waistCm: 90 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.bf).toBeGreaterThan(17)
      expect(r.bf).toBeLessThan(22)
    }
  })

  it('mujer sin cadera → error', () => {
    const r = computeNavyBodyFat({ gender: 'female', heightCm: 165, neckCm: 33, waistCm: 80 })
    expect(r.ok).toBe(false)
  })

  it('cintura menor que cuello (hombre) → error', () => {
    const r = computeNavyBodyFat({ gender: 'male', heightCm: 180, neckCm: 50, waistCm: 45 })
    expect(r.ok).toBe(false)
  })

  it('marca fuera de rango y limita el valor', () => {
    const r = computeNavyBodyFat({ gender: 'male', heightCm: 180, neckCm: 40, waistCm: 41 })
    if (r.ok && r.outOfRange) {
      expect(r.bf).toBeGreaterThanOrEqual(3)
      expect(r.bf).toBeLessThanOrEqual(60)
    }
  })

  it('el rango nunca sale de 3-60', () => {
    const r = computeNavyBodyFat({ gender: 'female', heightCm: 160, neckCm: 30, waistCm: 120, hipCm: 130 })
    if (r.ok) {
      expect(r.low).toBeGreaterThanOrEqual(3)
      expect(r.high).toBeLessThanOrEqual(60)
    }
  })
})

describe('getCategory', () => {
  it('mujer: límites ACE', () => {
    expect(getCategory(13.9, 'female').cls).toBe('essential')
    expect(getCategory(20.9, 'female').cls).toBe('athlete')
    expect(getCategory(24.9, 'female').cls).toBe('fitness')
    expect(getCategory(31.9, 'female').cls).toBe('acceptable')
    expect(getCategory(32, 'female').cls).toBe('obesity')
  })
  it('hombre: límites ACE', () => {
    expect(getCategory(5.9, 'male').cls).toBe('essential')
    expect(getCategory(24.9, 'male').cls).toBe('acceptable')
    expect(getCategory(25, 'male').cls).toBe('obesity')
  })
})

describe('healthyRange (Gallagher 2000)', () => {
  it('mujer 45 años → 23-33', () => expect(healthyRange('female', 45)).toEqual([23, 33]))
  it('mujer 35 años → 21-32', () => expect(healthyRange('female', 35)).toEqual([21, 32]))
  it('hombre 50 años → 11-21', () => expect(healthyRange('male', 50)).toEqual([11, 21]))
})
