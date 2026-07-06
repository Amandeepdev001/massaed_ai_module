export type MarkdownBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

export function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.includes('-')) return false
  return /^\|?[\s|:-]+\|?$/.test(trimmed) && /-{3,}/.test(trimmed)
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|', 1)
}

export function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = content.split('\n')
  const paragraphBuffer: string[] = []

  const flushParagraph = () => {
    const text = paragraphBuffer.join('\n').trim()
    if (text) blocks.push({ kind: 'paragraph', text })
    paragraphBuffer.length = 0
  }

  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    const nextLine = lines[index + 1]

    if (isTableRow(line) && nextLine !== undefined && isTableSeparator(nextLine)) {
      flushParagraph()

      const headers = parseTableRow(line)
      index += 2

      const rows: string[][] = []
      while (index < lines.length && isTableRow(lines[index]) && !isTableSeparator(lines[index])) {
        rows.push(parseTableRow(lines[index]))
        index += 1
      }

      blocks.push({ kind: 'table', headers, rows })
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      index += 1
      continue
    }

    paragraphBuffer.push(line)
    index += 1
  }

  flushParagraph()
  return blocks
}
