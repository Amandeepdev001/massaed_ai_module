import { useCallback, useEffect, useRef, useState } from 'react'

import {
  CHAT_TEXTBOX_MIC_PERMISSION_ERROR,
  CHAT_TEXTBOX_SPEECH_UNSUPPORTED_ERROR,
} from '@/constants/chatTextbox.constants'

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function appendTranscript(base: string, addition: string) {
  const trimmedAddition = addition.trim()
  if (!trimmedAddition) return base
  if (!base.trim()) return trimmedAddition
  if (/\s$/.test(base)) return `${base}${trimmedAddition}`

  return `${base} ${trimmedAddition}`
}

export interface UseSpeechToTextOptions {
  onError?: (message: string) => void
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { onError } = options
  const onErrorRef = useRef(onError)

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const committedTextRef = useRef('')
  const onUpdateRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) {
      setIsListening(false)
      return
    }

    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null

    try {
      recognition.stop()
    } catch {
      // already stopped
    }

    recognitionRef.current = null
    onUpdateRef.current = null
    setIsListening(false)
  }, [])

  const startListening = useCallback(
    (baseText: string, onUpdate: (text: string) => void): string | null => {
      const SpeechRecognitionCtor = getSpeechRecognitionConstructor()
      if (!SpeechRecognitionCtor) {
        return CHAT_TEXTBOX_SPEECH_UNSUPPORTED_ERROR
      }

      stopListening()

      committedTextRef.current = baseText
      onUpdateRef.current = onUpdate

      const recognition = new SpeechRecognitionCtor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang =
        typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US'

      recognition.onresult = (event) => {
        let interimTranscript = ''

        for (let index = event.resultIndex; index < event.results.length; index++) {
          const result = event.results[index]
          if (!result) continue

          const transcript = result[0]?.transcript ?? ''
          if (!transcript) continue

          if (result.isFinal) {
            committedTextRef.current = appendTranscript(committedTextRef.current, transcript)
          } else {
            interimTranscript = appendTranscript(interimTranscript, transcript)
          }
        }

        const nextValue = interimTranscript
          ? appendTranscript(committedTextRef.current, interimTranscript)
          : committedTextRef.current

        onUpdateRef.current?.(nextValue)
      }

      recognition.onerror = (event) => {
        if (event.error === 'aborted' || event.error === 'no-speech') return

        const message =
          event.error === 'not-allowed' || event.error === 'service-not-allowed'
            ? CHAT_TEXTBOX_MIC_PERMISSION_ERROR
            : CHAT_TEXTBOX_SPEECH_UNSUPPORTED_ERROR

        onErrorRef.current?.(message)
        stopListening()
      }

      recognition.onend = () => {
        recognitionRef.current = null
        onUpdateRef.current = null
        setIsListening(false)
      }

      try {
        recognition.start()
        recognitionRef.current = recognition
        setIsListening(true)
        return null
      } catch {
        return CHAT_TEXTBOX_SPEECH_UNSUPPORTED_ERROR
      }
    },
    [stopListening],
  )

  const toggleListening = useCallback(
    (baseText: string, onUpdate: (text: string) => void): string | null => {
      if (isListening) {
        stopListening()
        return null
      }

      return startListening(baseText, onUpdate)
    },
    [isListening, startListening, stopListening],
  )

  useEffect(() => () => stopListening(), [stopListening])

  return {
    isListening,
    startListening,
    stopListening,
    toggleListening,
  }
}
