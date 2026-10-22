// Lógica pura de la base de alimentos internacional (sin red ni disco).
// La usan scripts/import-usda.mjs, scripts/validate-foods.mjs y los tests de Vitest.

export const REGIONS = ['ES', 'EU', 'US', 'MX', 'VE', 'LATAM']
export const PREP_STATES = ['crudo', 'cocido', 'frito', 'horneado', 'a_la_plancha', 'envasado', 'bebida', 'otro']
export const QUALITIES = ['usda', 'off', 'bedca', 'approx', 'reviewed']

// Validación kcal ≈ 4·P + 4·C + 9·G: se marca si se desvía más de un 20 %
// y además más de 5 kcal (en alimentos casi sin calorías, como el café, el
// porcentaje no significa nada).
export const MAX_DEVIATION_PCT = 20
export const MIN_DEVIATION_KCAL = 5
export const MAX_PORTIONS_PER_FOOD = 5

// Igual que normalizeFoodName (src/lib/mealMath.ts): minúsculas, sin acentos,
// solo letras/números/espacios. Los tests comprueban que ambas coinciden.
export function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function expandRegions(regions) {
  const out = new Set()
  for (const r of regions ?? []) {
    if (r === '*') REGIONS.forEach((x) => out.add(x))
    else out.add(r)
  }
  return REGIONS.filter((r) => out.has(r))
}

const round = (n, d) => (n == null || !isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d)

export function atwaterKcal({ protein_100g, carbs_100g, fat_100g }) {
  return 4 * (protein_100g ?? 0) + 4 * (carbs_100g ?? 0) + 9 * (fat_100g ?? 0)
}

export function kcalDeviation(food) {
  const expected = atwaterKcal(food)
  const diff = expected - food.kcal_100g
  const pct = food.kcal_100g > 0 ? (diff / food.kcal_100g) * 100 : expected > 0 ? Infinity : 0
  return { expected: round(expected, 1), diffKcal: round(diff, 1), pct: round(pct, 1) }
}

export function failsValidation(food) {
  const { diffKcal, pct } = kcalDeviation(food)
  return Math.abs(pct) > MAX_DEVIATION_PCT && Math.abs(diffKcal) > MIN_DEVIATION_KCAL
}

// ── Porciones de USDA → etiqueta en español ─────────────────────────────────
const UNITS = {
  cup: ['taza', 'tazas'],
  tbsp: ['cucharada', 'cucharadas'],
  tablespoon: ['cucharada', 'cucharadas'],
  tsp: ['cucharadita', 'cucharaditas'],
  teaspoon: ['cucharadita', 'cucharaditas'],
  slice: ['rebanada', 'rebanadas'],
  piece: ['pieza', 'piezas'],
  fillet: ['filete', 'filetes'],
  breast: ['pechuga', 'pechugas'],
  thigh: ['muslo', 'muslos'],
  wing: ['ala', 'alas'],
  drumstick: ['muslito', 'muslitos'],
  tortilla: ['tortilla', 'tortillas'],
  bar: ['barrita', 'barritas'],
  cookie: ['galleta', 'galletas'],
  cracker: ['galleta', 'galletas'],
  scoop: ['cacito (scoop)', 'cacitos (scoop)'],
  patty: ['hamburguesa (carne)', 'hamburguesas (carne)'],
  can: ['lata', 'latas'],
  bottle: ['botella', 'botellas'],
  fruit: ['unidad', 'unidades'],
  ear: ['mazorca', 'mazorcas'],
  sandwich: ['unidad', 'unidades'],
  taco: ['taco', 'tacos'],
  burrito: ['burrito', 'burritos'],
  pancake: ['panqueque', 'panqueques'],
  waffle: ['waffle', 'waffles'],
  bagel: ['bagel', 'bagels'],
  croissant: ['croissant', 'croissants'],
  doughnut: ['dona', 'donas'],
  egg: ['huevo', 'huevos'],
  tamale: ['tamal', 'tamales'],
  pupusa: ['pupusa', 'pupusas'],
  quesadilla: ['quesadilla', 'quesadillas'],
  enchilada: ['enchilada', 'enchiladas'],
  empanada: ['empanada', 'empanadas'],
  date: ['dátil', 'dátiles'],
  almond: ['almendra', 'almendras'],
  olive: ['aceituna', 'aceitunas'],
  shrimp: ['camarón', 'camarones'],
  container: ['envase', 'envases'],
}
const SIZES = {
  'extra large': 'extra grande',
  jumbo: 'gigante',
  large: 'grande',
  medium: 'mediana',
  small: 'pequeña',
  'extra small': 'muy pequeña',
}
const QUALIFIERS = {
  chopped: 'picado', diced: 'en cubos', sliced: 'en rodajas', mashed: 'en puré',
  whole: 'entero', halves: 'en mitades', pieces: 'en trozos', shredded: 'rallado',
  cubes: 'en cubos', ground: 'molido', grated: 'rallado', cooked: 'cocido',
  'chopped or diced': 'picado',
}
const AMOUNTS = { 0.25: '1/4', 0.33: '1/3', 0.5: '1/2', 0.67: '2/3', 0.75: '3/4' }

