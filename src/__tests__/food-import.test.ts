/**
 * Lógica de importación de USDA (scripts/lib): porciones, validación kcal,
 * recetas, duplicados y generación del SQL.
 */
import { describe, it, expect } from 'vitest'
import {
  buildFoods, failsValidation, findNearDuplicates, kcalDeviation, portionLabel, toSeedSql,
} from '../../scripts/lib/foods.mjs'
import { parseCsvLine } from '../../scripts/lib/usda.mjs'

type U = { fdcId: number; description: string; kcal: number | null; protein: number | null; carbs: number | null; fat: number | null; fiber: number | null; portions: unknown[] }
const usdaMap = (rows: Partial<U>[]) => new Map(rows.map((r) => [r.fdcId!, { description: 'x', fiber: null, portions: [], ...r } as U]))

describe('portionLabel', () => {
  it.each([
    [{ amount: 1, unit: 'undetermined', modifier: 'cup' }, '1 taza'],
    [{ amount: 0.5, unit: 'undetermined', modifier: 'cup, chopped' }, '1/2 taza (picado)'],
    [{ amount: 2, unit: 'tablespoon', modifier: '' }, '2 cucharadas'],
    [{ amount: 1, unit: 'undetermined', modifier: 'slice' }, '1 rebanada'],
    [{ amount: 1, unit: 'undetermined', modifier: 'medium (7" to 7-7/8" long)' }, '1 unidad mediana'],
    [{ amount: 1, unit: 'undetermined', modifier: 'large' }, '1 unidad grande'],
  ])('%j → %s', (p, label) => {
    expect(portionLabel(p)).toBe(label)
  })

  it('descarta lo que no sabe traducir con seguridad (onzas, raciones, calificativos raros)', () => {
    expect(portionLabel({ amount: 1, unit: 'undetermined', modifier: 'oz' })).toBeNull()
    expect(portionLabel({ amount: 1, unit: 'undetermined', modifier: 'serving' })).toBeNull()
    expect(portionLabel({ amount: 1, unit: 'undetermined', modifier: 'cup, loosely packed' })).toBeNull()
    expect(portionLabel({ amount: 1.7, unit: 'undetermined', modifier: 'cup' })).toBeNull()
  })

  it('usa la etiqueta escrita a mano cuando existe', () => {
    expect(portionLabel({ amount: 1, unit: 'undetermined', modifier: 'piece' }, { piece: '1 arepa' })).toBe('1 arepa')
  })
})

describe('validación kcal ≈ 4P + 4C + 9G', () => {
  it('calcula la desviación respecto a la kcal de la fuente', () => {
    expect(kcalDeviation({ kcal_100g: 100, protein_100g: 10, carbs_100g: 10, fat_100g: 2 })).toEqual({ expected: 98, diffKcal: -2, pct: -2 })
  })

  it('marca más de un 20 % y más de 5 kcal', () => {
    expect(failsValidation({ kcal_100g: 43, protein_100g: 0.5, carbs_100g: 3.6, fat_100g: 0 })).toBe(true) // cerveza
    expect(failsValidation({ kcal_100g: 100, protein_100g: 10, carbs_100g: 10, fat_100g: 2 })).toBe(false)
    expect(failsValidation({ kcal_100g: 1, protein_100g: 0.1, carbs_100g: 0, fat_100g: 0 })).toBe(false) // café: casi sin kcal
  })
})

