import { XMLParser } from 'fast-xml-parser'

export type XmlNode = Record<string, unknown>

export function parseXml(xml: string, arrayTags: readonly string[]): XmlNode {
  const arrays = new Set(arrayTags)
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    removeNSPrefix: true,
    parseAttributeValue: false,
    isArray: (name) => arrays.has(name),
  })
  return parser.parse(xml) as XmlNode
}

export function attr(node: unknown, key: string, attribute = 'V'): string | undefined {
  const child = (node as XmlNode | undefined)?.[key]
  const value = (child as XmlNode | undefined)?.[attribute]
  return typeof value === 'string' ? value : undefined
}

export function* findAll(node: unknown, tag: string, nested = false): Generator<XmlNode> {
  if (Array.isArray(node)) {
    for (const item of node) yield* findAll(item, tag, nested)
    return
  }
  if (!node || typeof node !== 'object') return
  for (const [key, value] of Object.entries(node)) {
    if (key !== tag) {
      yield* findAll(value, tag, nested)
      continue
    }
    for (const item of Array.isArray(value) ? value : [value]) {
      yield item as XmlNode
      if (nested) yield* findAll(item, tag, nested)
    }
  }
}

export function decodeLatin1(bytes: ArrayBuffer | Uint8Array): string {
  return new TextDecoder('windows-1252').decode(bytes)
}