function formatAmount(a) {
  if (Number.isInteger(a) && a >= 1 && a <= 10) return String(a)
  return AMOUNTS[round(a, 2)] ?? null
}

// p: { amount, unit (nombre de measure_unit), modifier, description, grams }
// Devuelve la etiqueta en español, o null si no sabemos traducirla con seguridad.
export function portionLabel(p, overrides = {}) {
  const modifier = String(p.modifier ?? '').trim()
  const amount = Number(p.amount) || 1
  if (overrides[modifier] && amount === 1) return overrides[modifier]

  const amt = formatAmount(amount)
  if (!amt) return null
  const plural = amount > 1

  // Foundation: la unidad viene en measure_unit; SR Legacy: en el modifier.
  let raw = p.unit && p.unit !== 'undetermined' ? `${p.unit}${modifier ? ', ' + modifier : ''}` : modifier
  raw = raw.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!raw) return null

  const [head, ...rest] = raw.split(',').map((x) => x.trim())
  const qualRaw = rest.join(', ')

  if (SIZES[head] && !qualRaw) return `${amt} ${plural ? 'unidades' : 'unidad'} ${SIZES[head]}${plural ? 's' : ''}`

  const unit = UNITS[head]
  if (!unit) return null
  let label = `${amt} ${unit[plural ? 1 : 0]}`
  if (qualRaw) {
    const q = QUALIFIERS[qualRaw]
    if (!q) return null
    label += ` (${q})`
  }
  return label
}

// ── Construcción de filas ───────────────────────────────────────────────────
function per100FromRecipe(recipe, yieldG, water, usda) {
  let total = 0
  const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  let fiberKnown = false
  const missing = []
  for (const [fdc, grams] of recipe) {
    const u = usda.get(Number(fdc))
    if (!u || u.kcal == null) { missing.push(fdc); continue }
    total += grams
    sum.kcal += (u.kcal * grams) / 100
    sum.protein += ((u.protein ?? 0) * grams) / 100
    sum.carbs += ((u.carbs ?? 0) * grams) / 100
    sum.fat += ((u.fat ?? 0) * grams) / 100
    if (u.fiber != null) { fiberKnown = true; sum.fiber += (u.fiber * grams) / 100 }
  }
  const finalWeight = yieldG ?? total + (water ?? 0)
  const k = 100 / finalWeight
  return {
    missing,
    values: {
      kcal: Math.round(sum.kcal * k),
      protein: round(sum.protein * k, 2),
      carbs: round(sum.carbs * k, 2),
      fat: round(sum.fat * k, 2),
      fiber: fiberKnown ? round(sum.fiber * k, 2) : null,
    },
  }
}

function baseRow(entry) {
  return {
    name: entry.name,
    name_norm: normalize(entry.name),
    aliases: [...new Set((entry.aliases ?? []).map(normalize).filter(Boolean))],
    regions: expandRegions(entry.regions),
    prep_state: entry.prep,
    replaces: (entry.replaces ?? []).map(normalize),
  }
}

