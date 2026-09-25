import { SESSION_TITLE_MAX_LENGTH, THREAD_SESSION_ID } from '@/constants/chat.constants'
import type { AssistantHistoryMessage } from '@/types/assistant.api.types'
import type { ChatSessionItem } from '@/types/chat-navigation.types'
import { sortAssistantHistory } from '@/utils/assistant-event.utils'

function truncateSessionTitle(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= SESSION_TITLE_MAX_LENGTH) return normalized
  return `${normalized.slice(0, SESSION_TITLE_MAX_LENGTH - 1)}…`
}

export function formatChatSessionTimeLabel(isoDate: string): string | undefined {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return undefined

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/**
 * Backend is one persistent thread per user — sidebar shows a single conversation
 * entry for the whole thread (not one row per run).
 */
export function buildChatSessionsFromHistory(
  history: AssistantHistoryMessage[],
): ChatSessionItem[] {
  if (history.length === 0) return []

  const sortedMessages = sortAssistantHistory(history)
  const firstUserMessage = sortedMessages.find((message) => message.senderType === 'user')
  const lastMessage = sortedMessages[sortedMessages.length - 1]

  if (!lastMessage) return []

  const rawTitle = firstUserMessage?.message ?? lastMessage.message
  const timeLabel = formatChatSessionTimeLabel(lastMessage.createdAt)

  return [
    {
      id: THREAD_SESSION_ID,
      title: truncateSessionTitle(rawTitle),
      ...(timeLabel ? { timeLabel } : {}),
      groupLabel: 'Recent',
    },
  ]
}
