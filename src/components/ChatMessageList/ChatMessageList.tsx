import type { ChatMessage, ChatMessageHandlers } from '@/types/chat.types'

import { ChatMessageItem } from '../Message/Message'
import styles from './ChatMessageList.module.css'

export function ChatMessageList({
  messages,
  handlers,
}: {
  messages: ChatMessage[]
  handlers?: ChatMessageHandlers
}) {
  return (
    <div className={styles['message-list']} role="log" aria-live="polite">
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} handlers={handlers} />
      ))}
    </div>
  )
}

