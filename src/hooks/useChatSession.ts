import { useCallback, useState } from 'react'

import { NEW_CONVERSATION_ID, THREAD_SESSION_ID } from '@/constants/chat.constants'
import type { ChatSessionItem } from '@/types/chat-navigation.types'

const LIVE_SESSION: ChatSessionItem = {
  id: THREAD_SESSION_ID,
  title: 'Chat',
  groupLabel: 'Recent',
}

/**
 * Session sidebar without server history — a single live thread for the
 * current browser visit. Leaving / refreshing clears the transcript.
 */
export function useChatSession() {
  const [isNewConversation, setIsNewConversation] = useState(false)

  const sessions = isNewConversation ? [] : [LIVE_SESSION]
  const threadSessionId = LIVE_SESSION.id

  const handleSelectedChatChange = useCallback(
    (chatId: string | undefined) => {
      if (!chatId) return
      if (!isNewConversation && chatId === threadSessionId) return
      setIsNewConversation(false)
    },
    [isNewConversation, threadSessionId],
  )

  const startNewConversation = useCallback(() => {
    setIsNewConversation(true)
  }, [])

  const returnToLiveConversation = useCallback(() => {
    setIsNewConversation(false)
  }, [])

  const selectedChatId = isNewConversation
    ? NEW_CONVERSATION_ID
    : (threadSessionId ?? NEW_CONVERSATION_ID)

  return {
    sessions,
    selectedChatId,
    isNewConversation,
    handleSelectedChatChange,
    startNewConversation,
    returnToLiveConversation,
  }
}
