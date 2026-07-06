import { parseMarkdownBlocks } from '@/utils/parse-markdown-content'
import { formatDisplayValue } from '@/utils/format-display-value'

export function MessageMarkdown({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className="message-markdown">
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          return (
            <p key={index} className="message-markdown__paragraph">
              {renderInlineMarkdown(block.text)}
            </p>
          )
        }

        return (
          <div key={index} className="message-markdown__table-wrap table-scrollbar">
            <table className="message-markdown__table">
              <thead>
                <tr>
                  <th className="message-markdown__index-col" scope="col">
                    #
                  </th>
                  {block.headers.map((header, cellIndex) => (
                    <th key={cellIndex} scope="col" className={getColumnClass(header)}>
                      {renderInlineMarkdown(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="message-markdown__index-col">{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => {
                      const header = block.headers[cellIndex]
                      const formatted = formatDisplayValue(cell, header)
                      return (
                        <td key={cellIndex} className={getColumnClass(header, formatted)}>
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
  const headerLower = header.toLowerCase()
  return headerLower.includes('client') || headerLower.includes('member')
}

function getColumnClass(header: string, cellValue = '') {
  const headerLower = header.toLowerCase()

  if (parseListItems(cellValue, header) || (isListHeader(header) && !cellValue)) {
    return 'message-markdown__grow-col message-markdown__list-col'
  }

  if (
    headerLower.includes('description') ||
    headerLower.includes('detail') ||
    headerLower.includes('remark') ||
    headerLower.includes('comment') ||
    headerLower.includes('note') ||
    cellValue.length > 80
  ) {
    return 'message-markdown__grow-col message-markdown__description-col'
  }

  return 'message-markdown__shrink-col'
}

function parseListItems(value: string, header: string): string[] | null {
  if (!value.includes(',')) return null

  const headerLower = header.toLowerCase()
  const isListColumn =
    headerLower.includes('client') ||
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
      <div className="message-markdown__chip-list">
        <p className="message-markdown__chip-count">{items.length} items</p>
        <div className="message-markdown__chips">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className="message-markdown__chip">
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
