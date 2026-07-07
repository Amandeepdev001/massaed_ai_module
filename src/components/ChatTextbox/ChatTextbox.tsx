import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import { useSpeechToText } from '@/hooks/useSpeechToText'

import { MicIcon, SendIcon } from '../icons'
import styles from './ChatTextbox.module.css'

export interface ChatTextboxProps {
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  enableSpeechToText?: boolean
  onSend: (text: string) => void
}

function resizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = '0px'
  const next = Math.max(20, Math.min(element.scrollHeight, 200))
  element.style.height = `${next}px`
  element.style.overflowY = element.scrollHeight > 200 ? 'auto' : 'hidden'
}

function shouldIgnoreChatTextboxContainerFocus(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest('button, a, input, textarea, select, [role="button"]'))
  )
}

export const ChatTextbox = forwardRef<HTMLTextAreaElement, ChatTextboxProps>(function ChatTextbox(
  { placeholder, disabled = false, autoFocus = false, enableSpeechToText = true, onSend },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)

  const speechToText = useSpeechToText({
    onError: (message) => setSpeechError(message),
  })

  const isSpeechListening = enableSpeechToText && speechToText.isListening
  const isSpeechSpeaking = enableSpeechToText && speechToText.isSpeaking

  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const focusTextarea = useCallback(() => {
    if (disabled || isSpeechListening) return
    innerRef.current?.focus()
  }, [disabled, isSpeechListening])

  useEffect(() => {
    if (!autoFocus || disabled) return

    const frame = requestAnimationFrame(() => focusTextarea())
    const timeout = window.setTimeout(() => focusTextarea(), 120)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [autoFocus, disabled, focusTextarea])

  useEffect(() => {
    if (!disabled || !enableSpeechToText) return
    speechToText.stopListening()
  }, [disabled, enableSpeechToText, speechToText])

  useEffect(() => {
    if (!speechError) return
    const timer = window.setTimeout(() => setSpeechError(null), 4000)
    return () => window.clearTimeout(timer)
  }, [speechError])

  const handleSpeechTranscriptUpdate = useCallback((text: string) => {
    const element = innerRef.current
    if (!element) return
    element.value = text
    resizeTextarea(element)
  }, [])

  const handleSend = useCallback(() => {
    const element = innerRef.current
    if (!element || disabled || isSpeechListening) return

    if (enableSpeechToText && speechToText.isListening) {
      speechToText.stopListening()
    }

    const text = element.value.trim()
    if (!text) return
    onSend(text)
    element.value = ''
    resizeTextarea(element)
  }, [disabled, enableSpeechToText, isSpeechListening, onSend, speechToText])

  const handleMicClick = () => {
    if (disabled || !enableSpeechToText) return

    const currentValue = innerRef.current?.value ?? ''
    const error = speechToText.toggleListening(currentValue, handleSpeechTranscriptUpdate)
    if (error) setSpeechError(error)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleContainerMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled || isSpeechListening) return
    if (shouldIgnoreChatTextboxContainerFocus(event.target)) return

    event.preventDefault()
    focusTextarea()
  }

  return (
    <div
      className={[
        styles['chat-textbox'],
        disabled ? styles['chat-textbox--disabled'] : styles['chat-textbox--interactive'],
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={handleContainerMouseDown}
    >
      <textarea
        ref={setRef}
        className={styles['chat-textbox__textarea']}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        onInput={(event) => resizeTextarea(event.currentTarget)}
        onKeyDown={handleKeyDown}
      />
      {speechError ? (
        <p className={styles['chat-textbox__speech-error']} role="alert">
          {speechError}
        </p>
      ) : null}
      <div className={styles['chat-textbox__toolbar']}>
        {enableSpeechToText ? (
          <button
            type="button"
            className={[
              styles['chat-textbox__icon-btn'],
              isSpeechListening ? styles['chat-textbox__icon-btn--listening'] : '',
              isSpeechSpeaking ? styles['chat-textbox__icon-btn--speaking'] : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={isSpeechListening ? 'Stop speech-to-text' : 'Start speech-to-text'}
            aria-pressed={isSpeechListening}
            disabled={disabled}
            onClick={handleMicClick}
          >
            <MicIcon />
          </button>
        ) : null}
        <button
          type="button"
          className={styles['chat-textbox__send-btn']}
          aria-label="Send message"
          disabled={disabled || isSpeechListening}
          onClick={handleSend}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
})
