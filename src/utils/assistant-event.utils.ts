import {
  ANALYSIS_STEP_EVENT_TYPES,
  CONVERSATION_RESPONSE_EVENT_TYPES,
  PAUSE_ASSISTANT_EVENT_TYPES,
  TERMINAL_ASSISTANT_EVENT_TYPES,
} from '@/constants/assistant-api.constants'
import type {
  AssistantEventPayload,
  AssistantEventType,
  AssistantHistoryMessage,
  AssistantRunEvent,
} from '@/types/assistant.api.types'
import type {
  BotChatMessage,
  BotSelectorsChatMessage,
  BotStatusChatMessage,
  BotTextChatMessage,
  BotTypingChatMessage,
  ChatMessage,
  UserChatMessage,
} from '@/types/chat.types'
import type { AnalysisStepData } from '@/types/message.types'
import { createClientId } from '@/utils/create-client-id'

export function shouldCloseAssistantStream(eventType: AssistantEventType): boolean {
  return TERMINAL_ASSISTANT_EVENT_TYPES.has(eventType) || PAUSE_ASSISTANT_EVENT_TYPES.has(eventType)
}

const COLLAPSE_TO_LATEST_EVENT_TYPES: ReadonlySet<AssistantEventType> = new Set(['tool_start'])

const DEDUPE_IDENTICAL_EVENT_TYPES: ReadonlySet<AssistantEventType> = new Set([
  'tool_start',
  'tool_result',
])

function analysisEventContentKey(event: AssistantRunEvent): string {
  return [
    event.eventType,
    event.payload.stage?.trim() ?? '',
    event.payload.message?.trim() ?? '',
  ].join('\0')
}

export function compareAssistantEvents(left: AssistantRunEvent, right: AssistantRunEvent): number {
  const leftHasSeq = left.hasBackendSequence !== false && Number.isFinite(left.sequence)
  const rightHasSeq = right.hasBackendSequence !== false && Number.isFinite(right.sequence)

  if (leftHasSeq && rightHasSeq && left.sequence !== right.sequence) {
    return left.sequence - right.sequence
  }

  const timeDiff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  if (timeDiff !== 0) return timeDiff

  return left.sequence - right.sequence
}

export function optimizeAnalysisEvents(events: AssistantRunEvent[]): AssistantRunEvent[] {
  const sorted = [...events]
    .filter((event) => ANALYSIS_STEP_EVENT_TYPES.has(event.eventType))
    .sort(compareAssistantEvents)

  const latestByCollapsedType = new Map<AssistantEventType, AssistantRunEvent>()
  for (const event of sorted) {
    if (COLLAPSE_TO_LATEST_EVENT_TYPES.has(event.eventType)) {
      latestByCollapsedType.set(event.eventType, event)
    }
  }

  const withoutStaleStarts = sorted.filter((event) => {
    if (!COLLAPSE_TO_LATEST_EVENT_TYPES.has(event.eventType)) return true
    return latestByCollapsedType.get(event.eventType) === event
  })

  const latestIdentical = new Map<string, AssistantRunEvent>()
  for (const event of withoutStaleStarts) {
    if (DEDUPE_IDENTICAL_EVENT_TYPES.has(event.eventType)) {
      latestIdentical.set(analysisEventContentKey(event), event)
    }
  }

  const withoutDuplicateTools = withoutStaleStarts.filter((event) => {
    if (!DEDUPE_IDENTICAL_EVENT_TYPES.has(event.eventType)) return true
    return latestIdentical.get(analysisEventContentKey(event)) === event
  })

  const collapsed: AssistantRunEvent[] = []
  for (const event of withoutDuplicateTools) {
    const previous = collapsed[collapsed.length - 1]
    if (previous && analysisEventContentKey(previous) === analysisEventContentKey(event)) {
      collapsed[collapsed.length - 1] = event
      continue
    }
    collapsed.push(event)
  }

  return collapsed
}

function synthesizeAssistantEventId(
  runId: string,
  eventType: AssistantEventType,
  createdAt: string,
  payload: AssistantEventPayload,
): string {
  return [runId, eventType, createdAt, payload.stage ?? '', payload.message ?? ''].join('\0')
}

