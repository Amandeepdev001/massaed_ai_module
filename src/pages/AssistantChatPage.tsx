import { useCallback, useEffect, useRef } from 'react'

import { ChatNavigationPanel } from '@/components/ChatNavigationPanel/ChatNavigationPanel'
import { ChatTextbox } from '@/components/ChatTextbox/ChatTextbox'
import { ChatView } from '@/components/ChatView/ChatView'
import { MassaedLoader } from '@/components/MassaedLoader/MassaedLoader'
import { useAssistantChat } from '@/hooks/useAssistantChat'
import { useChatSession } from '@/hooks/useChatSession'
import { ChatLayout } from '@/layout/ChatLayout'
import { WorkspaceLayout } from '@/layout/WorkspaceLayout'
import { CHAT_TEXTBOX_PLACEHOLDER, MOCK_CHAT_SUGGESTIONS } from '@/mocks/chat.mock'
import type { ChatSuggestion } from '@/types/chat-suggestions.types'
import { markAssistantChatLeft } from '@/utils/assistant-session.utils'

const WELCOME_NAME = 'Aman Vashisht'

export function AssistantChatPage() {
  const {
    sessions,
    selectedChatId,
    isNewConversation,
    handleSelectedChatChange,
    startNewConversation,
    returnToLiveConversation,
  } = useChatSession()

  const { messages, isHistoryLoading, isInputDisabled, isRunInProgress, sendMessage, handlers } =
    useAssistantChat({
      isNewConversation,
    })

  const chatTextboxRef = useRef<HTMLTextAreaElement>(null)
  const wasRunInProgressRef = useRef(false)

  // Leaving the chat screen (route unmount) → next open purges history.
  // Scroll / remount while staying mounted does not hit this.
  useEffect(() => {
    return () => {
      markAssistantChatLeft()
    }
  }, [])

  const focusInput = useCallback(() => {
    if (isInputDisabled) return
    chatTextboxRef.current?.focus()
  }, [isInputDisabled])

  useEffect(() => {
    if (isHistoryLoading) return

    const frame = requestAnimationFrame(() => focusInput())
    const timeout = window.setTimeout(() => focusInput(), 120)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [isHistoryLoading, selectedChatId, isNewConversation, focusInput])

  useEffect(() => {
    const wasInProgress = wasRunInProgressRef.current
    wasRunInProgressRef.current = isRunInProgress
    if (!wasInProgress || isRunInProgress) return

    const frame = requestAnimationFrame(() => focusInput())
    const timeout = window.setTimeout(() => focusInput(), 120)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [isRunInProgress, messages.length, focusInput])

  const handleSend = useCallback(
    (text: string) => {
      returnToLiveConversation()
      void sendMessage(text)
    },
    [returnToLiveConversation, sendMessage],
  )

  const handleSuggestionSelect = useCallback(
    (suggestion: ChatSuggestion) => {
      handleSend(suggestion.label)
    },
    [handleSend],
  )

  if (isHistoryLoading && !isNewConversation) {
    return <MassaedLoader />
  }

  return (
    <WorkspaceLayout
      sidebar={
        <ChatNavigationPanel
          sessions={sessions}
          selectedChatId={selectedChatId}
          isNewConversation={isNewConversation}
          onSelectedChatChange={handleSelectedChatChange}
          onNewConversation={startNewConversation}
        />
      }
    >
      <ChatLayout>
        <ChatView
          messages={messages}
          suggestions={MOCK_CHAT_SUGGESTIONS}
          welcomeName={WELCOME_NAME}
          onSuggestionSelect={handleSuggestionSelect}
          onContainerClick={focusInput}
          handlers={handlers}
          footer={
            <ChatTextbox
              ref={chatTextboxRef}
              placeholder={CHAT_TEXTBOX_PLACEHOLDER}
              autoFocus
              disabled={isInputDisabled}
              onSend={handleSend}
            />
          }
        />
      </ChatLayout>
    </WorkspaceLayout>
  )
}
