import type { ChatMessage } from '@/types/chat.types'
import type { Conversation, ConversationHistoryItem } from '@/types/conversation.api.types'

export function historyItemToChatMessage(
  item: ConversationHistoryItem,
  conversationId: string,
  index: number,
): ChatMessage {
  const id = `${conversationId}-${index}`

  if (item.type === 'human') {
    return {
      id,
      role: 'user',
      type: 'text',
      timestamp: '',
      content: { text: item.content },
    }
  }

  return {
    id,
    role: 'bot',
    type: 'text',
    timestamp: '',
    content: { text: item.content },
  }
}

export function conversationToChatMessages(conversation: Conversation): ChatMessage[] {
  return conversation.history.map((item, index) =>
    historyItemToChatMessage(item, conversation.conversationId, index),
  )
}

export function conversationsResponseToChatMessages(
  conversations: Conversation[],
  conversationId?: string,
): ChatMessage[] {
  if (conversations.length === 0) return []

  const conversation = conversationId
    ? conversations.find((item) => item.conversationId === conversationId)
    : conversations[0]

  if (!conversation) return []
  return conversationToChatMessages(conversation)
}
