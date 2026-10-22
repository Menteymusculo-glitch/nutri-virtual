// Lectura de los CSV oficiales de USDA FoodData Central (SR Legacy y Foundation).
// Descárgalos de https://fdc.nal.usda.gov/download-datasets (licencia CC0) y
// descomprímelos en una carpeta fuera del repositorio.
import fs from 'node:fs'
import path from 'node:path'

const NUTRIENTS = { energy: '1008', energyAtwaterSpecific: '2048', energyAtwaterGeneral: '2047', protein: '1003', fat: '1004', carbs: '1005', fiber: '1079' }
const DATA_TYPES = new Set(['sr_legacy_food', 'foundation_food'])

// Parser CSV por líneas (los CSV de USDA no tienen saltos de línea dentro de un campo).
export function parseCsvLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

function* readCsv(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const header = parseCsvLine(lines[0].replace(/^﻿/, ''))
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue
    const cells = parseCsvLine(lines[i])
    const row = {}
    header.forEach((h, j) => { row[h] = cells[j] })
    yield row
  }
}

// Las carpetas descomprimidas suelen tener otra carpeta con el mismo nombre dentro.
function resolveDataDir(dir) {
  if (fs.existsSync(path.join(dir, 'food.csv'))) return dir
  const inner = path.join(dir, path.basename(dir))
  if (fs.existsSync(path.join(inner, 'food.csv'))) return inner
  throw new Error(`No encuentro food.csv en ${dir}`)
}

// Busca dentro de baseDir las carpetas de SR Legacy y Foundation (la más reciente).
export function findDatasets(baseDir) {
  const entries = fs.readdirSync(baseDir).filter((d) => fs.statSync(path.join(baseDir, d)).isDirectory())
  const pick = (re) => entries.filter((d) => re.test(d)).sort().pop()
  const sr = pick(/sr_legacy_food_csv/)
  const fd = pick(/foundation_food_csv/)
  if (!sr) throw new Error(`No encuentro la carpeta de SR Legacy en ${baseDir}`)
  return [
    { name: sr, dir: resolveDataDir(path.join(baseDir, sr)) },
    ...(fd ? [{ name: fd, dir: resolveDataDir(path.join(baseDir, fd)) }] : []),
  ]
}

const num = (s) => (s === undefined || s === '' ? null : Number(s))

// Devuelve Map<fdcId, { fdcId, dataset, description, kcal, protein, carbs, fat, fiber, portions[] }>
// solo para los fdcId pedidos.
export function loadUsda(datasets, wantedIds) {
  const wanted = new Set([...wantedIds].map(String))
  const out = new Map()
  for (const ds of datasets) {
    const units = new Map()
    for (const r of readCsv(path.join(ds.dir, 'measure_unit.csv'))) units.set(r.id, r.name)

    for (const r of readCsv(path.join(ds.dir, 'food.csv'))) {
      if (!wanted.has(r.fdc_id) || !DATA_TYPES.has(r.data_type)) continue
      out.set(Number(r.fdc_id), { fdcId: Number(r.fdc_id), dataset: ds.name, description: r.description, nutrients: {}, portions: [] })
    }
    for (const r of readCsv(path.join(ds.dir, 'food_nutrient.csv'))) {
      const f = out.get(Number(r.fdc_id))
      if (f && f.dataset === ds.name) f.nutrients[r.nutrient_id] = num(r.amount)
    }
    for (const r of readCsv(path.join(ds.dir, 'food_portion.csv'))) {
      const f = out.get(Number(r.fdc_id))
      if (!f || f.dataset !== ds.name) continue
      const grams = num(r.gram_weight)
      if (!grams) continue
      f.portions.push({
        seq: num(r.seq_num) ?? 0,
        amount: num(r.amount) ?? 1,
        unit: units.get(r.measure_unit_id) ?? null,
        modifier: r.modifier ?? '',
        description: r.portion_description ?? '',
        grams,
      })
    }
  }
  for (const f of out.values()) {
    const v = f.nutrients
    f.kcal = v[NUTRIENTS.energy] ?? v[NUTRIENTS.energyAtwaterSpecific] ?? v[NUTRIENTS.energyAtwaterGeneral] ?? null
    f.protein = v[NUTRIENTS.protein] ?? null
    f.carbs = v[NUTRIENTS.carbs] ?? null
    f.fat = v[NUTRIENTS.fat] ?? null
    f.fiber = v[NUTRIENTS.fiber] ?? null
    f.portions.sort((a, b) => a.seq - b.seq)
    delete f.nutrients
  }
  return out
}

// Todos los fdcId que necesita el catálogo (filas USDA + ingredientes de recetas).
export function catalogFdcIds(catalog) {
  const ids = new Set((catalog.usda ?? []).map((e) => Number(e.fdc)))
  for (const kind of ['approx', 'reviewed']) {
    for (const e of catalog[kind] ?? []) for (const [fdc] of e.recipe ?? []) ids.add(Number(fdc))
  }
  return ids
}

export function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') ? true : argv[++i] ?? true
  }
  return args
}
