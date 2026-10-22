/**
 * Catálogo de la base de alimentos internacional (scripts/food-catalog.json):
 * integridad, alias regionales obligatorios y búsqueda sobre el catálogo real.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import catalog from '../../scripts/food-catalog.json'
import { normalize, expandRegions, parseSeedNames, PREP_STATES, REGIONS } from '../../scripts/lib/foods.mjs'
import { normalizeFoodName } from '@/lib/mealMath'
import { matchesQuery, rankFoodMatches } from '@/lib/foodSearch'

interface Entry { name: string; prep: string; regions: string[]; aliases?: string[]; replaces?: string[]; fdc?: number }
const usdaEntries = catalog.usda as Entry[]
const otherEntries = [...catalog.approx, ...catalog.reviewed] as Entry[]
const entries: Entry[] = [...usdaEntries, ...otherEntries]

// "Base de datos" de prueba: el catálogo tal cual llegará a public.foods.
const rows = entries.map((e) => ({
  name: e.name,
  name_norm: normalize(e.name),
  aliases: (e.aliases ?? []).map(normalize),
  quality: usdaEntries.includes(e) ? 'usda' : (catalog.reviewed as Entry[]).includes(e) ? 'reviewed' : 'approx',
}))

function search(term: string, limit = 20) {
  const q = normalizeFoodName(term)
  return rankFoodMatches(rows.filter((r) => matchesQuery(r, q)), q, limit).map((r) => r.name)
}

describe('catálogo: integridad', () => {
  it('normalize de los scripts coincide con normalizeFoodName de la app', () => {
    for (const s of ['Plátano Macho', 'Jugo (zumo) de naranja', 'Ñame', '  Café   con leche ', 'Pimiento/ají', 'Fríjol']) {
      expect(normalize(s)).toBe(normalizeFoodName(s))
    }
  })

  it('nombres únicos tras normalizar', () => {
    const names = rows.map((r) => r.name_norm)
    expect(new Set(names).size).toBe(names.length)
  })

  it('fdcId únicos', () => {
    const ids = usdaEntries.map((e) => e.fdc)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('alias ya normalizados, estado y regiones válidos', () => {
    for (const e of entries) {
      for (const a of e.aliases ?? []) expect(a, `${e.name}: alias "${a}"`).toBe(normalize(a))
      expect(PREP_STATES, e.name).toContain(e.prep)
      expect(expandRegions(e.regions).length, e.name).toBeGreaterThan(0)
      for (const r of e.regions) expect([...REGIONS, '*'], e.name).toContain(r)
    }
  })

  it('el nombre y prep_state coinciden: crudo se llama crudo y lo preparado nunca', () => {
    for (const e of entries) {
      const saysRaw = /\bcrud[oa]s?\b/.test(normalize(e.name))
      expect(saysRaw, `${e.name} (${e.prep})`).toBe(e.prep === 'crudo' && saysRaw)
    }
    // Cereales, legumbres, pastas, carnes y pescados crudos llevan "crudo" en el nombre.
    const staples = /^(arroz|quinoa|avena|pasta|cuscus|lentejas|garbanzos|frijoles|pechuga|pollo|carne|salmon|atun|tilapia|bacalao|camaron)/
    for (const e of entries.filter((x) => x.prep === 'crudo' && staples.test(normalize(x.name)))) {
      expect(normalize(e.name), e.name).toMatch(/\bcrud[oa]s?\b/)
    }
  })

  it('todo alimento del seed anterior sigue existiendo o lo reemplaza una fila nueva', () => {
    const sql = fs.readFileSync(path.join(__dirname, '../../sql/phase-tracker-seed.sql'), 'utf8')
    const old = parseSeedNames(sql)
    expect(old).toHaveLength(168)
    const covered = new Set(entries.flatMap((e) => [normalize(e.name), ...(e.replaces ?? []).map(normalize)]))
    expect(old.filter((n) => !covered.has(n))).toEqual([])
  })

  it('ningún alimento antiguo aparece en dos "replaces"', () => {
    const all = entries.flatMap((e) => e.replaces ?? [])
    expect(new Set(all).size).toBe(all.length)
  })

  it('el SQL generado está al día con el catálogo', () => {
    const seed = fs.readFileSync(path.join(__dirname, '../../sql/phase-foods-intl-seed.sql'), 'utf8')
    for (const r of rows) expect(seed, `falta "${r.name}": vuelve a ejecutar scripts/import-usda.mjs`).toContain(`'${r.name_norm}'`)
    const inserted = seed.split('INSERT INTO public.foods')[1].split('ON CONFLICT')[0].match(/^ {2}\('/gm) ?? []
    expect(inserted).toHaveLength(rows.length)
  })
})

describe('búsqueda internacional: alias regionales', () => {
  it.each([
    ['cambur', 'Banana (cambur, plátano)'],
    ['banana', 'Banana (cambur, plátano)'],
    ['guineo', 'Banana (cambur, plátano)'],
    ['plátano macho', 'Plátano macho verde, crudo'],
    ['plátano frito', 'Plátano macho maduro frito (tajadas)'],
    ['aguacate', 'Aguacate'],
    ['palta', 'Aguacate'],
    ['frijol', 'Frijoles negros (caraotas) cocidos'],
    ['fríjol', 'Frijoles negros (caraotas) cocidos'],
    ['caraota', 'Frijoles negros (caraotas) cocidos'],
    ['judía', 'Frijoles negros (caraotas) cocidos'],
    ['poroto', 'Frijoles negros (caraotas) cocidos'],
    ['habichuela', 'Frijoles negros (caraotas) cocidos'],
    ['papa', 'Papa (patata) cocida, sin piel'],
    ['patata', 'Papa (patata) cocida, sin piel'],
    ['jugo de naranja', 'Jugo (zumo) de naranja natural'],
    ['zumo de naranja', 'Jugo (zumo) de naranja natural'],
    ['durazno', 'Durazno (melocotón)'],
    ['melocotón', 'Durazno (melocotón)'],
    ['fresa', 'Fresas'],
    ['frutilla', 'Fresas'],
    ['maíz', 'Maíz dulce en granos, cocido'],
    ['elote', 'Maíz dulce en granos, cocido'],
    ['choclo', 'Maíz dulce en granos, cocido'],
    ['cacahuete', 'Maní (cacahuete) tostado'],
    ['maní', 'Maní (cacahuete) tostado'],
    ['calabacín', 'Calabacín (zucchini), crudo'],
    ['zapallito', 'Calabacín (zucchini), crudo'],
    ['zucchini', 'Calabacín (zucchini), crudo'],
    ['pimiento', 'Pimiento rojo, crudo'],
    ['ají', 'Pimiento rojo, crudo'],
    ['morrón', 'Pimiento rojo, crudo'],
    ['lechosa', 'Lechosa (papaya)'],
    ['papaya', 'Lechosa (papaya)'],
    ['patilla', 'Patilla (sandía)'],
    ['sandía', 'Patilla (sandía)'],
    ['mandioca', 'Yuca (mandioca) cocida'],
    ['chicken breast', 'Pechuga de pollo a la plancha, sin piel'],
    ['brown rice', 'Arroz integral cocido'],
    ['peanut butter', 'Mantequilla de maní (crema de cacahuete)'],
    ['oats', 'Avena en hojuelas, cruda'],
    ['greek yogurt', 'Yogur griego natural entero'],
    ['whey', 'Proteína de suero (whey) en polvo'],
  ])('"%s" → %s', (term, expected) => {
    expect(search(term)[0]).toBe(expected)
  })

  it('"plátano" sin contexto devuelve la fruta y el plátano macho, no uno solo', () => {
    const top = search('plátano', 6)
    expect(top[0]).toBe('Banana (cambur, plátano)')
    expect(top.some((n) => n.startsWith('Plátano macho'))).toBe(true)
  })

  it('el orden es estable: misma consulta, mismo resultado', () => {
    expect(search('plátano')).toEqual(search('platano'))
  })

  it('a igualdad, primero el dato de USDA y después la estimación', () => {
    const arepas = search('arepa')
    expect(arepas[0]).toBe('Arepa (restaurante)')
    expect(arepas).toContain('Arepa asada casera, sin relleno')
  })

  it('busca por varias palabras aunque no estén seguidas', () => {
    expect(search('pechuga pollo plancha')[0]).toBe('Pechuga de pollo a la plancha, sin piel')
  })
})
