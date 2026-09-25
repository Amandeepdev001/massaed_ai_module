export type AssistantEventType =
  | 'run_started'
  | 'thinking'
  | 'analyzing'
  | 'tool_start'
  | 'tool_result'
  | 'tool_error'
  | 'follow_up_question'
  | 'confirmation_required'
  | 'waiting_for_user'
  | 'permission_denied'
  | 'final_message'
  | 'partial_message'
  | 'run_completed'
  | 'run_failed'
  | 'run_cancelled'

export type AssistantEntityValue = {
  id: string
  label: string
  type: string
  confidence?: number
}

export type AssistantEventPayload = {
  message?: string
  stage?: string
  values?: AssistantEntityValue[]
}

export type AssistantRunEvent = {
  id: string
  runId: string
  sequence: number
  eventType: AssistantEventType
  payload: AssistantEventPayload
  createdAt: string
  hasBackendSequence?: boolean
}

export type SendMessageRequest = {
  message: string
  agencyId?: string
}

export type SendMessageResponseData = {
  runId: string
  status: 'running' | 'queued' | 'waiting_user'
}

export type AssistantApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export type StartAssistantRunResponse = AssistantApiEnvelope<SendMessageResponseData>

export type AssistantActiveRunData = {
  id: string
  status: 'running' | 'queued' | 'waiting_user' | 'completed' | 'failed' | 'cancelled' | string
  startedAt: string
  endedAt: string | null
  lastSequence: number
}

export type AssistantActiveRunResponse = AssistantApiEnvelope<AssistantActiveRunData | null>

export type AssistantHistoryAnalysisStep = {
  id: string
  title: string
  description: string
}

export type AssistantHistoryMetadata = {
  eventType?: AssistantEventType
  values?: AssistantEntityValue[]
  analyses?: AssistantHistoryAnalysisStep[]
}

export type AssistantHistoryMessage = {
  id: string
  runId: string
  senderType: 'user' | 'assistant' | 'system' | string
  message: string
  metadata: AssistantHistoryMetadata | null
  createdAt: string
}

export type AssistantHistoryResponse = AssistantApiEnvelope<AssistantHistoryMessage[]>

export type AssistantStreamState = {
  events: AssistantRunEvent[]
  isStreaming: boolean
  error: string | null
  lastSequence: number
  close: () => void
  reconnect: (fromSequence?: number) => void
}

export type UseAssistantChatOptions = {
  isNewConversation: boolean
  history: AssistantHistoryMessage[] | undefined
  isHistoryLoading: boolean
}