export function parseAssistantRunEvent(rawData: string): AssistantRunEvent | null {
  try {
    const data = JSON.parse(rawData) as {
      id?: string
      runId: string
      sequence?: number
      eventType: AssistantEventType
      payload?: AssistantEventPayload
      createdAt: string
    }

    if (!data.runId || !data.eventType || !data.createdAt) {
      return null
    }

    const payload = data.payload ?? {}
    const backendSequence =
      typeof data.sequence === 'number' && Number.isFinite(data.sequence) ? data.sequence : null
    const backendId =
      typeof data.id === 'string' && data.id.trim().length > 0 ? data.id.trim() : null

    return {
      id:
        backendId ??
        synthesizeAssistantEventId(data.runId, data.eventType, data.createdAt, payload),
      runId: data.runId,
      sequence: backendSequence ?? 0,
      eventType: data.eventType,
      payload,
      createdAt: data.createdAt,
      hasBackendSequence: backendSequence !== null,
    }
  } catch {
    console.error('[assistant] Failed to parse SSE event', rawData)
    return null
  }
}

export function formatAssistantTimestamp(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function sortAssistantHistory(
  history: AssistantHistoryMessage[],
): AssistantHistoryMessage[] {
  return [...history].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  )
}

function botText(id: string, text: string, timestamp: string): BotTextChatMessage {
  return {
    id,
    role: 'bot',
    type: 'text',
    timestamp,
    content: { text },
  }
}

function botTyping(id: string, timestamp: string): BotTypingChatMessage {
  return { id, role: 'bot', type: 'typing', timestamp }
}

function mapEventToBotMessage(event: AssistantRunEvent): BotChatMessage | null {
  const timestamp = formatAssistantTimestamp(event.createdAt)
  const text = event.payload.message ?? ''

  switch (event.eventType) {
    case 'follow_up_question':
      if (event.payload.values?.length) {
        const message: BotSelectorsChatMessage = {
          id: event.id,
          role: 'bot',
          type: 'selectors',
          timestamp,
          content: {
            text: text || 'Please select one of the following:',
            selectors: event.payload.values.map((value) => ({
              id: value.id,
              label: value.label,
            })),
          },
        }
        return message
      }
      return botText(event.id, text, timestamp)

    case 'confirmation_required': {
      const message: BotStatusChatMessage = {
        id: event.id,
        role: 'bot',
        type: 'status',
        timestamp,
        content: {
          text: text || 'Do you want to proceed with this action?',
          tone: 'negative',
          questions: [
            { id: `${event.id}-yes`, label: 'Yes' },
            { id: `${event.id}-no`, label: 'No' },
          ],
        },
      }
      return message
    }

    case 'permission_denied':
      return botText(
        event.id,
        text || "You don't have permission to perform this action.",
        timestamp,
      )

    case 'tool_error':
      return botText(
        event.id,
        text || 'An error occurred while processing your request.',
        timestamp,
      )

    case 'run_failed':
      return botText(
        event.id,
        text || 'Something went wrong. Please try your request again.',
        timestamp,
      )

    case 'run_cancelled':
      return botText(event.id, text || 'The request was cancelled.', timestamp)

    case 'waiting_for_user':
      return botText(event.id, text || 'Waiting for your response...', timestamp)

    case 'final_message':
    case 'partial_message':
      return botText(event.id, text, timestamp)

    default:
      return null
  }
}

function attachAnalysesFromMetadata(
  message: BotChatMessage,
  metadata: AssistantHistoryMessage['metadata'],
): BotChatMessage {
  const analyses = metadata?.analyses
  if (!analyses?.length) return message
  return { ...message, analyses }
}

