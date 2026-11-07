import type { SourceDescription } from './types'

export const VILLE_SIREN = '213401722'
export const VILLE_SIRET = '21340172201787'

const PORTAL = 'https://data.montpellier3m.fr/sites/default/files/ressources'
const ODBL = 'ODbL'

export const SOURCES = {
  caArchives: {
    id: 'mtp-ca-archives',
    title: 'Comptes administratifs de Montpellier (2005-2016 en CSV, 2018-2024 en XML)',
    producer: 'Ville de Montpellier, via data.montpellier3m.fr',
    url: `${PORTAL}/VilleMTP_MTP_CA_Archives.zip`,
    licence: ODBL,
  },
  cfu2025: {
    id: 'mtp-cfu-2025',
    title: 'Compte financier unique 2025 de la Ville de Montpellier',
    producer: 'Ville de Montpellier, via data.montpellier3m.fr',
    url: `${PORTAL}/VilleMTP_MTP_CFU_2025.xml`,
    licence: ODBL,
  },
  planDeCompteM57: {
    id: 'm57-plan-de-compte',
    title: 'Plan de comptes M57 (libellés des fonctions)',
    producer: 'DGFiP, via odm-budgetaire.org',
    url: 'http://odm-budgetaire.org/composants/normes/2024/M57/M57_D/planDeCompte.xml',
    licence: 'Licence Ouverte',
  },
  dgfipBalances: {
    id: 'dgfip-balances',
    title: 'Balances comptables des communes (contrôle des totaux, et 2017)',
    producer: 'DGFiP, via data.economie.gouv.fr',
    url: 'https://data.economie.gouv.fr/explore/?q=balances-comptables-des-communes',
    licence: 'Licence Ouverte',
  },
} as const satisfies Record<string, SourceDescription>

export const SOURCE_PAGES = {
  comptesAdministratifs:
    'https://data.montpellier3m.fr/dataset/comptes-administratifs-de-montpellier',
} as const
