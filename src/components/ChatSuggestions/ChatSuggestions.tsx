import type { ChatSuggestion } from '@/types/chat-suggestions.types'

import { StarIcon } from '../icons'
import styles from './ChatSuggestions.module.css'

export function ChatSuggestions({
  suggestions,
  onSuggestionSelect,
}: {
  suggestions: ChatSuggestion[]
  onSuggestionSelect?: (suggestion: ChatSuggestion) => void
}) {
  if (suggestions.length === 0) return null

  return (
    <section className={styles['chat-suggestions']} aria-label="Suggested for you">
      <div className={styles['chat-suggestions__header']}>
        <StarIcon />
        <span className={styles['chat-suggestions__title']}>Suggested for you</span>
      </div>
      <div className={styles['chat-suggestions__chips']}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            className={styles['chat-suggestions__chip']}
            onClick={() => onSuggestionSelect?.(suggestion)}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  )
}