function mapHistoryEntryToBotMessage(entry: AssistantHistoryMessage): BotChatMessage {
  const timestamp = formatAssistantTimestamp(entry.createdAt)
  const eventType = entry.metadata?.eventType
  const text = entry.message

  let message: BotChatMessage

  if (eventType === 'follow_up_question' && entry.metadata?.values?.length) {
    message = {
      id: entry.id,
      role: 'bot',
      type: 'selectors',
      timestamp,
      content: {
        text: text || 'Please select one of the following:',
        selectors: entry.metadata.values.map((value) => ({
          id: value.id,
          label: value.label,
        })),
      },
    }
  } else if (eventType === 'confirmation_required') {
    message = {
      id: entry.id,
      role: 'bot',
      type: 'status',
      timestamp,
      content: {
        text: text || 'Do you want to proceed with this action?',
        tone: 'negative',
        questions: [
          { id: `${entry.id}-yes`, label: 'Yes' },
          { id: `${entry.id}-no`, label: 'No' },
        ],
      },
    }
  } else if (eventType === 'permission_denied') {
    message = botText(
      entry.id,
      text || "You don't have permission to perform this action.",
      timestamp,
    )
  } else if (eventType === 'tool_error') {
    message = botText(
      entry.id,
      text || 'An error occurred while processing your request.',
      timestamp,
    )
  } else if (eventType === 'run_failed') {
    message = botText(
      entry.id,
      text || 'Something went wrong. Please try your request again.',
      timestamp,
    )
  } else if (eventType === 'run_cancelled') {
    message = botText(entry.id, text || 'The request was cancelled.', timestamp)
  } else if (eventType === 'waiting_for_user') {
    message = botText(entry.id, text || 'Waiting for your response...', timestamp)
  } else {
    message = botText(entry.id, text, timestamp)
  }

  return attachAnalysesFromMetadata(message, entry.metadata)
}

export function assistantHistoryToMessages(history: AssistantHistoryMessage[]): ChatMessage[] {
  return sortAssistantHistory(history).map((entry): ChatMessage => {
    const timestamp = formatAssistantTimestamp(entry.createdAt)

    if (entry.senderType === 'user') {
      return {
        id: entry.id,
        role: 'user',
        type: 'text',
        timestamp,
        content: { text: entry.message },
      }
    }

    return mapHistoryEntryToBotMessage(entry)
  })
}

function analysisStepDefaults(eventType: AssistantEventType): {
  title: string
  description: string
} {
  switch (eventType) {
    case 'run_started':
      return { title: 'Getting started', description: 'Starting your request…' }
    case 'thinking':
      return { title: 'Thinking', description: 'Thinking…' }
    case 'analyzing':
      return { title: 'Analyzing', description: 'Analyzing request…' }
    case 'tool_start':
      return { title: 'Running action', description: 'Running an action…' }
    case 'tool_result':
      return { title: 'Action complete', description: 'Finished an action.' }
    case 'tool_error':
      return { title: 'Action failed', description: 'An action could not be completed.' }
    case 'run_completed':
      return { title: 'Completed', description: 'Request finished.' }
    case 'run_failed':
      return { title: 'Run failed', description: 'Something went wrong.' }
    case 'run_cancelled':
      return { title: 'Cancelled', description: 'The request was cancelled.' }
    default:
      return { title: 'Step', description: '' }
  }
}

function hasRunPausedForUser(events: AssistantRunEvent[]): boolean {
  return events.some((event) => PAUSE_ASSISTANT_EVENT_TYPES.has(event.eventType))
}

function hasRunTerminated(events: AssistantRunEvent[]): boolean {
  return events.some((event) => TERMINAL_ASSISTANT_EVENT_TYPES.has(event.eventType))
}

export function hasRunSettled(events: AssistantRunEvent[]): boolean {
  return hasRunPausedForUser(events) || hasRunTerminated(events)
}

export function findSettlingAssistantEvent(events: AssistantRunEvent[]): AssistantRunEvent | null {
  const sortedEvents = [...events].sort(compareAssistantEvents)

  for (let index = sortedEvents.length - 1; index >= 0; index -= 1) {
    const event = sortedEvents[index]
    if (event && shouldCloseAssistantStream(event.eventType)) {
      return event
    }
  }

  return null
}

export function buildAnalysisSteps(events: AssistantRunEvent[]): AnalysisStepData[] {
  return optimizeAnalysisEvents(events).map((event) => {
    const defaults = analysisStepDefaults(event.eventType)
    return {
      id: event.id,
      title: event.payload.stage?.trim() || defaults.title,
      description: event.payload.message?.trim() || defaults.description,
    }
  })
}

