import type { ChatSuggestion } from '@/types/chat-suggestions.types'

import { StarIcon } from './icons'

export function ChatSuggestions({
  suggestions,
  onSuggestionSelect,
}: {
  suggestions: ChatSuggestion[]
  onSuggestionSelect?: (suggestion: ChatSuggestion) => void
}) {
  if (suggestions.length === 0) return null

  return (
    <section className="chat-suggestions" aria-label="Suggested for you">
      <div className="chat-suggestions__header">
        <StarIcon />
        <span className="chat-suggestions__title">Suggested for you</span>
      </div>
      <div className="chat-suggestions__chips">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            className="chat-suggestions__chip"
            onClick={() => onSuggestionSelect?.(suggestion)}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  )
}
