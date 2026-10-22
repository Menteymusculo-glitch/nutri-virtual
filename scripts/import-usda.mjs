#!/usr/bin/env node
// Genera sql/phase-foods-intl-seed.sql desde los CSV oficiales de USDA y
// scripts/food-catalog.json. No se ejecuta en producción.
//
//   node scripts/import-usda.mjs --usda <carpeta con los CSV descomprimidos>
//
// También escribe docs/informe-base-alimentos.md y docs/alimentos-a-revisar.md.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildFoods, countBy, kcalDeviation, parseSeedNames, toSeedSql, REGIONS } from './lib/foods.mjs'
import { catalogFdcIds, findDatasets, loadUsda, parseArgs } from './lib/usda.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = parseArgs(process.argv.slice(2))
if (!args.usda) {
  console.error('Uso: node scripts/import-usda.mjs --usda <carpeta con los CSV de USDA descomprimidos>')
  process.exit(1)
}

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'scripts/food-catalog.json'), 'utf8'))
const datasets = findDatasets(path.resolve(args.usda))
const usda = loadUsda(datasets, catalogFdcIds(catalog))
const result = buildFoods(catalog, usda)

// Todo alimento del seed anterior debe seguir existiendo o estar en 'replaces' de una fila nueva.
const oldNames = parseSeedNames(fs.readFileSync(path.join(root, 'sql/phase-tracker-seed.sql'), 'utf8'))
const covered = new Set(result.foods.flatMap((f) => [f.name_norm, ...f.replaces]))
for (const old of oldNames) if (!covered.has(old)) result.errors.push(`El alimento "${old}" del seed anterior no está cubierto`)

