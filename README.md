# Montpellier, la mairie au compteur

Ce que consomme et dépense la Ville de Montpellier, à partir de ses comptes publiés en open data.

Site : <https://hugogresse.github.io/montpellier-conso/>

Première métrique : **l'eau** (compte 60611 « Eau et assainissement », budget principal),
de 2005 à 2025, ventilée par service. Le site contient aussi un
[modèle de demande d'accès aux documents](docs/demande-cada.md) pour obtenir les volumes par
bâtiment.

## Données

| Années | Source | Détail |
| --- | --- | --- |
| 2005-2016 | [Comptes administratifs de Montpellier](https://data.montpellier3m.fr/dataset/comptes-administratifs-de-montpellier), CSV M14 | par fonction |
| 2017 | [Balances comptables des communes](https://data.economie.gouv.fr/explore/?q=balances-comptables-des-communes) (DGFiP) | total seul |
| 2018-2024 | Comptes administratifs, XML « document budgétaire » M57 | par fonction |
| 2025 | Compte financier unique, XML | par fonction |

Chaque total annuel (2010-2025, hors 2017) est comparé à la balance DGFiP : ils sont identiques
au centime. Les libellés des fonctions M57 viennent du plan de comptes publié sur
odm-budgetaire.org.

`src/data/comptes.json` contient les lignes brutes extraites (année, nomenclature, compte, code de
fonction, montant, source) et les totaux de contrôle. Les regroupements par service et le graphique
sont calculés au build.

## Développement

```bash
bun install
```

```bash
bun run dev
```

Regénérer les données (télécharge les sources dans `data/raw/`, ignoré par git) :

```bash
bun run data -- --refresh
```

Vérifications :

```bash
bun test && bun run typecheck && bun run lint && bun run build
```

## Ajouter une métrique

1. Créer `src/metrics/<slug>.ts` sur le modèle de `src/metrics/eau.ts` : comptes (natures),
   regroupements de codes de fonction M14 et M57, notes de lecture.
2. L'ajouter à `METRICS` dans `src/metrics/index.ts`.
3. Lancer `bun run data` : le script extrait automatiquement les comptes de toutes les métriques.

La page `/<slug>/` est générée automatiquement.

## Déploiement

GitHub Pages, via `.github/workflows/pages.yaml` à chaque push sur `main`.

## Licence

Code sous licence MIT. Les données restent sous leur licence d'origine (ODbL pour le portail de
Montpellier Méditerranée Métropole, Licence Ouverte pour la DGFiP).
