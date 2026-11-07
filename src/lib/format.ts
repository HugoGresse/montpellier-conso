const euros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const compactEuros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const percent = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})

export const formatEuros = (value: number) => euros.format(value)
export const formatCompactEuros = (value: number) => compactEuros.format(value)
export const formatChange = (ratio: number) => percent.format(ratio)

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' })
}
