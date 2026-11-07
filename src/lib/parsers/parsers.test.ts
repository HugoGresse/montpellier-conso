import { describe, expect, test } from 'bun:test'
import { normalizeM57Function } from '../function-code'
import { isMainBudget, parseDgfipBalance } from './dgfip'
import { parseDocumentBudgetaire } from './document-budgetaire'
import { parseFrenchNumber, parseM14Csv } from './m14-csv'
import { parseFunctionLabels } from './plan-de-compte'
import { decodeLatin1 } from './xml'

const WATER = new Set(['60611'])

describe('normalizeM57Function', () => {
  test('strips the functional chapter prefix', () => {
    expect(normalizeM57Function('93020', '930')).toBe('020')
    expect(normalizeM57Function('937222', '937')).toBe('7222')
  })

  test('keeps codes that carry no chapter prefix', () => {
    expect(normalizeM57Function('940', '940')).toBe('940')
    expect(normalizeM57Function('511', undefined)).toBe('511')
    expect(normalizeM57Function('020', '930')).toBe('020')
  })
})

describe('parseM14Csv', () => {
  const csv = [
    'Collectivite;Budget;Exercice;I_F;D_R;Nature;SousFonction;Exécuté;Libellé nature;Libellé fonction',
    'VILLE;1;2005;F;D;60611;823;19960,04; EAU ET ASSAINISSSEMENT;ESPACES VERTS URBAINS',
    'VILLE;1;2005;F;D;60612;823;30290,84; ENERGIE ET ELECTRICITE;ESPACES VERTS URBAINS',
    'VILLE;1;2005;F;R;60611;20;12,00; EAU ET ASSAINISSSEMENT;ADMINISTRATION GENERALE',
    'VILLE;1;2006;F;D;60611;26;8599,45; EAU ET ASSAINISSSEMENT;CIMETIERES',
    '',
  ].join('\r\n')

  test('keeps only operating expenses on the requested accounts', () => {
    const { lines, functionLabels } = parseM14Csv(csv, WATER, 'test')
    expect(lines).toEqual([
      {
        year: 2005,
        nomenclature: 'M14',
        nature: '60611',
        functionCode: '823',
        amount: 19960.04,
        sourceId: 'test',
      },
      {
        year: 2006,
        nomenclature: 'M14',
        nature: '60611',
        functionCode: '26',
        amount: 8599.45,
        sourceId: 'test',
      },
    ])
    expect(functionLabels).toEqual({ '823': 'ESPACES VERTS URBAINS', '26': 'CIMETIERES' })
  })

  test('rejects a CSV without the expected columns', () => {
    expect(() => parseM14Csv('a;b\n1;2', WATER, 'test')).toThrow('Colonne manquante')
  })

  test('parses French decimals', () => {
    expect(parseFrenchNumber('1 234,5')).toBe(1234.5)
    expect(() => parseFrenchNumber('abc')).toThrow()
  })
})

describe('parseDocumentBudgetaire', () => {
  const line = (nature: string, fonction: string, codRD: string, opBudg: string, amount: string) =>
    `<LigneBudget><Nature V="${nature}"/><Fonction V="${fonction}"/><ContFon V="${fonction.slice(0, 3)}"/>` +
    `<CodRD V="${codRD}"/><MtReal V="${amount}"/><OpBudg V="${opBudg}"/></LigneBudget>`

  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<doccfu:CompteFinancierUnique xmlns:doccfu="urn:cfu" xmlns:ano="urn:ano">
  <DocumentBudgetaire xmlns="http://www.minefi.gouv.fr/cp/demat/docbudgetaire">
    <Budget>
      <EnTeteBudget><Nomenclature V="M57-M57_D"/></EnTeteBudget>
      <BlocBudget><Exer V="2025"/></BlocBudget>
      ${line('60611', '93020', 'D', '0', '612077.79')}
      ${line('60611', '937222', 'D', '0', '21700.00')}
      ${line('60611', '93020', 'D', '1', '99.00')}
      ${line('60611', '93020', 'R', '0', '5.00')}
      ${line('60612', '93020', 'D', '0', '1000.00')}
    </Budget>
  </DocumentBudgetaire>
  <ano:Budget><ano:Anomalie V="x"/></ano:Budget>
</doccfu:CompteFinancierUnique>`

  test('reads real expense lines and normalises M57 functions', () => {
    const lines = parseDocumentBudgetaire(xml, WATER, 'cfu')
    expect(lines.map(({ functionCode, amount }) => ({ functionCode, amount }))).toEqual([
      { functionCode: '020', amount: 612077.79 },
      { functionCode: '7222', amount: 21700 },
    ])
    expect(lines.every((l) => l.year === 2025 && l.nomenclature === 'M57')).toBe(true)
  })
})

describe('parseFunctionLabels', () => {
  test('collects nested function references', () => {
    const xml = `<Nomenclature><Fonction>
      <RefFonc Code="0" Libelle="Services généraux">
        <RefFonc Code="02" Libelle="Administration générale">
          <RefFonc Code="020" Libelle="Administration générale de la collectivité"/>
        </RefFonc>
      </RefFonc>
    </Fonction></Nomenclature>`
    expect(parseFunctionLabels(xml)).toEqual({
      '0': 'Services généraux',
      '02': 'Administration générale',
      '020': 'Administration générale de la collectivité',
    })
  })
})

describe('parseDgfipBalance', () => {
  const siret = '21340172201787'

  test('nets debit and credit on the main budget only', () => {
    const json = {
      results: [
        { compte: '60611', ident: siret, cbudg: 1, obnetdeb: 1003749.01, obnetcre: 28427.96 },
        { compte: '60611', ident: '21340172299999', cbudg: 2, obnetdeb: 500, obnetcre: 0 },
      ],
    }
    expect(parseDgfipBalance(json, 2025, siret)).toEqual([
      { year: 2025, nature: '60611', amount: 975321.05 },
    ])
  })

  test('recognises the main budget in older datasets', () => {
    expect(isMainBudget({ ident: '21340172200011', budget: 'BP' }, siret)).toBe(true)
    expect(isMainBudget({ ident: '21340172200011', budget: 'BA' }, siret)).toBe(false)
  })
})

describe('decodeLatin1', () => {
  test('decodes ISO-8859-1 accents', () => {
    expect(decodeLatin1(new Uint8Array([0x45, 0x78, 0xe9, 0x63]))).toBe('Exéc')
  })
})