// Devuelve { foods, portions, missing, excluded, errors }.
// usda: Map<fdcId, { fdcId, dataset, description, kcal, protein, carbs, fat, fiber, portions[] }>
export function buildFoods(catalog, usda) {
  const foods = []
  const portions = []
  const missing = []
  const excluded = []
  const errors = []

  const pushPortions = (row, list) => {
    const seen = new Set()
    for (const p of list) {
      if (seen.size >= MAX_PORTIONS_PER_FOOD) break
      if (!p.label || seen.has(p.label) || !(p.grams > 0 && p.grams <= 3000)) continue
      seen.add(p.label)
      portions.push({ name_norm: row.name_norm, label: p.label, grams: round(p.grams, 1), source: p.source })
    }
  }

  const accept = (row, note, portionList) => {
    if (failsValidation(row) && !note) {
      excluded.push({ name: row.name, ...kcalDeviation(row), kcal: row.kcal_100g })
      return
    }
    row.validation_note = failsValidation(row) ? note : null
    foods.push(row)
    pushPortions(row, portionList)
  }

  for (const e of catalog.usda ?? []) {
    const u = usda.get(Number(e.fdc))
    if (!u || u.kcal == null) { missing.push({ name: e.name, fdc: e.fdc }); continue }
    const row = {
      ...baseRow(e),
      kind: 'usda',
      quality: 'usda',
      source_ref: `USDA fdcId ${e.fdc}`,
      usda_description: u.description,
      kcal_100g: Math.round(u.kcal),
      protein_100g: round(u.protein, 2),
      carbs_100g: round(u.carbs, 2),
      fat_100g: round(u.fat, 2),
      fiber_100g: round(u.fiber, 2),
      basis: null,
    }
    // Primero las porciones propias y las etiquetas escritas a mano (plabels), luego el resto de USDA.
    const overrides = e.plabels ?? {}
    const fromUsda = (u.portions ?? []).map((p) => ({
      label: portionLabel(p, overrides), grams: p.grams, source: 'usda', manual: overrides[String(p.modifier ?? '').trim()] != null,
    }))
    const list = [
      ...(e.portions ?? []).map(([label, grams]) => ({ label, grams, source: 'custom' })),
      ...fromUsda.filter((p) => p.manual),
      ...fromUsda.filter((p) => !p.manual),
    ]
    accept(row, e.note, list)
  }

  for (const [kind, quality] of [['approx', 'approx'], ['reviewed', 'reviewed']]) {
    for (const e of catalog[kind] ?? []) {
      let v = e.values
      if (e.recipe) {
        const r = per100FromRecipe(e.recipe, e.yield, e.water, usda)
        if (r.missing.length) { errors.push(`${e.name}: ingredientes USDA no encontrados: ${r.missing.join(', ')}`); continue }
        v = r.values
      }
      if (!v) { errors.push(`${e.name}: sin 'values' ni 'recipe'`); continue }
      const row = {
        ...baseRow(e),
        kind,
        quality,
        source_ref: e.source_ref ?? (e.recipe ? `Receta con ingredientes USDA (fdcId ${e.recipe.map(([f]) => f).join(', ')})` : 'Estimación'),
        usda_description: null,
        kcal_100g: Math.round(v.kcal),
        protein_100g: round(v.protein, 2),
        carbs_100g: round(v.carbs, 2),
        fat_100g: round(v.fat, 2),
        fiber_100g: round(v.fiber ?? null, 2),
        basis: e.basis ?? null,
      }
      accept(row, e.validationNote, (e.portions ?? []).map(([label, grams]) => ({ label, grams, source: quality })))
    }
  }

  errors.push(...checkCatalog(catalog, foods))
  return { foods, portions, missing, excluded, errors }
}

