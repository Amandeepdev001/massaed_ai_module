import { useEffect, useId, useState } from 'react'

import type { BotChatMessage, ChatMessage, ChatMessageHandlers } from '@/types/chat.types'
import { getChatMessageCopyText } from '@/utils/message-copy'

import { BotAvatar } from '../BotAvatar/BotAvatar'
import { MessageMarkdown } from '../MessageMarkdown/MessageMarkdown'
import { ChevronRightIcon } from '../icons'
import { MessageAnalysisSteps } from '../MessageAnalysisSteps/MessageAnalysisSteps'
import { MessageMetaRow } from './MessageMetaRow'
import { TypingIndicator } from '../TypingIndicator/TypingIndicator'
import styles from './Message.module.css'

function MessageChips({
  chips,
  onSelect,
}: {
  chips: { id: string; label: string }[]
  onSelect?: (id: string) => void
}) {
  return (
    <div className={styles['message-chips']}>
      {chips.map((chip) => (
        <button key={chip.id} type="button" className={styles['message-chip']} onClick={() => onSelect?.(chip.id)}>
          {chip.label}
        </button>
      ))}
    </div>
  )
}

function MessageAttachments({
  attachments,
}: {
  attachments: { id: string; title: string; mediaType: string; sizeLabel?: string; typeLabel?: string }[]
}) {
  return (
    <div className={styles['message-attachments']}>
      {attachments.map((item) => (
        <div key={item.id} className={styles['message-attachment']}>
          <div className={styles['message-attachment__thumb']}>{item.mediaType.toUpperCase()}</div>
          <div className={styles['message-attachment__label']}>{item.title}</div>
          {item.sizeLabel ? <div className={styles['message-attachment__meta']}>{item.sizeLabel}</div> : null}
        </div>
      ))}
    </div>
  )
}

function BotMessageBody({
  message,
  handlers,
}: {
  message: BotChatMessage
  handlers?: ChatMessageHandlers
}) {
  switch (message.type) {
    case 'typing':
      return (
        <div className={`${styles['message-bubble']} ${styles['message-bubble--typing']}`}>
          <TypingIndicator />
        </div>
      )
    case 'text': {
      const hasTable = message.content.text.includes('\n|') || message.content.text.includes('\n| ')
      return (
        <div className={`${styles['message-bubble']} ${styles['message-bubble--text']} ${hasTable ? styles['message-bubble--has-table'] : ''}`}>
          <MessageMarkdown content={message.content.text} />
        </div>
      )
    }
    case 'status':
      return (
        <div
          className={`${styles['message-bubble']} ${styles['message-bubble--status']} ${
            message.content.tone === 'positive' ? styles['is-positive'] : styles['is-negative']
          }`}
        >
          <p>{message.content.text}</p>
          {message.content.questions ? (
            <MessageChips
              chips={message.content.questions}
              onSelect={(id) => handlers?.onQuestionSelect?.(message.id, id)}
            />
          ) : null}
        </div>
      )
    case 'selectors':
      return (
        <div className={`${styles['message-bubble']} ${styles['message-bubble--rich']}`}>
          <p>{message.content.text}</p>
          <MessageChips
            chips={message.content.selectors}
            onSelect={(id) => handlers?.onSelectorSelect?.(message.id, id)}
          />
        </div>
      )
    case 'summary':
      return (
        <div className={`${styles['message-bubble']} ${styles['message-bubble--rich']}`}>
          <p>{message.content.text}</p>
          <p className={styles['message-summary__title']}>{message.content.summaryTitle}</p>
          <ul className={styles['message-summary__fields']}>
            {message.content.fields.map((field) => (
              <li key={field.label}>
                <strong>{field.label}:</strong> {field.value}
              </li>
            ))}
          </ul>
          {message.content.question ? (
            <p className={styles['message-summary__question']}>{message.content.question}</p>
          ) : null}
          {message.content.actions ? (
            <MessageChips
              chips={message.content.actions}
              onSelect={(id) => handlers?.onActionSelect?.(message.id, id)}
            />
          ) : null}
        </div>
      )
    case 'attachments':
      return (
        <div className={`${styles['message-bubble']} ${styles['message-bubble--rich']}`}>
          <MessageAttachments attachments={message.content.attachments} />
          <p>{message.content.text}</p>
        </div>
      )
    default:
      return null
  }
}

