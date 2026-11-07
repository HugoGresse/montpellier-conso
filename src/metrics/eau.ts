import type { Metric } from '../lib/types'

export const eau: Metric = {
  slug: 'eau',
  title: "Ce que la Ville de Montpellier paie pour l'eau",
  shortTitle: 'Eau',
  summary:
    "Factures d'eau et d'assainissement payées par la Ville pour ses bâtiments, parcs, cimetières et équipements, année par année depuis 2005.",
  chartCaption: "Dépenses d'eau et d'assainissement par service (euros courants)",
  natures: ['60611'],
  natureLabel: 'Compte 60611 « Eau et assainissement »',
  groups: [
    {
      id: 'administration',
      label: 'Administration générale et services communs',
      functions: { M14: ['20', '30'], M57: ['020'] },
    },
    {
      id: 'espaces-verts',
      label: 'Espaces verts urbains',
      functions: { M14: ['823'], M57: ['511'] },
    },
    {
      id: 'sports',
      label: 'Équipements sportifs',
      functions: { M14: ['412'], M57: ['325'] },
    },
    {
      id: 'cimetieres',
      label: 'Cimetières',
      functions: { M14: ['26'], M57: ['025'] },
    },
    {
      id: 'proprete',
      label: 'Propreté urbaine',
      functions: { M14: ['813'], M57: ['7222'] },
    },
  ],
  notes: [
    {
      title: 'Des euros, pas des mètres cubes',
      body: "Les comptes publiés donnent le montant payé, pas le volume consommé. Le montant comprend l'eau et l'assainissement facturés par la Régie des eaux de la Métropole. Pour obtenir les volumes par bâtiment, une demande d'accès aux documents est proposée plus bas.",
    },
    {
      title: '2005-2007 : des montants bien plus faibles',
      body: "Les dépenses passent de 82 000 € en 2007 à 1,4 M€ en 2008. Rien dans les fichiers n'explique cette rupture : probable changement d'imputation comptable ou de mode de facturation. La question figure dans la demande d'accès aux documents.",
    },
    {
      title: '2017 : total seul',
      body: "L'exercice 2017 manque dans les fichiers de la Ville. Le total vient de la balance comptable publiée par la DGFiP ; il n'est pas ventilé par service.",
    },
    {
      title: '2018 : changement de nomenclature',
      body: "La Ville passe de la nomenclature M14 à la M57 en 2018. Les codes de fonction changent ; les regroupements de ce graphique font la correspondance (par exemple 823 « Espaces verts urbains » en M14 devient 511 en M57). La même année, le total baisse d'environ 360 000 € et la part des espaces verts chute nettement ; les fichiers ne disent pas s'il s'agit d'un transfert à la Métropole ou d'un changement d'imputation.",
    },
    {
      title: 'Totaux vérifiés',
      body: 'Pour chaque année de 2010 à 2025 (sauf 2017), le total calculé depuis les fichiers de la Ville est comparé à la balance comptable de la DGFiP. Ils sont identiques au centime.',
    },
    {
      title: 'Euros courants',
      body: "Les montants ne sont pas corrigés de l'inflation ni de l'évolution du prix de l'eau.",
    },
  ],
}
