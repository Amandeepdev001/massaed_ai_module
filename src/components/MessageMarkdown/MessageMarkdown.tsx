import { parseMarkdownBlocks } from '@/utils/parse-markdown-content'
import { formatDisplayValue } from '@/utils/format-display-value'
import styles from './MessageMarkdown.module.css'

export function MessageMarkdown({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className={styles['message-markdown']}>
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          return (
            <p key={index} className={styles['message-markdown__paragraph']}>
              {renderInlineMarkdown(block.text)}
            </p>
          )
        }

        const keepIndices = block.headers
          .map((_header, idx) => {
            const columnValues = block.rows.map((row) => row[idx] || '')
            const nonEmptyValues = columnValues.map((val) => val.trim()).filter(Boolean)

            if (nonEmptyValues.length > 0 && nonEmptyValues.every((val) => isDbId(val))) {
              return null
            }

            return idx
          })
          .filter((idx): idx is number => idx !== null)

        const filteredHeaders = keepIndices.map((idx) => block.headers[idx])
        const filteredRows = block.rows.map((row) => keepIndices.map((idx) => row[idx]))

        return (
          <div key={index} className={`${styles['message-markdown__table-wrap']} ${styles['table-scrollbar']}`}>
            <table className={styles['message-markdown__table']}>
              <thead>
                <tr>
                  <th className={styles['message-markdown__index-col']} scope="col">
                    #
                  </th>
                  {filteredHeaders.map((header, cellIndex) => (
                    <th key={cellIndex} scope="col" className={getColumnClass(styles, header)}>
                      {renderInlineMarkdown(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className={styles['message-markdown__index-col']}>{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => {
                      const header = filteredHeaders[cellIndex]
                      const formatted = formatDisplayValue(cell, header)
                      return (
                        <td key={cellIndex} className={getColumnClass(styles, header, formatted)}>
                          {renderCellContent(formatted, header)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function isListHeader(header: string) {
  const headerLower = header.toLowerCase().trim()
  return headerLower === 'clients' || headerLower.endsWith(' clients')
}

function getColumnClass(stylesObj: Record<string, string>, header: string, cellValue = '') {
  if (parseListItems(cellValue, header) || isListHeader(header)) {
    return stylesObj['message-markdown__wrap-col']
  }

  const headerLower = header.toLowerCase()

  if (
    headerLower.includes('description') ||
    headerLower.includes('detail') ||
    headerLower.includes('remark') ||
    headerLower.includes('comment') ||
    headerLower.includes('note') ||
    cellValue.length > 60
  ) {
    return stylesObj['message-markdown__wrap-col']
  }

  return stylesObj['message-markdown__compact-col']
}

function parseListItems(value: string, header: string): string[] | null {
  if (!value.includes(',')) return null

  const headerLower = header.toLowerCase()
  const isListColumn =
    headerLower === 'clients' ||
    headerLower.endsWith(' clients') ||
    headerLower.includes('member') ||
    headerLower.includes('technician')

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (isListColumn && items.length >= 2) return items
  if (items.length >= 6) return items

  return null
}

function renderCellContent(value: string, header: string) {
  const items = parseListItems(value, header)

  if (items) {
    return (
      <div className={styles['message-markdown__chip-list']}>
        <p className={styles['message-markdown__chip-count']}>{items.length} items</p>
        <div className={styles['message-markdown__chips']}>
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className={styles['message-markdown__chip']}>
              {item}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return renderInlineMarkdown(value)
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}



function isDbId(val: string): boolean {
  const trimmed = val.trim()
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(trimmed)
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed)
  const isHashId = /^[0-9a-fA-F]{32,64}$/.test(trimmed)
  return isMongoId || isUuid || isHashId
}

