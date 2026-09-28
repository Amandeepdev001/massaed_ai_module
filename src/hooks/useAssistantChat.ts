import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import {
  assistantApi,
  useOpenAssistantSessionMutation,
  useStartAssistantRunMutation,
} from '@/store/api/assistantApi'
import type { AppDispatch } from '@/store'
import type {
  AssistantHistoryMessage,
  AssistantRunEvent,
  UseAssistantChatOptions,
} from '@/types/assistant.api.types'
import type { ChatMessage, ChatMessageHandlers, UserChatMessage } from '@/types/chat.types'
import {
  assistantHistoryToMessages,
  buildHistoryEntriesFromRun,
  compareAssistantEvents,
  createLiveRunMessage,
  createLiveTypingMessage,
  createOptimisticUserMessage,
  hasRunSettled,
} from '@/utils/assistant-event.utils'

import {
  clearAssistantTranscript,
  loadAssistantTranscript,
  markAssistantChatMounted,
  saveAssistantTranscript,
  shouldPurgeAssistantHistory,
} from '@/utils/assistant-session.utils'

import { useAssistantStream } from './useAssistantStream'

function appendUniqueHistoryEntries(
  old: AssistantHistoryMessage[],
  newEntries: AssistantHistoryMessage[],
): AssistantHistoryMessage[] {
  const existingIds = new Set(old.map((entry) => entry.id))
  const uniqueEntries = newEntries.filter((entry) => !existingIds.has(entry.id))
  if (uniqueEntries.length === 0) return old
  return [...old, ...uniqueEntries].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  )
}

function extractErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: number }).status === 409
  ) {
    return 'A run is already in progress. Please wait for it to finish.'
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
  ) {
    return (error as { data: { message: string } }).data.message
  }

  return 'Unable to reach the server. Please try again.'
}

const ACTIVE_RUN_STATUSES = new Set(['running', 'queued', 'waiting_user'])