describe('buildFoods', () => {
  const usda = usdaMap([
    { fdcId: 1, description: 'Rice, cooked', kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, portions: [{ amount: 1, unit: 'undetermined', modifier: 'cup', grams: 158 }, { amount: 1, unit: 'undetermined', modifier: 'oz', grams: 28.35 }] },
    { fdcId: 2, description: 'Beer', kcal: 43, protein: 0.5, carbs: 3.6, fat: 0 },
    { fdcId: 3, description: 'Oil', kcal: 884, protein: 0, carbs: 0, fat: 100 },
    { fdcId: 4, description: 'Bad', kcal: 300, protein: 1, carbs: 1, fat: 1 },
  ])
  const catalog = {
    usda: [
      { fdc: 1, name: 'Arroz blanco cocido', prep: 'cocido', regions: ['*'], aliases: ['Arroz', 'white rice'], replaces: ['arroz'] },
      { fdc: 2, name: 'Cerveza', prep: 'bebida', regions: ['ES'], note: 'Alcohol' },
      { fdc: 4, name: 'Dato raro', prep: 'otro', regions: ['US'] },
      { fdc: 99, name: 'No existe', prep: 'otro', regions: ['US'] },
    ],
    approx: [
      { name: 'Arroz con aceite', prep: 'cocido', regions: ['VE'], recipe: [[1, 90], [3, 10]], basis: 'receta', portions: [['1 plato', 300]] },
      { name: 'Arroz hervido largo', prep: 'cocido', regions: ['VE'], recipe: [[1, 100]], water: 100, basis: 'receta' },
    ],
    reviewed: [],
  }
  const r = buildFoods(catalog, usda)
  const byName: Record<string, Record<string, unknown>> = Object.fromEntries(r.foods.map((f: { name: string }) => [f.name, f]))

  it('toma los valores de USDA y normaliza alias y regiones', () => {
    expect(byName['Arroz blanco cocido']).toMatchObject({
      name_norm: 'arroz blanco cocido', quality: 'usda', source_ref: 'USDA fdcId 1', kcal_100g: 130,
      aliases: ['arroz', 'white rice'], regions: ['ES', 'EU', 'US', 'MX', 'VE', 'LATAM'], prep_state: 'cocido',
    })
  })

  it('una desviación explicada se conserva; sin explicación se excluye', () => {
    expect(byName['Cerveza'].validation_note).toBe('Alcohol')
    expect(byName['Dato raro']).toBeUndefined()
    expect(r.excluded.map((e: { name: string }) => e.name)).toEqual(['Dato raro'])
  })

  it('informa de los fdcId que no están en USDA', () => {
    expect(r.missing).toEqual([{ name: 'No existe', fdc: 99 }])
  })

  it('calcula las recetas por 100 g con ingredientes USDA (con agua o rendimiento)', () => {
    expect(byName['Arroz con aceite']).toMatchObject({ quality: 'approx', kcal_100g: 205, fat_100g: 10.27 })
    expect(byName['Arroz hervido largo']).toMatchObject({ kcal_100g: 65, carbs_100g: 14.1 })
  })

  it('genera porciones traducidas y descarta las que no sabe traducir', () => {
    const labels = r.portions.map((p: { name_norm: string; label: string }) => `${p.name_norm}: ${p.label}`)
    expect(labels).toEqual(['arroz blanco cocido: 1 taza', 'arroz con aceite: 1 plato'])
  })

  it('detecta nombres repetidos y duplicados casi idénticos', () => {
    const dup = buildFoods({ usda: [
      { fdc: 1, name: 'Arroz blanco cocido', prep: 'cocido', regions: ['*'] },
      { fdc: 1, name: 'Arroz cocido blanco', prep: 'cocido', regions: ['*'] },
    ], approx: [], reviewed: [] }, usda)
    expect(dup.errors.join('\n')).toMatch(/fdcId 1 repetido/)
    expect(dup.errors.join('\n')).toMatch(/Duplicado casi idéntico/)
  })

  it('mismos valores con nombres distintos no es un duplicado', () => {
    const oil = { kcal_100g: 884, protein_100g: 0, carbs_100g: 0, fat_100g: 100 }
    expect(findNearDuplicates([{ name: 'Aceite de oliva', name_norm: 'aceite de oliva', ...oil }, { name: 'Aceite de girasol', name_norm: 'aceite de girasol', ...oil }])).toEqual([])
  })
})

describe('toSeedSql', () => {
  const sql = toSeedSql({
    foods: [
      { name: "Pan d'agua", name_norm: 'pan d agua', kcal_100g: 270, protein_100g: 9, carbs_100g: 50, fat_100g: 3, fiber_100g: null, aliases: [], regions: ['VE'], prep_state: 'horneado', quality: 'usda', source_ref: 'USDA fdcId 5', replaces: ['pan canilla', 'pan d agua'] },
    ],
    portions: [{ name_norm: 'pan d agua', label: '1 rebanada', grams: 30, source: 'usda' }],
  }, ['cabecera'])

  it('es una transacción idempotente', () => {
    expect(sql).toMatch(/^-- cabecera/)
    expect(sql).toContain('BEGIN;')
    expect(sql).toContain('ON CONFLICT (name_norm, source) DO UPDATE SET')
    expect(sql.trim().split('\n').filter((l) => l && !l.startsWith('--')).pop()).toBe('COMMIT;')
  })

  it('escapa comillas y usa arrays vacíos válidos', () => {
    expect(sql).toContain("'Pan d''agua'")
    expect(sql).toContain("'{}'::text[]")
    expect(sql).toContain("ARRAY['VE']::text[]")
  })

  it('renombra el alimento antiguo y fusiona duplicados (sin incluirse a sí mismo)', () => {
    expect(sql).toContain("('pan canilla', 'Pan d''agua', 'pan d agua')")
    expect(sql).toContain("('pan canilla', 'pan d agua')")
    expect(sql).not.toContain("('pan d agua', 'pan d agua')")
    expect(sql).toContain('UPDATE public.meal_items')
  })

  it('regenera las porciones de los alimentos seed', () => {
    expect(sql).toContain("DELETE FROM public.food_portions")
    expect(sql).toContain("('pan d agua', '1 rebanada', 30, 'usda')")
  })
})

describe('parseCsvLine', () => {
  it('respeta comillas, comas y comillas escapadas', () => {
    expect(parseCsvLine('"1","Bread, white","say ""hi""",,"x"')).toEqual(['1', 'Bread, white', 'say "hi"', '', 'x'])
  })
})
