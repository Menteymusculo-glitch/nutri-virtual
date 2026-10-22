#!/usr/bin/env node
// Lista los alimentos cuya kcal se desvía más de un 20 % de 4·P + 4·C + 9·G.
//
//   node scripts/validate-foods.mjs --usda <carpeta con los CSV de USDA descomprimidos>
//
// Excepciones esperables: bebidas alcohólicas (el alcohol aporta 7 kcal/g y no
// figura en los macros) y alimentos muy ricos en fibra. El resto se revisa a mano.
// Sale con código 1 si hay desviaciones sin explicación ('note' en el catálogo).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildFoods, failsValidation, kcalDeviation, MAX_DEVIATION_PCT } from './lib/foods.mjs'
import { catalogFdcIds, findDatasets, loadUsda, parseArgs } from './lib/usda.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = parseArgs(process.argv.slice(2))
if (!args.usda) {
  console.error('Uso: node scripts/validate-foods.mjs --usda <carpeta con los CSV de USDA descomprimidos>')
  process.exit(1)
}

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'scripts/food-catalog.json'), 'utf8'))
const usda = loadUsda(findDatasets(path.resolve(args.usda)), catalogFdcIds(catalog))
const { foods, excluded } = buildFoods(catalog, usda)

const explained = foods.filter(failsValidation)
console.log(`Desviación > ${MAX_DEVIATION_PCT} % (y > 5 kcal) entre la kcal de la fuente y 4·P + 4·C + 9·G\n`)
console.log('Con explicación (se conservan):')
for (const f of explained) {
  const d = kcalDeviation(f)
  console.log(`  ${f.name}: ${f.kcal_100g} kcal vs ${d.expected} (${d.pct} %) — ${f.validation_note}`)
}
if (!explained.length) console.log('  (ninguna)')
console.log('\nSin explicación (se excluyen del seed):')
for (const e of excluded) console.log(`  ${e.name}: ${e.kcal} kcal vs ${e.expected} (${e.pct} %)`)
if (!excluded.length) console.log('  (ninguna)')
process.exit(excluded.length ? 1 : 0)