// Errores de integridad: nombres repetidos, fdcId repetidos, valores fuera de rango,
// regiones/estados desconocidos y duplicados casi idénticos.
export function checkCatalog(catalog, foods) {
  const errors = []
  const fdcSeen = new Map()
  for (const e of catalog.usda ?? []) {
    if (fdcSeen.has(e.fdc)) errors.push(`fdcId ${e.fdc} repetido: "${fdcSeen.get(e.fdc)}" y "${e.name}"`)
    fdcSeen.set(e.fdc, e.name)
  }
  const names = new Map()
  for (const f of foods) {
    if (names.has(f.name_norm)) errors.push(`Nombre repetido tras normalizar: "${f.name}"`)
    names.set(f.name_norm, f)
    if (!PREP_STATES.includes(f.prep_state)) errors.push(`${f.name}: prep_state inválido (${f.prep_state})`)
    if (!f.regions.length) errors.push(`${f.name}: sin regiones`)
    if (!(f.kcal_100g >= 0 && f.kcal_100g <= 950)) errors.push(`${f.name}: kcal fuera de rango (${f.kcal_100g})`)
  }
  const owner = new Map()
  for (const f of foods) {
    for (const old of f.replaces) {
      if (owner.has(old)) errors.push(`"${old}" aparece en 'replaces' de "${owner.get(old)}" y de "${f.name}"`)
      owner.set(old, f.name)
      const other = names.get(old)
      if (other && other !== f) errors.push(`"${f.name}" reemplaza "${old}", que es el nombre de otra fila`)
    }
  }
  for (const [a, b] of findNearDuplicates(foods)) errors.push(`Duplicado casi idéntico: "${a}" y "${b}"`)
  return errors
}

// Pares con valores idénticos y nombres parecidos (índice de Jaccard de palabras ≥ 0,6).
// Así "Aceite de oliva" y "Aceite de girasol" (mismos valores) no cuentan como duplicado.
export function findNearDuplicates(foods) {
  const pairs = []
  const words = (s) => new Set(s.split(' ').filter((w) => w.length > 2))
  for (let i = 0; i < foods.length; i++) {
    for (let j = i + 1; j < foods.length; j++) {
      const a = foods[i], b = foods[j]
      const same = ['kcal_100g', 'protein_100g', 'carbs_100g', 'fat_100g'].every((k) => a[k] === b[k])
      if (!same) continue
      const wa = words(a.name_norm), wb = words(b.name_norm)
      const common = [...wa].filter((w) => wb.has(w)).length
      const union = new Set([...wa, ...wb]).size || 1
      if (common / union >= 0.6) pairs.push([a.name, b.name])
    }
  }
  return pairs
}