if (result.errors.length || result.missing.length) {
  for (const e of result.errors) console.error(`ERROR: ${e}`)
  for (const m of result.missing) console.error(`ERROR: fdcId ${m.fdc} ("${m.name}") no está en los CSV de USDA`)
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const sources = datasets.map((d) => d.name).join(', ')
const sql = toSeedSql(result, [
  '============================================================',
  'Fase 1b — Base de alimentos internacional (idempotente)',
  'GENERADO por scripts/import-usda.mjs a partir de scripts/food-catalog.json.',
  'No lo edites a mano: cambia el catálogo y vuelve a generarlo.',
  `Fuente: USDA FoodData Central (${sources}), dominio público (CC0 1.0).`,
  'Ejecutar DESPUÉS de sql/phase-foods-intl.sql.',
  '============================================================',
])
fs.writeFileSync(path.join(root, 'sql/phase-foods-intl-seed.sql'), sql)

// ── Informes ────────────────────────────────────────────────────────────────
const byRegion = countBy(result.foods, 'regions')
const byQuality = countBy(result.foods, 'quality')
const byPrep = countBy(result.foods, 'prep_state')
const fmt = (n) => String(n).replace('.', ',')
const pct = (d) => `${d.pct > 0 ? '+' : ''}${fmt(d.pct)} %`

const report = [
  '# Informe de la base de alimentos internacional',
  '',
  `Generado por \`scripts/import-usda.mjs\` el ${today}. No lo edites a mano.`,
  '',
  `Fuente de los valores: USDA FoodData Central (${sources}), dominio público (CC0 1.0).`,
  '',
  `**${result.foods.length} alimentos** y **${result.portions.length} porciones caseras**.`,
  '',
  '## Por región',
  '',
  'Un alimento puede contar en varias regiones.',
  '',
  '| Región | Alimentos |',
  '|---|---|',
  ...REGIONS.map((r) => `| ${r} | ${byRegion[r] ?? 0} |`),
  '',
  '## Por calidad del dato',
  '',
  '| quality | Alimentos | Qué significa |',
  '|---|---|---|',
  `| usda | ${byQuality.usda ?? 0} | Valor oficial de USDA, sin tocar |`,
  `| approx | ${byQuality.approx ?? 0} | Estimación (receta con ingredientes USDA o valor manual): pendiente de revisión |`,
  `| reviewed | ${byQuality.reviewed ?? 0} | Valor del FOOD_DB original de la app |`,
  '',
  '## Por estado de preparación',
  '',
  '| prep_state | Alimentos |',
  '|---|---|',
  ...Object.entries(byPrep).sort().map(([k, v]) => `| ${k} | ${v} |`),
  '',
  '## Lo que no se encontró en USDA',
  '',
  'Estos platos o productos no existen en SR Legacy ni en Foundation; quedan con `quality = \'approx\'`.',
  '',
  '| Alimento | Cómo se estimó |',
  '|---|---|',
  ...result.foods.filter((f) => f.kind !== 'usda').map((f) => `| ${f.name} | ${f.basis ?? ''} |`),
  '',
  '## Validación kcal ≈ 4·P + 4·C + 9·G',
  '',
  `Se marca una fila si se desvía más de un 20 % y más de 5 kcal. La kcal guardada es siempre la de la fuente.`,
  '',
  result.excluded.length
    ? ['Excluidas (desviación sin explicación):', '', '| Alimento | kcal fuente | kcal por macros | Desviación |', '|---|---|---|---|',
      ...result.excluded.map((e) => `| ${e.name} | ${e.kcal} | ${fmt(e.expected)} | ${pct(e)} |`)].join('\n')
    : 'Ninguna fila excluida.',
  '',
  'Con desviación explicada (se conservan):',
  '',
  '| Alimento | kcal fuente | kcal por macros | Desviación | Motivo |',
  '|---|---|---|---|---|',
  ...result.foods.filter((f) => f.validation_note).map((f) => {
    const d = kcalDeviation(f)
    return `| ${f.name} | ${f.kcal_100g} | ${fmt(d.expected)} | ${pct(d)} | ${f.validation_note} |`
  }),
  '',
  '## Correspondencia con USDA',
  '',
  'Para revisar que cada nombre en español describe el alimento correcto (y su estado crudo/cocido).',
  '',
  '| Nombre | Estado | fdcId | Descripción USDA |',
  '|---|---|---|---|',
  ...result.foods.filter((f) => f.kind === 'usda').map((f) => `| ${f.name} | ${f.prep_state} | ${f.source_ref.replace('USDA fdcId ', '')} | ${f.usda_description} |`),
  '',
]
fs.writeFileSync(path.join(root, 'docs/informe-base-alimentos.md'), report.join('\n'))

const review = [
  '# Alimentos a revisar',
  '',
  `Generado por \`scripts/import-usda.mjs\` el ${today}. Para cambiar un valor, edita \`scripts/food-catalog.json\` y vuelve a generar el seed.`,
  '',
  'En la app aparecen con la etiqueta **"estimación"**. Cuando Ray revise un valor, se puede cambiar su `quality` a `reviewed`.',
  '',
  '| Alimento | kcal | P | C | G | Origen | Cómo se estimó |',
  '|---|---|---|---|---|---|---|',
  ...result.foods.filter((f) => f.kind !== 'usda').map((f) =>
    `| ${f.name} | ${f.kcal_100g} | ${fmt(f.protein_100g)} | ${fmt(f.carbs_100g)} | ${fmt(f.fat_100g)} | ${f.quality} | ${f.basis ?? ''} |`),
  '',
]
fs.writeFileSync(path.join(root, 'docs/alimentos-a-revisar.md'), review.join('\n'))

console.log(`OK: ${result.foods.length} alimentos, ${result.portions.length} porciones.`)
console.log(`Calidad: ${Object.entries(byQuality).map(([k, v]) => `${k} ${v}`).join(', ')}`)
console.log(`Regiones: ${REGIONS.map((r) => `${r} ${byRegion[r] ?? 0}`).join(', ')}`)
if (result.excluded.length) console.log(`Excluidas por validación: ${result.excluded.map((e) => e.name).join(', ')}`)
