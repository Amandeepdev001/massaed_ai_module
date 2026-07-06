import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'

import type { ChatMessage, ChatMessageHandlers } from '@/types/chat.types'
import type { ChatSuggestion } from '@/types/chat-suggestions.types'

import { ChatMessageList } from './ChatMessageList'
import { ChatSuggestions } from './ChatSuggestions'
import { ChatWelcome } from './ChatWelcome'
import { ChevronDownIcon } from './icons'

const NEAR_BOTTOM_THRESHOLD = 120

export function ChatView({
  messages,
  handlers,
  footer,
  suggestions,
  welcomeName,
  onSuggestionSelect,
  onContainerClick,
}: {
  messages: ChatMessage[]
  handlers?: ChatMessageHandlers
  footer?: ReactNode
  suggestions?: ChatSuggestion[]
  welcomeName?: string
  onSuggestionSelect?: (suggestion: ChatSuggestion) => void
  onContainerClick?: () => void
}) {
  const bottomAnchorRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const isNearBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD

    isNearBottomRef.current = isNearBottom
    setShowScrollButton(!isNearBottom && scrollHeight > clientHeight + NEAR_BOTTOM_THRESHOLD)
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current
    if (!container) {
      bottomAnchorRef.current?.scrollIntoView({ behavior, block: 'end' })
      return
    }
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [])

  const handleScroll = useCallback(() => {
    updateScrollState()
  }, [updateScrollState])

  const handleContainerClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement
      if (target.closest('button, a, input, textarea, select, [role="button"]')) return
      onContainerClick?.()
    },
    [onContainerClick],
  )

  const isEmpty = messages.length === 0

  useEffect(() => {
    if (isEmpty || !isNearBottomRef.current) return
    const frame = requestAnimationFrame(() => {
      scrollToBottom('auto')
      updateScrollState()
    })
    return () => cancelAnimationFrame(frame)
  }, [isEmpty, messages, scrollToBottom, updateScrollState])

  useEffect(() => {
    updateScrollState()
  }, [messages, updateScrollState])

  return (
    <div className="chat-view" onClick={handleContainerClick}>
      <section className="chat-view__panel">
        <div className="chat-view__scroll custom-scrollbar" ref={scrollContainerRef} onScroll={handleScroll}>
          <div className="chat-view__content">
            {isEmpty ? (
              <ChatWelcome name={welcomeName} />
            ) : (
              <>
                <ChatMessageList messages={messages} handlers={handlers} />
                <div ref={bottomAnchorRef} aria-hidden style={{ height: 1, width: '100%', flexShrink: 0 }} />
              </>
            )}
          </div>
        </div>

        {!isEmpty && showScrollButton ? (
          <button
            type="button"
            className="chat-view__scroll-btn"
            aria-label="Scroll to bottom"
            onClick={() => scrollToBottom()}
          >
            <ChevronDownIcon />
          </button>
        ) : null}

        {footer || isEmpty ? (
          <footer className="chat-view__footer">
            <div className="chat-view__footer-stack">
              {isEmpty && suggestions ? (
                <ChatSuggestions suggestions={suggestions} onSuggestionSelect={onSuggestionSelect} />
              ) : null}
              {footer}
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  )
}
