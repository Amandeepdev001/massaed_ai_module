import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
} from 'react'

import { MicIcon, SendIcon } from './icons'

export interface ChatTextboxProps {
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  onSend: (text: string) => void
}

function resizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = '0px'
  const next = Math.max(20, Math.min(element.scrollHeight, 200))
  element.style.height = `${next}px`
  element.style.overflowY = element.scrollHeight > 200 ? 'auto' : 'hidden'
}

export const ChatTextbox = forwardRef<HTMLTextAreaElement, ChatTextboxProps>(function ChatTextbox(
  { placeholder, disabled = false, autoFocus = false, onSend },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null)

  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  useEffect(() => {
    if (!autoFocus) return
    innerRef.current?.focus()
  }, [autoFocus])

  const handleSend = useCallback(() => {
    const element = innerRef.current
    if (!element || disabled) return
    const text = element.value.trim()
    if (!text) return
    onSend(text)
    element.value = ''
    resizeTextarea(element)
  }, [disabled, onSend])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-textbox">
      <textarea
        ref={setRef}
        className="chat-textbox__textarea"
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        onInput={(event) => resizeTextarea(event.currentTarget)}
        onKeyDown={handleKeyDown}
      />
      <div className="chat-textbox__toolbar">
        <button type="button" className="chat-textbox__icon-btn" aria-label="Voice input" disabled={disabled}>
          <MicIcon />
        </button>
        <button
          type="button"
          className="chat-textbox__send-btn"
          aria-label="Send message"
          disabled={disabled}
          onClick={handleSend}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
})