export function useAssistantChat({ isNewConversation }: UseAssistantChatOptions) {
  const dispatch = useDispatch<AppDispatch>()

  const [openAssistantSession, { isLoading: isSessionOpening }] =
    useOpenAssistantSessionMutation()
  const [startAssistantRun, { isLoading: isSending }] = useStartAssistantRunMutation()

  /** In-memory transcript for this browser session only — never loaded from a history API. */
  const [sessionHistory, setSessionHistory] = useState<AssistantHistoryMessage[]>([])
  const [sessionReady, setSessionReady] = useState(false)

  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [initialSequence, setInitialSequence] = useState(0)
  const [optimisticUsers, setOptimisticUsers] = useState<UserChatMessage[]>([])
  const [sendError, setSendError] = useState<string | null>(null)
  const [seenEvents, setSeenEvents] = useState<Record<string, AssistantRunEvent>>({})
  const [answeredInteractiveMessageIds, setAnsweredInteractiveMessageIds] = useState<
    Record<string, true>
  >({})

  const stream = useAssistantStream(activeRunId, initialSequence)
  const attachedRunIdRef = useRef<string | null>(null)
  const activeRunIdRef = useRef<string | null>(null)
  const activeRunEventsRef = useRef<AssistantRunEvent[]>([])
  const pendingOptimisticUsersRef = useRef<UserChatMessage[]>([])
  const optimisticSentAtRef = useRef<Record<string, string>>({})
  /** When backend continues the same runId after a pause, resume SSE after this sequence. */
  const lastSequenceByRunIdRef = useRef<Record<string, number>>({})
  const sessionOpenedRef = useRef(false)

  const isLive = !isNewConversation

  activeRunIdRef.current = activeRunId

  useEffect(() => {
    if (sessionOpenedRef.current) return
    sessionOpenedRef.current = true

    const purge = shouldPurgeAssistantHistory()
    markAssistantChatMounted()

    void (async () => {
      try {
        if (purge) {
          clearAssistantTranscript()
        } else {
          // Same tab / still on chat — restore UI transcript; keep DB for AI context.
          setSessionHistory(loadAssistantTranscript<AssistantHistoryMessage>())
        }

        const response = await openAssistantSession({ purge }).unwrap()
        const data = response.success ? response.data : null
        const activeRun = data?.activeRun ?? null
        const userMessages = data?.activeRunUserMessages ?? []

        if (purge) {
          // After purge, only seed user rows for an incomplete run.
          setSessionHistory(userMessages)
        } else if (userMessages.length > 0) {
          setSessionHistory((current) => appendUniqueHistoryEntries(current, userMessages))
        }

        if (activeRun && ACTIVE_RUN_STATUSES.has(activeRun.status)) {
          // Cold attach: replay durable events from sequence 0.
          attachedRunIdRef.current = activeRun.id
          setInitialSequence(0)
          setActiveRunId(activeRun.id)
        }
      } catch {
        setSendError('Unable to open the chat session. Please refresh and try again.')
      } finally {
        setSessionReady(true)
      }
    })()
  }, [openAssistantSession])

  useEffect(() => {
    if (!sessionReady) return
    saveAssistantTranscript(sessionHistory)
  }, [sessionHistory, sessionReady])

  useEffect(() => {
    if (stream.events.length === 0) return

    setSeenEvents((current) => {
      let changed = false
      const next = { ...current }
      for (const event of stream.events) {
        if (!next[event.id]) {
          next[event.id] = event
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [stream.events])

  const visibleSessionHistory = useMemo(() => {
    if (isNewConversation) return []
    return sessionHistory
  }, [isNewConversation, sessionHistory])

  const pendingOptimisticUsers = useMemo(() => {
    if (!isLive) return []

    const historyIds = new Set(visibleSessionHistory.map((item) => item.id))
    return optimisticUsers.filter((message) => !historyIds.has(message.id))
  }, [isLive, optimisticUsers, visibleSessionHistory])

  const activeRunEvents = useMemo(() => {
    if (!activeRunId) return []
    return Object.values(seenEvents)
      .filter((event) => event.runId === activeRunId)
      .sort(compareAssistantEvents)
  }, [activeRunId, seenEvents])

  const liveEventIds = useMemo(
    () => new Set(activeRunEvents.map((event) => event.id)),
    [activeRunEvents],
  )

  const conversationMessages = useMemo(() => {
    const filteredHistory =
      isLive && activeRunId
        ? visibleSessionHistory.filter((item) => {
            if (item.senderType === 'user' || item.runId !== activeRunId) return true
            return !liveEventIds.has(item.id)
          })
        : visibleSessionHistory

    return assistantHistoryToMessages(filteredHistory)
  }, [isLive, activeRunId, visibleSessionHistory, liveEventIds])

  activeRunEventsRef.current = activeRunEvents
  pendingOptimisticUsersRef.current = pendingOptimisticUsers

  useEffect(() => {
    if (!activeRunId) return
    let maxSequence = lastSequenceByRunIdRef.current[activeRunId] ?? 0
    for (const event of activeRunEvents) {
      if (event.hasBackendSequence && event.sequence > maxSequence) {
        maxSequence = event.sequence
      }
    }
    // Include sequences from skipped waiting_for_user (tracked on the stream).
    if (stream.lastSequence > maxSequence) {
      maxSequence = stream.lastSequence
    }
    if (maxSequence > 0) {
      lastSequenceByRunIdRef.current[activeRunId] = maxSequence
    }
  }, [activeRunId, activeRunEvents, stream.lastSequence])

  const isRunSettled = hasRunSettled(activeRunEvents)

  const isRunInProgress =
    isSending ||
    (activeRunId !== null && !isRunSettled && (stream.isStreaming || activeRunEvents.length === 0))

  const liveMessage = useMemo(() => {
    if (!isLive) return null

    if (activeRunId) {
      return createLiveRunMessage(activeRunId, activeRunEvents)
    }

    if (isSending) {
      return createLiveTypingMessage('sending')
    }

    return null
  }, [isLive, activeRunId, activeRunEvents, isSending])

  const messages = useMemo(() => {
    if (isNewConversation) return []

    const merged: ChatMessage[] = [...conversationMessages, ...pendingOptimisticUsers]
    if (liveMessage) merged.push(liveMessage)
    return merged
  }, [isNewConversation, conversationMessages, pendingOptimisticUsers, liveMessage])

  const commitRunToSession = useCallback(
    (runId: string, events: AssistantRunEvent[], userMessages: UserChatMessage[]) => {
      const newEntries = buildHistoryEntriesFromRun(
        runId,
        events,
        userMessages,
        optimisticSentAtRef.current,
      )

      if (newEntries.length === 0) return

      setSessionHistory((current) => appendUniqueHistoryEntries(current, newEntries))
      dispatch(
        assistantApi.util.updateQueryData('getActiveAssistantRun', undefined, (draft) => {
          draft.success = true
          draft.data = null
        }),
      )
    },
    [dispatch],
  )

  const clearRunState = useCallback(() => {
    setActiveRunId(null)
    setSeenEvents({})
    setOptimisticUsers([])
  }, [])

  const persistSettledRunIfNeeded = useCallback(() => {
    const runId = activeRunIdRef.current
    if (!runId) return false

    const events = activeRunEventsRef.current
    if (!hasRunSettled(events)) return false

    commitRunToSession(runId, events, pendingOptimisticUsersRef.current)
    clearRunState()
    return true
  }, [clearRunState, commitRunToSession])

  useEffect(() => {
    if (!activeRunId || !isRunSettled || stream.isStreaming) return
    persistSettledRunIfNeeded()
  }, [activeRunId, isRunSettled, stream.isStreaming, persistSettledRunIfNeeded])

  useEffect(() => {
    if (!stream.error || !activeRunId) return

    setSendError(stream.error)
    dispatch(
      assistantApi.util.updateQueryData('getActiveAssistantRun', undefined, (draft) => {
        draft.success = true
        draft.data = null
      }),
    )
    clearRunState()
  }, [stream.error, activeRunId, dispatch, clearRunState])

  const submitUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isSending) return

      persistSettledRunIfNeeded()

      setSendError(null)
      const optimistic = createOptimisticUserMessage(trimmed)
      optimisticSentAtRef.current[optimistic.id] = new Date().toISOString()
      setOptimisticUsers((current) => [...current, optimistic])
      setSeenEvents({})
      setActiveRunId(null)
      attachedRunIdRef.current = null

      try {
        const response = await startAssistantRun({ message: trimmed }).unwrap()
        const runId = response.data.runId
        // Same runId resume (waiting_user → continue): skip already-seen events so
        // old follow_up/waiting pauses don't immediately re-settle the stream.
        const resumeFrom = lastSequenceByRunIdRef.current[runId] ?? 0
        attachedRunIdRef.current = runId
        setInitialSequence(resumeFrom)
        setActiveRunId(runId)
      } catch (error) {
        setOptimisticUsers((current) => current.filter((message) => message.id !== optimistic.id))
        delete optimisticSentAtRef.current[optimistic.id]
        setSendError(extractErrorMessage(error))
      }
    },
    [isSending, persistSettledRunIfNeeded, startAssistantRun],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (isRunInProgress) return
      await submitUserMessage(text)
    },
    [isRunInProgress, submitUserMessage],
  )

  const canRespondToInteractiveMessage = useCallback(
    (messageId: string) => {
      if (isSending || isRunInProgress || answeredInteractiveMessageIds[messageId]) return false

      const message = messages.find((item) => item.id === messageId)
      if (!message || message.role !== 'bot') return false
      if (message.type !== 'selectors' && message.type !== 'status' && message.type !== 'summary') {
        return false
      }

      return true
    },
    [answeredInteractiveMessageIds, isRunInProgress, isSending, messages],
  )

  const markInteractiveMessageAnswered = useCallback((messageId: string) => {
    setAnsweredInteractiveMessageIds((current) =>
      current[messageId] ? current : { ...current, [messageId]: true },
    )
  }, [])

  const handleSelectorSelect = useCallback(
    (messageId: string, selectorId: string) => {
      if (!canRespondToInteractiveMessage(messageId)) return

      const message = messages.find((item) => item.id === messageId)
      if (message?.role !== 'bot' || message.type !== 'selectors') return

      const selected = message.content.selectors.find((chip) => chip.id === selectorId)
      if (!selected) return

      markInteractiveMessageAnswered(messageId)
      void submitUserMessage(selected.label)
    },
    [canRespondToInteractiveMessage, markInteractiveMessageAnswered, messages, submitUserMessage],
  )

  const handleQuestionSelect = useCallback(
    (messageId: string, optionId: string) => {
      if (!canRespondToInteractiveMessage(messageId)) return

      const message = messages.find((item) => item.id === messageId)
      if (message?.role !== 'bot' || message.type !== 'status') return

      const selected = message.content.questions?.find((option) => option.id === optionId)
      if (!selected) return

      markInteractiveMessageAnswered(messageId)
      void submitUserMessage(selected.label)
    },
    [canRespondToInteractiveMessage, markInteractiveMessageAnswered, messages, submitUserMessage],
  )

  const handleActionSelect = useCallback(
    (messageId: string, actionId: string) => {
      if (!canRespondToInteractiveMessage(messageId)) return

      const message = messages.find((item) => item.id === messageId)
      if (message?.role !== 'bot' || message.type !== 'summary') return

      const selected = message.content.actions?.find((action) => action.id === actionId)
      if (!selected) return

      markInteractiveMessageAnswered(messageId)
      void submitUserMessage(selected.label)
    },
    [canRespondToInteractiveMessage, markInteractiveMessageAnswered, messages, submitUserMessage],
  )

  const isInteractiveAnswered = useCallback(
    (messageId: string) => answeredInteractiveMessageIds[messageId] === true,
    [answeredInteractiveMessageIds],
  )

  const isBootstrapping = !sessionReady || isSessionOpening
  const isInputDisabled = isBootstrapping || isSending || isRunInProgress

  const handlers: ChatMessageHandlers = {
    onSelectorSelect: handleSelectorSelect,
    onQuestionSelect: handleQuestionSelect,
    onActionSelect: handleActionSelect,
    isInteractiveAnswered,
  }

  return {
    messages,
    isHistoryLoading: isBootstrapping,
    isSending,
    isStreaming: stream.isStreaming,
    isRunInProgress,
    isInputDisabled,
    sendError: sendError ?? stream.error,
    sendMessage,
    handlers,
  }
}
