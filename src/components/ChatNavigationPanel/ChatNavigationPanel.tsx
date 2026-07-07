import { NEW_CONVERSATION_ID } from '@/constants/chat.constants'
import type { ChatSessionItem } from '@/types/chat-navigation.types'

import { PlusIcon, SearchIcon } from '../icons'
import styles from './ChatNavigationPanel.module.css'

export function ChatNavigationPanel({
  sessions,
  selectedChatId,
  isNewConversation,
  onSelectedChatChange,
  onNewConversation,
}: {
  sessions: ChatSessionItem[]
  selectedChatId: string
  isNewConversation: boolean
  onSelectedChatChange: (chatId: string) => void
  onNewConversation: () => void
}) {
  const groups = sessions.reduce<Record<string, ChatSessionItem[]>>((acc, session) => {
    const label = session.groupLabel ?? 'Chats'
    acc[label] = acc[label] ?? []
    acc[label].push(session)
    return acc
  }, {})

  return (
    <>
      <div className={styles.sidebar__search}>
        <SearchIcon className={styles.sidebar__search_icon ?? styles['sidebar__search-icon']} />
        <input className={styles['sidebar__search-input']} type="search" placeholder="Search here" aria-label="Search conversations" />
      </div>

      <div className={`${styles.sidebar__sessions} custom-scrollbar`}>
        {Object.entries(groups).map(([groupLabel, items]) => (
          <div key={groupLabel}>
            <p className={styles['sidebar__group-label']}>{groupLabel}</p>
            {items.map((session) => {
              const isActive = !isNewConversation && selectedChatId === session.id
              return (
                <button
                  key={session.id}
                  type="button"
                  className={`${styles.sidebar__item} ${isActive ? styles['is-active'] : ''}`}
                  onClick={() => onSelectedChatChange(session.id)}
                >
                  <span className={styles['sidebar__item-title']}>{session.title}</span>
                  {session.timeLabel ? <span className={styles['sidebar__item-time']}>{session.timeLabel}</span> : null}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className={styles.sidebar__footer}>
        <button
          type="button"
          className={styles['sidebar__new-btn']}
          onClick={onNewConversation}
          aria-current={isNewConversation || selectedChatId === NEW_CONVERSATION_ID ? 'page' : undefined}
        >
          <PlusIcon />
          New Conversation
        </button>
      </div>
    </>
  )
}

