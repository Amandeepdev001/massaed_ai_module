import { useCallback, useEffect, useRef, useState } from 'react'

import type { AssistantRunEvent, AssistantStreamState } from '@/types/assistant.api.types'
import { shouldCloseAssistantStream } from '@/utils/assistant-event.utils'
import { subscribeAssistantRunEvents } from '@/utils/assistant-sse'

export function useAssistantStream(
  runId: string | null,
  initialAfterSequence = 0,
): AssistantStreamState {
  const [events, setEvents] = useState<AssistantRunEvent[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSequence, setLastSequence] = useState(initialAfterSequence)

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const afterSequenceRef = useRef(initialAfterSequence)
  const closedIntentionallyRef = useRef(false)

  const closeStream = useCallback(() => {
    closedIntentionallyRef.current = true
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    setIsStreaming(false)
  }, [])

  const appendEvent = useCallback(
    (event: AssistantRunEvent) => {
      setEvents((current) => {
        if (current.some((item) => item.id === event.id)) return current
        return [...current, event]
      })

      if (event.hasBackendSequence) {
        afterSequenceRef.current = event.sequence
        setLastSequence(event.sequence)
      }

      if (shouldCloseAssistantStream(event.eventType)) {
        closeStream()
      }
    },
    [closeStream],
  )

  const openStream = useCallback(
    (fromSequence: number) => {
      if (!runId) return

      unsubscribeRef.current?.()
      closedIntentionallyRef.current = false
      setIsStreaming(true)
      setError(null)

      unsubscribeRef.current = subscribeAssistantRunEvents(runId, fromSequence, {
        onEvent: appendEvent,
        onError: (message) => {
          setIsStreaming(false)
          unsubscribeRef.current = null
          if (!closedIntentionallyRef.current) {
            setError(message || 'The connection to the assistant was interrupted. Please try again.')
          }
        },
        onClose: () => {
          setIsStreaming(false)
          unsubscribeRef.current = null
        },
      })
    },
    [runId, appendEvent],
  )

  useEffect(() => {
    if (!runId) {
      closeStream()
      setEvents([])
      setLastSequence(initialAfterSequence)
      afterSequenceRef.current = initialAfterSequence
      return
    }

    setEvents([])
    afterSequenceRef.current = initialAfterSequence
    openStream(initialAfterSequence)

    return () => {
      closedIntentionallyRef.current = true
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
    }
  }, [runId, initialAfterSequence, closeStream, openStream])

  const reconnect = useCallback(
    (fromSequence?: number) => {
      const sequence = fromSequence ?? afterSequenceRef.current
      afterSequenceRef.current = sequence
      openStream(sequence)
    },
    [openStream],
  )

  return { events, isStreaming, error, lastSequence, close: closeStream, reconnect }
}