// name_norm de las filas del seed anterior (sql/phase-tracker-seed.sql).
export function parseSeedNames(sql) {
  const out = []
  for (const m of sql.matchAll(/^\s*\('((?:[^']|'')*)',\s*'((?:[^']|'')*)',/gm)) out.push(m[2].replace(/''/g, "'"))
  return out
}

// ── SQL ─────────────────────────────────────────────────────────────────────
const q = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`)
const n = (x) => (x == null ? 'NULL' : String(x))
const arr = (xs) => (xs.length ? `ARRAY[${xs.map(q).join(', ')}]::text[]` : `'{}'::text[]`)

export function toSeedSql({ foods, portions }, header) {
  const renames = []
  const merges = []
  for (const f of foods) {
    const olds = f.replaces.filter((o) => o !== f.name_norm)
    if (olds.length) renames.push([olds[0], f.name, f.name_norm])
    for (const o of olds) merges.push([o, f.name_norm])
  }

  const L = []
  L.push(...header.map((h) => `-- ${h}`.trimEnd()), '')
  L.push('BEGIN;', '')

  if (renames.length) {
    L.push('-- 1) Alimentos del seed anterior que pasan a tener otro nombre: se renombran')
    L.push('--    (conservan su id, así las comidas ya registradas siguen apuntando a ellos).')
    L.push('UPDATE public.foods AS f SET name = v.name, name_norm = v.name_norm')
    L.push('FROM (VALUES')
    L.push(renames.map(([o, nm, nn]) => `  (${q(o)}, ${q(nm)}, ${q(nn)})`).join(',\n'))
    L.push(') AS v(old_norm, name, name_norm)')
    L.push("WHERE f.source = 'seed' AND f.name_norm = v.old_norm")
    L.push("  AND NOT EXISTS (SELECT 1 FROM public.foods g WHERE g.source = 'seed' AND g.name_norm = v.name_norm);", '')
  }

  L.push(`-- 2) Alta o actualización de los ${foods.length} alimentos (valores por 100 g de porción comestible).`)
  L.push('INSERT INTO public.foods')
  L.push('  (name, name_norm, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, aliases, regions, prep_state, quality, source_ref, source)')
  L.push('VALUES')
  L.push(foods.map((f) => `  (${[
    q(f.name), q(f.name_norm), n(f.kcal_100g), n(f.protein_100g), n(f.carbs_100g), n(f.fat_100g), n(f.fiber_100g),
    arr(f.aliases), arr(f.regions), q(f.prep_state), q(f.quality), q(f.source_ref), "'seed'",
  ].join(', ')})`).join(',\n'))
  L.push('ON CONFLICT (name_norm, source) DO UPDATE SET')
  L.push('  name = EXCLUDED.name, kcal_100g = EXCLUDED.kcal_100g, protein_100g = EXCLUDED.protein_100g,')
  L.push('  carbs_100g = EXCLUDED.carbs_100g, fat_100g = EXCLUDED.fat_100g, fiber_100g = EXCLUDED.fiber_100g,')
  L.push('  aliases = EXCLUDED.aliases, regions = EXCLUDED.regions, prep_state = EXCLUDED.prep_state,')
  L.push('  quality = EXCLUDED.quality, source_ref = EXCLUDED.source_ref;', '')

  if (merges.length) {
    const values = merges.map(([o, nn]) => `  (${q(o)}, ${q(nn)})`).join(',\n')
    L.push('-- 3) Duplicados del seed anterior que siguen existiendo: sus comidas registradas pasan')
    L.push('--    al alimento nuevo y la fila antigua se elimina.')
    L.push('UPDATE public.meal_items AS mi SET food_id = n.id')
    L.push(`FROM (VALUES\n${values}\n) AS m(old_norm, name_norm), public.foods AS o, public.foods AS n`)
    L.push("WHERE o.source = 'seed' AND o.name_norm = m.old_norm")
    L.push("  AND n.source = 'seed' AND n.name_norm = m.name_norm")
    L.push('  AND mi.food_id = o.id AND o.id <> n.id;')
    L.push('DELETE FROM public.foods AS o')
    L.push(`USING (VALUES\n${values}\n) AS m(old_norm, name_norm)`)
    L.push("WHERE o.source = 'seed' AND o.name_norm = m.old_norm;", '')
  }

  L.push(`-- 4) Porciones caseras (${portions.length}). Se regeneran por completo para los alimentos 'seed'.`)
  L.push('DELETE FROM public.food_portions AS p USING public.foods AS f')
  L.push("WHERE p.food_id = f.id AND f.source = 'seed';")
  if (portions.length) {
    L.push('INSERT INTO public.food_portions (food_id, label, grams, source)')
    L.push('SELECT f.id, v.label, v.grams, v.source')
    L.push('FROM (VALUES')
    L.push(portions.map((p) => `  (${q(p.name_norm)}, ${q(p.label)}, ${n(p.grams)}, ${q(p.source)})`).join(',\n'))
    L.push(') AS v(name_norm, label, grams, source)')
    L.push("JOIN public.foods AS f ON f.source = 'seed' AND f.name_norm = v.name_norm;")
  }
  L.push('', 'COMMIT;', '')
  L.push('-- Verificar:')
  L.push(`-- SELECT quality, count(*) FROM public.foods WHERE source = 'seed' GROUP BY quality;  -- ${summarizeQuality(foods)}`)
  L.push(`-- SELECT count(*) FROM public.foods WHERE source = 'seed';                             -- ${foods.length}`)
  L.push(`-- SELECT count(*) FROM public.food_portions;                                            -- ${portions.length}`)
  L.push("-- SELECT name FROM public.foods WHERE source = 'seed' AND prep_state IS NULL;            -- 0 filas")
  return L.join('\n') + '\n'
}

export function countBy(foods, key) {
  const out = {}
  for (const f of foods) for (const k of [].concat(f[key])) out[k] = (out[k] ?? 0) + 1
  return out
}

function summarizeQuality(foods) {
  return Object.entries(countBy(foods, 'quality')).map(([k, v]) => `${k} ${v}`).join(', ')
}
