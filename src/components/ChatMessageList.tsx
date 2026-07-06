import type { ChatMessage, ChatMessageHandlers } from '@/types/chat.types'

import { ChatMessageItem } from './Message'

export function ChatMessageList({
  messages,
  handlers,
}: {
  messages: ChatMessage[]
  handlers?: ChatMessageHandlers
}) {
  return (
    <div className="message-list" role="log" aria-live="polite">
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} handlers={handlers} />
      ))}
    </div>
  )
}
