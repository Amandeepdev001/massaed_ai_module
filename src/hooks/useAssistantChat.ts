import { useCallback, useMemo, useState } from 'react'

import { useSendChatMessageMutation } from '@/store/api/chatApi'
import type { ChatMessage, ChatMessageHandlers } from '@/types/chat.types'
import { createClientId } from '@/utils/create-client-id'
import { formatMessageTimestamp } from '@/utils/format-display-value'

function createUserMessage(text: string): ChatMessage {
  return {
    id: createClientId('user'),
    role: 'user',
    type: 'text',
    timestamp: formatMessageTimestamp(),
    content: { text },
  }
}

function createBotMessage(text: string): ChatMessage {
  return {
    id: createClientId('bot'),
    role: 'bot',
    type: 'text',
    timestamp: formatMessageTimestamp(),
    content: { text },
  }
}

function createTypingMessage(): ChatMessage {
  return {
    id: createClientId('typing'),
    role: 'bot',
    type: 'typing',
    timestamp: formatMessageTimestamp(),
  }
}

export function useAssistantChat({ historyMessages = [] }: { historyMessages?: ChatMessage[] }) {
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([])
  const [sendChatMessage, { isLoading: isSending }] = useSendChatMessageMutation()

  const messages = useMemo(
    () => [...historyMessages, ...liveMessages],
    [historyMessages, liveMessages],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isSending) return

      const userMessage = createUserMessage(trimmed)
      const typingMessage = createTypingMessage()

      setLiveMessages((prev) => [...prev, userMessage, typingMessage])

      try {
        const result = await sendChatMessage({ message: trimmed }).unwrap()

        setLiveMessages((prev) => [
          ...prev.filter((message) => message.id !== typingMessage.id),
          createBotMessage(
            result.success
              ? result.answer
              : result.error ?? 'Something went wrong. Please try again.',
          ),
        ])
      } catch {
        setLiveMessages((prev) => [
          ...prev.filter((message) => message.id !== typingMessage.id),
          createBotMessage('Unable to reach the server. Please try again.'),
        ])
      }
    },
    [isSending, sendChatMessage],
  )

  const handlers: ChatMessageHandlers = {
    onCopy: (messageId) => {
      const message = messages.find((item) => item.id === messageId)
      if (!message || message.role !== 'user') return
      void navigator.clipboard?.writeText(message.content.text)
    },
    onEdit: (messageId) => {
      const message = messages.find((item) => item.id === messageId)
      if (!message || message.role !== 'user') return
      void navigator.clipboard?.writeText(message.content.text)
    },
  }

  return {
    messages,
    isInputDisabled: isSending,
    isRunInProgress: isSending,
    sendMessage,
    handlers,
  }
}