export function buildHistoryEntriesFromRun(
  runId: string,
  events: AssistantRunEvent[],
  userMessages: UserChatMessage[],
  optimisticSentAtById: Record<string, string>,
): AssistantHistoryMessage[] {
  const sortedEvents = [...events].sort(compareAssistantEvents)
  const earliestEventTime = sortedEvents[0]?.createdAt
  const newEntries: AssistantHistoryMessage[] = []

  userMessages.forEach((msg, index) => {
    const createdAt = earliestEventTime
      ? new Date(new Date(earliestEventTime).getTime() - 1000 + index).toISOString()
      : (optimisticSentAtById[msg.id] ?? new Date().toISOString())

    newEntries.push({
      id: msg.id,
      runId,
      senderType: 'user',
      message: msg.content.text,
      metadata: null,
      createdAt,
    })
  })

  const settlingEvent = findSettlingAssistantEvent(events)
  if (settlingEvent) {
    const analyses = buildAnalysisSteps(events).map(({ id, title, description }) => ({
      id,
      title,
      description,
    }))

    newEntries.push({
      id: settlingEvent.id,
      runId,
      senderType: 'assistant',
      message: settlingEvent.payload.message ?? '',
      metadata: {
        eventType: settlingEvent.eventType,
        ...(settlingEvent.payload.values?.length ? { values: settlingEvent.payload.values } : {}),
        ...(analyses.length > 0 ? { analyses } : {}),
      },
      createdAt: settlingEvent.createdAt,
    })
  }

  return newEntries
}

function withLiveAnalyses(
  message: BotChatMessage,
  analyses: AnalysisStepData[],
  defaultAnalysesOpen: boolean,
): BotChatMessage {
  if (analyses.length === 0) return message
  return { ...message, analyses, defaultAnalysesOpen }
}

export function createLiveTypingMessage(runId: string): BotTypingChatMessage {
  return botTyping(`assistant-live-${runId}`, formatAssistantTimestamp(new Date().toISOString()))
}

export function buildLiveStreamMessage(events: AssistantRunEvent[]): BotChatMessage | null {
  if (events.length === 0) return null

  const analyses = buildAnalysisSteps(events)
  const sortedEvents = [...events].sort(compareAssistantEvents)
  const runId = sortedEvents[0]?.runId ?? 'live'

  const lastResponse = [...sortedEvents]
    .reverse()
    .find((event) => CONVERSATION_RESPONSE_EVENT_TYPES.has(event.eventType))

  if (lastResponse) {
    const message = mapEventToBotMessage(lastResponse)
    if (message) return withLiveAnalyses(message, analyses, false)
  }

  const lastPartial = [...sortedEvents].reverse().find((e) => e.eventType === 'partial_message')

  if (lastPartial) {
    const text = lastPartial.payload.message ?? ''
    const timestamp = formatAssistantTimestamp(lastPartial.createdAt)
    return withLiveAnalyses(
      botText(`assistant-live-${lastPartial.runId}`, text, timestamp),
      analyses,
      true,
    )
  }

  if (analyses.length > 0) {
    const timestamp = formatAssistantTimestamp(
      sortedEvents[sortedEvents.length - 1]?.createdAt ?? new Date().toISOString(),
    )
    return withLiveAnalyses({ ...createLiveTypingMessage(runId), timestamp }, analyses, true)
  }

  return null
}

export function createLiveRunMessage(
  runId: string,
  events: AssistantRunEvent[],
): BotChatMessage | null {
  if (events.length > 0) {
    const built = buildLiveStreamMessage(events)
    if (built) return built
  }

  const analyses = buildAnalysisSteps(events)

  if (analyses.length > 0) {
    const timestamp = formatAssistantTimestamp(new Date().toISOString())
    return withLiveAnalyses({ ...createLiveTypingMessage(runId), timestamp }, analyses, true)
  }

  return createLiveTypingMessage(runId)
}

export function createOptimisticUserMessage(text: string): UserChatMessage {
  return {
    id: createClientId('optimistic-user'),
    role: 'user',
    type: 'text',
    timestamp: formatAssistantTimestamp(new Date().toISOString()),
    content: { text },
  }
}