function UserMessage({ message, handlers }: { message: Extract<ChatMessage, { role: 'user' }>; handlers?: ChatMessageHandlers }) {
  return (
    <div className={styles['message-user']}>
      <p className={styles['message-user__text']}>{message.content.text}</p>
      <MessageMetaRow
        timestamp={message.timestamp}
        variant="user"
        copyText={getChatMessageCopyText(message)}
        onEdit={() => handlers?.onEdit?.(message.id)}
      />
    </div>
  )
}

function BotMessage({ message, handlers }: { message: BotChatMessage; handlers?: ChatMessageHandlers }) {
  const reactId = useId()
  const analysesContentId = `${reactId}-analyses`
  const analyses = message.analyses ?? []
  const [isOpen, setIsOpen] = useState(message.defaultAnalysesOpen ?? false)
  const hasAnalyses = analyses.length > 0
  const isAnalysisOnly = message.type === 'typing' && hasAnalyses
  const showBubble = !isAnalysisOnly

  useEffect(() => {
    if (message.defaultAnalysesOpen) setIsOpen(true)
  }, [message.defaultAnalysesOpen, analyses.length])

  const hasTable = message.type === 'text' && (message.content.text.includes('\n|') || message.content.text.includes('\n| '))

  return (
    <article className={styles['message-bot']}>
      <div className={styles['message-bot__header']}>
        <BotAvatar />
        <div className={styles['message-bot__meta']}>
          <p className={styles['message-bot__name']}>{message.botName ?? 'Ai Bot'}</p>
          {hasAnalyses ? (
            <div className={styles['message-bot__analyses-toggle']}>
              <button
                type="button"
                className={styles['message-bot__analyses-label']}
                onClick={() => setIsOpen((open) => !open)}
              >
                Analyses {analyses.length} {analyses.length === 1 ? 'step' : 'steps'}
              </button>
              <button
                type="button"
                className={`${styles['message-bot__chevron-btn']} ${isOpen ? styles['is-open'] : ''}`}
                aria-expanded={isOpen}
                aria-controls={analysesContentId}
                aria-label={isOpen ? 'Collapse analyses' : 'Expand analyses'}
                onClick={() => setIsOpen((open) => !open)}
              >
                <ChevronRightIcon />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {hasAnalyses ? (
        <div
          id={analysesContentId}
          className={`${styles['message-bot__analyses']} ${isOpen ? styles['is-open'] : ''}`}
          aria-hidden={!isOpen}
        >
          <MessageAnalysisSteps steps={analyses} />
        </div>
      ) : null}

      {showBubble ? (
        <div className={`${styles['message-bot__body']} ${hasTable ? styles['message-bot__body--has-table'] : ''}`}>
          <BotMessageBody message={message} handlers={handlers} />
          {message.type !== 'typing' ? (
            <MessageMetaRow
              timestamp={message.timestamp}
              variant="bot"
              copyText={getChatMessageCopyText(message)}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function ChatMessageItem({
  message,
  handlers,
}: {
  message: ChatMessage
  handlers?: ChatMessageHandlers
}) {
  if (message.role === 'user') {
    return <UserMessage message={message} handlers={handlers} />
  }

  if (message.type === 'typing' && (message.analyses?.length ?? 0) === 0) {
    return (
      <div className={styles['message-bot']}>
        <div className={styles['message-bot__header']}>
          <BotAvatar />
          <div className={`${styles['message-bubble']} ${styles['message-bubble--typing']}`}>
            <TypingIndicator />
          </div>
        </div>
      </div>
    )
  }

  return <BotMessage message={message} handlers={handlers} />
}

