import { existsSync } from 'node:fs'
import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { $ } from 'bun'
import { dgfipBalanceUrl, parseDgfipBalance } from '../src/lib/parsers/dgfip'
import { parseDocumentBudgetaire } from '../src/lib/parsers/document-budgetaire'
import { parseM14Csv } from '../src/lib/parsers/m14-csv'
import { parseFunctionLabels } from '../src/lib/parsers/plan-de-compte'
import { decodeLatin1 } from '../src/lib/parsers/xml'
import { SOURCES, VILLE_SIREN, VILLE_SIRET } from '../src/lib/sources'
import type { ControlTotal, Dataset, ExpenseLine } from '../src/lib/types'
import { allNatures } from '../src/metrics'

const RAW_DIR = 'data/raw'
const OUTPUT = 'src/data/comptes.json'
const FIRST_DGFIP_YEAR = 2010
const refresh = process.argv.includes('--refresh')

const log = (message: string, fields: Record<string, unknown> = {}) =>
  console.log(`[data] ${message}`, Object.keys(fields).length ? JSON.stringify(fields) : '')

async function download(url: string, file: string): Promise<string> {
  const path = join(RAW_DIR, file)
  if (!refresh && existsSync(path)) {
    log('cache hit', { file })
    return path
  }
  log('downloading', { url })
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`)
  await Bun.write(path, response)
  return path
}

const readLatin1 = async (path: string) => decodeLatin1(await Bun.file(path).arrayBuffer())

async function cityLines(natures: ReadonlySet<string>) {
  const archive = await download(SOURCES.caArchives.url, 'ca-archives.zip')
  const extracted = join(RAW_DIR, 'ca')
  await $`unzip -oq ${archive} -d ${extracted}`
  const files = (await readdir(extracted)).sort()

  const csvFile = files.find((file) => file.endsWith('.csv'))
  if (!csvFile) throw new Error('CSV M14 introuvable dans l’archive')
  const m14 = parseM14Csv(
    await readLatin1(join(extracted, csvFile)),
    natures,
    SOURCES.caArchives.id,
  )
  log('parsed M14 CSV', { file: csvFile, lines: m14.lines.length })

  const lines: ExpenseLine[] = [...m14.lines]
  for (const file of files.filter((name) => name.endsWith('.xml'))) {
    const parsed = parseDocumentBudgetaire(
      await readLatin1(join(extracted, file)),
      natures,
      SOURCES.caArchives.id,
    )
    log('parsed CA XML', { file, lines: parsed.length })
    lines.push(...parsed)
  }

  const cfu = await download(SOURCES.cfu2025.url, 'cfu-2025.xml')
  const cfuLines = parseDocumentBudgetaire(await readLatin1(cfu), natures, SOURCES.cfu2025.id)
  log('parsed CFU', { lines: cfuLines.length })
  lines.push(...cfuLines)

  return { lines, m14Labels: m14.functionLabels }
}

async function dgfipControls(natures: string[]): Promise<ControlTotal[]> {
  const controls: ControlTotal[] = []
  for (let year = FIRST_DGFIP_YEAR; year <= new Date().getFullYear(); year++) {
    const response = await fetch(dgfipBalanceUrl(year, VILLE_SIREN, natures))
    if (response.status === 404) {
      log('no DGFiP balance yet', { year })
      continue
    }
    if (!response.ok) throw new Error(`DGFiP ${year} -> HTTP ${response.status}`)
    const totals = parseDgfipBalance(await response.json(), year, VILLE_SIRET)
    log('DGFiP balance', { year, accounts: totals.length })
    controls.push(...totals)
  }
  return controls
}

const pick = (labels: Record<string, string>, codes: Set<string>) =>
  Object.fromEntries(Object.entries(labels).filter(([code]) => codes.has(code)))

async function main() {
  await mkdir(RAW_DIR, { recursive: true })
  const natures = allNatures()
  const { lines, m14Labels } = await cityLines(new Set(natures))

  const plan = await download(SOURCES.planDeCompteM57.url, 'm57-plan-de-compte.xml')
  const m57Labels = parseFunctionLabels(await readLatin1(plan))
  const controls = await dgfipControls(natures)

  const codesOf = (nomenclature: 'M14' | 'M57') =>
    new Set(lines.filter((l) => l.nomenclature === nomenclature).map((l) => l.functionCode))

  const dataset: Dataset = {
    generatedAt: new Date().toISOString(),
    lines: lines.sort((a, b) => a.year - b.year || a.functionCode.localeCompare(b.functionCode)),
    controls: controls.sort((a, b) => a.year - b.year),
    functionLabels: { M14: pick(m14Labels, codesOf('M14')), M57: pick(m57Labels, codesOf('M57')) },
    sources: Object.values(SOURCES),
  }
  await Bun.write(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`)
  log('dataset written', { output: OUTPUT, lines: lines.length, controls: controls.length })
}

await main()
