export type ConversationHistoryItem = {
  type: 'human' | 'ai'
  content: string
}

export type Conversation = {
  conversationId: string
  history: ConversationHistoryItem[]
}

export type ChatHistoryResponse = {
  success: boolean
  conversations: Conversation[]
  error: string | null
}

export type ChatRequest = {
  message: string
  userId: string
  spaceId: string
}

export type ChatResponse = {
  success: boolean
  answer: string
  toolCalls?: unknown[]
  metadata?: {
    conversationId?: string
    intent?: string
    queryPlan?: unknown
    resultStatus?: unknown
  }
  error: string | null
}
