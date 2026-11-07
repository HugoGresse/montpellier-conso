import { findAll, parseXml } from './xml'

export function parseFunctionLabels(xml: string): Record<string, string> {
  const plan = parseXml(xml, ['RefFonc'])
  const labels: Record<string, string> = {}
  for (const ref of findAll(plan, 'RefFonc', true)) {
    if (typeof ref.Code === 'string' && typeof ref.Libelle === 'string') {
      labels[ref.Code] = ref.Libelle
    }
  }
  return labels
}
