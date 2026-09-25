import { useCallback, useMemo, useState } from 'react'

import { NEW_CONVERSATION_ID } from '@/constants/chat.constants'
import type { AssistantHistoryMessage } from '@/types/assistant.api.types'
import { buildChatSessionsFromHistory } from '@/utils/chat-session.utils'

export function useChatSession(history: AssistantHistoryMessage[] | undefined) {
  const sessions = useMemo(() => buildChatSessionsFromHistory(history ?? []), [history])

  const [isNewConversation, setIsNewConversation] = useState(false)

  const threadSessionId = sessions[0]?.id

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
