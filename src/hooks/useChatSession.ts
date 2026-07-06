import { useCallback, useEffect, useState } from 'react'

import { NEW_CONVERSATION_ID } from '@/constants/chat.constants'
import type { Conversation } from '@/types/conversation.api.types'
import type { ChatSessionItem } from '@/types/chat-navigation.types'
import { conversationsToSessions } from '@/utils/conversation-to-sessions'

export function useChatSession(conversations: Conversation[]) {
  const [selectedChatId, setSelectedChatId] = useState<string>(NEW_CONVERSATION_ID)
  const [isNewConversation, setIsNewConversation] = useState(true)

  const sessions: ChatSessionItem[] = conversationsToSessions(conversations)

  useEffect(() => {
    if (conversations.length === 0 || isNewConversation) return
    const exists = conversations.some((item) => item.conversationId === selectedChatId)
    if (!exists) {
      setSelectedChatId(conversations[0].conversationId)
    }
  }, [conversations, isNewConversation, selectedChatId])

  const handleSelectedChatChange = useCallback((chatId: string) => {
    setSelectedChatId(chatId)
    setIsNewConversation(false)
  }, [])

  const startNewConversation = useCallback(() => {
    setIsNewConversation(true)
    setSelectedChatId(NEW_CONVERSATION_ID)
  }, [])

  const returnToLiveConversation = useCallback(() => {
    if (conversations.length > 0) {
      setIsNewConversation(false)
      setSelectedChatId(conversations[0].conversationId)
      return
    }
    setIsNewConversation(true)
    setSelectedChatId(NEW_CONVERSATION_ID)
  }, [conversations])

  return {
    sessions,
    selectedChatId: isNewConversation ? NEW_CONVERSATION_ID : selectedChatId,
    isNewConversation,
    handleSelectedChatChange,
    startNewConversation,
    returnToLiveConversation,
  }
}
