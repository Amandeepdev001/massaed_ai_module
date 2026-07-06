import type { Conversation } from '@/types/conversation.api.types'
import type { ChatSessionItem } from '@/types/chat-navigation.types'

function getConversationTitle(conversation: Conversation): string {
  const lastHuman = [...conversation.history].reverse().find((item) => item.type === 'human')
  if (!lastHuman) return 'New conversation'
  const text = lastHuman.content.trim()
  return text.length > 48 ? `${text.slice(0, 48)}…` : text
}

export function conversationsToSessions(conversations: Conversation[]): ChatSessionItem[] {
  return conversations.map((conversation) => ({
    id: conversation.conversationId,
    title: getConversationTitle(conversation),
    groupLabel: 'Recent',
  }))
}
