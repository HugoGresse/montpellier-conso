const FUNCTIONAL_CHAPTER = /^9\d\d$/

export function normalizeM57Function(code: string, chapter: string | undefined): string {
  if (!chapter || !FUNCTIONAL_CHAPTER.test(chapter) || code === chapter) return code
  const prefix = chapter.slice(0, 2)
  return code.length > 3 && code.startsWith(prefix) ? code.slice(prefix.length) : code
}
