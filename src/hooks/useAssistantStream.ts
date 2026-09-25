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
  /** True once this SSE session has seen run_started (marks a real new turn). */
  const seenRunStartedInSessionRef = useRef(false)

  const closeStream = useCallback(() => {
    closedIntentionallyRef.current = true
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    setIsStreaming(false)
  }, [])

  const trackSequence = useCallback((event: AssistantRunEvent) => {
    if (!event.hasBackendSequence) return
    afterSequenceRef.current = event.sequence
    setLastSequence(event.sequence)
  }, [])

  const appendEvent = useCallback(
    (event: AssistantRunEvent) => {
      // Backend often emits waiting_for_user right after follow_up_question. We close
      // the stream on follow_up, so that waiting event is missed. On resume
      // (afterSequence=follow_up.seq) it arrives BEFORE the next run_started and would
      // falsely settle the new turn as "I need your input to continue."
      if (event.eventType === 'waiting_for_user' && !seenRunStartedInSessionRef.current) {
        trackSequence(event)
        return
      }

      if (event.eventType === 'run_started') {
        seenRunStartedInSessionRef.current = true
      }

      setEvents((current) => {
        if (current.some((item) => item.id === event.id)) return current
        return [...current, event]
      })

      trackSequence(event)

      if (shouldCloseAssistantStream(event.eventType)) {
        closeStream()
      }
    },
    [closeStream, trackSequence],
  )

  const openStream = useCallback(
    (fromSequence: number) => {
      if (!runId) return

      unsubscribeRef.current?.()
      closedIntentionallyRef.current = false
      seenRunStartedInSessionRef.current = false
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
      seenRunStartedInSessionRef.current = false
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
