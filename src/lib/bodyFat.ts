// Estimación de grasa corporal por el método de circunferencias de la US Navy
// (Hodgdon & Beckett, 1984). Todas las medidas en centímetros.
// Es una ESTIMACIÓN: el error típico frente a DEXA es de ±3-4 puntos porcentuales
// y puede ser mayor en cuerpos con mucha o muy poca grasa.

export type Gender = 'female' | 'male'

export const NAVY_MARGIN = 4 // puntos porcentuales, usado para mostrar un rango honesto

export interface NavyInput {
  gender: Gender
  heightCm: number
  neckCm: number
  waistCm: number
  hipCm?: number // obligatorio para mujeres
}

export type NavyResult =
  | { ok: true; bf: number; rawBf: number; clampedBf: number; outOfRange: boolean; low: number; high: number }
  | { ok: false; error: string }

export function computeNavyBodyFat(input: NavyInput): NavyResult {
  const { gender, heightCm: h, neckCm: n, waistCm: wa } = input
  const hi = input.hipCm ?? NaN

  if ([h, n, wa].some(v => !isFinite(v) || v <= 0) || (gender === 'female' && (!isFinite(hi) || hi <= 0))) {
    return { ok: false, error: 'Completa todos los campos con valores válidos.' }
  }

  let rawBf: number
  if (gender === 'female') {
    const logVal = wa + hi - n
    if (logVal <= 0) return { ok: false, error: 'Cintura + cadera debe ser mayor que el cuello.' }
    rawBf = 495 / (1.29579 - 0.35004 * Math.log10(logVal) + 0.221 * Math.log10(h)) - 450
  } else {
    const logVal = wa - n
    if (logVal <= 0) return { ok: false, error: 'La cintura debe ser mayor que el cuello.' }
    rawBf = 495 / (1.0324 - 0.19077 * Math.log10(logVal) + 0.15456 * Math.log10(h)) - 450
  }

  if (!isFinite(rawBf)) {
    return { ok: false, error: 'Error en el cálculo. Verifica que las medidas sean correctas.' }
  }

  const outOfRange = rawBf < 3 || rawBf > 60
  const clampedBf = Math.min(60, Math.max(3, rawBf))
  const bf = outOfRange ? clampedBf : rawBf

  return {
    ok: true,
    bf,
    rawBf,
    clampedBf,
    outOfRange,
    low: Math.max(3, bf - NAVY_MARGIN),
    high: Math.min(60, bf + NAVY_MARGIN),
  }
}

// Categorías ACE (American Council on Exercise).
export function getCategory(bf: number, gender: Gender) {
  if (gender === 'female') {
    if (bf < 14) return { name: 'Esencial', cls: 'essential' }
    if (bf < 21) return { name: 'Atleta', cls: 'athlete' }
    if (bf < 25) return { name: 'Fitness', cls: 'fitness' }
    if (bf < 32) return { name: 'Aceptable', cls: 'acceptable' }
    return { name: 'Por encima del rango', cls: 'obesity' }
  }
  if (bf < 6) return { name: 'Esencial', cls: 'essential' }
  if (bf < 14) return { name: 'Atleta', cls: 'athlete' }
  if (bf < 18) return { name: 'Fitness', cls: 'fitness' }
  if (bf < 25) return { name: 'Aceptable', cls: 'acceptable' }
  return { name: 'Por encima del rango', cls: 'obesity' }
}

// Rango de grasa corporal asociado a peso saludable según edad.
// Fuente: Gallagher et al., Am J Clin Nutr 2000;72(3):694-701 (IMC 18,5-24,9).
// Las categorías ACE no cambian con la edad; este rango sí, y es relevante
// para mujeres en perimenopausia/menopausia, donde la grasa sube de forma natural.
export function healthyRange(gender: Gender, age: number): [number, number] {
  const table: Record<Gender, [number, number][]> = {
    female: [[21, 32], [23, 33], [24, 35]], // 20-39, 40-59, 60-79
    male: [[8, 19], [11, 21], [13, 24]],
  }
  const idx = age < 40 ? 0 : age < 60 ? 1 : 2
  return table[gender][idx]
}
