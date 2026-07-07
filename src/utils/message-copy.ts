import type { ChatMessage } from '@/types/chat.types'
import type { MessageSummaryField } from '@/types/message.types'

function joinCopyLines(...parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join('\n\n')
}

function getLastNonTableLine(content: string): string {
  const lines = content.split('\n')

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]?.trim() ?? ''
    if (!line) continue
    if (line.startsWith('|')) continue

    return line
  }

  const nonEmptyLines = lines.map((line) => line.trim()).filter(Boolean)
  return nonEmptyLines[nonEmptyLines.length - 1] ?? content.trim()
}

function formatSummaryFieldsCopyText(fields: MessageSummaryField[]): string {
  return fields.map((field) => `• ${field.label}: — ${field.value}`).join('\n')
}

function getBotMessageCopyText(message: Extract<ChatMessage, { role: 'bot' }>): string {
  switch (message.type) {
    case 'typing':
      return ''

    case 'text':
      return getLastNonTableLine(message.content.text)

    case 'table':
      return getLastNonTableLine(message.content.text)

    case 'attachments': {
      const attachmentLabels = message.content.attachments
        .map((attachment) => attachment.title?.trim() || 'Attachment')
        .join(', ')

      return joinCopyLines(
        message.content.text,
        attachmentLabels ? `Attachments: ${attachmentLabels}` : undefined,
      )
    }

    case 'status':
      return joinCopyLines(
        message.content.text,
        message.content.questions?.map((question) => question.label).join(', '),
      )

    case 'selectors':
      return joinCopyLines(
        message.content.text,
        message.content.selectors.map((selector) => selector.label).join(', '),
      )

    case 'summary':
      return joinCopyLines(
        `${message.content.text} ${message.content.summaryTitle}`.trim(),
        formatSummaryFieldsCopyText(message.content.fields),
        message.content.question,
      )

    default: {
      const _exhaustive: never = message
      return _exhaustive
    }
  }
}

export function getChatMessageCopyText(message: ChatMessage): string {
  if (message.role === 'user') {
    return message.content.text
  }

  return getBotMessageCopyText(message)
}

async function writeTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export async function copyChatMessageText(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return false

  try {
    await writeTextToClipboard(trimmed)
    return true
  } catch {
    return false
  }
}
