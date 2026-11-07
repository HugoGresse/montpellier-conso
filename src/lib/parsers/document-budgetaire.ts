import { normalizeM57Function } from '../function-code'
import type { ExpenseLine, Nomenclature } from '../types'
import { attr, findAll, parseXml, type XmlNode } from './xml'

const REAL_OPERATION = '0'

function nomenclatureOf(budget: XmlNode): Nomenclature {
  return attr(budget.EnTeteBudget, 'Nomenclature')?.startsWith('M57') ? 'M57' : 'M14'
}

function budgetLines(budget: XmlNode): XmlNode[] {
  const lines = budget.LigneBudget
  return Array.isArray(lines) ? (lines as XmlNode[]) : []
}

export function parseDocumentBudgetaire(
  xml: string,
  natures: ReadonlySet<string>,
  sourceId: string,
): ExpenseLine[] {
  const document = parseXml(xml, ['Budget', 'LigneBudget'])
  const lines: ExpenseLine[] = []

  for (const budget of findAll(document, 'Budget')) {
    const budgetLineNodes = budgetLines(budget)
    if (budgetLineNodes.length === 0) continue
    const year = Number(attr(budget.BlocBudget, 'Exer'))
    if (!Number.isInteger(year)) throw new Error(`Exercice introuvable dans ${sourceId}`)
    const nomenclature = nomenclatureOf(budget)

    for (const line of budgetLineNodes) {
      const nature = attr(line, 'Nature')
      if (!nature || !natures.has(nature)) continue
      if (attr(line, 'CodRD') !== 'D' || attr(line, 'OpBudg') !== REAL_OPERATION) continue

      const rawFunction = attr(line, 'Fonction') ?? ''
      lines.push({
        year,
        nomenclature,
        nature,
        functionCode:
          nomenclature === 'M57'
            ? normalizeM57Function(rawFunction, attr(line, 'ContFon'))
            : rawFunction,
        amount: Number(attr(line, 'MtReal') ?? '0'),
        sourceId,
      })
    }
  }
  return lines
}
