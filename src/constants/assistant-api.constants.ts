import type { AssistantEventType } from '@/types/assistant.api.types'

/** Backend SSE event names. */
export const ASSISTANT_SSE_EVENT_TYPES: readonly AssistantEventType[] = [
  'run_started',
  'thinking',
  'analyzing',
  'tool_start',
  'tool_result',
  'tool_error',
  'follow_up_question',
  'confirmation_required',
  'waiting_for_user',
  'permission_denied',
  'final_message',
  'partial_message',
  'run_completed',
  'run_failed',
  'run_cancelled',
]

export const TERMINAL_ASSISTANT_EVENT_TYPES: ReadonlySet<AssistantEventType> = new Set([
  'run_completed',
  'run_failed',
  'run_cancelled',
])

export const PAUSE_ASSISTANT_EVENT_TYPES: ReadonlySet<AssistantEventType> = new Set([
  'final_message',
  'follow_up_question',
  'confirmation_required',
  'waiting_for_user',
  'permission_denied',
])

export const ANALYSIS_STEP_EVENT_TYPES: ReadonlySet<AssistantEventType> = new Set([
  'run_started',
  'thinking',
  'analyzing',
  'tool_start',
  'tool_result',
  'tool_error',
])

export const CONVERSATION_RESPONSE_EVENT_TYPES: ReadonlySet<AssistantEventType> = new Set([
  'follow_up_question',
  'confirmation_required',
  'waiting_for_user',
  'permission_denied',
  'tool_error',
  'final_message',
  'run_failed',
  'run_cancelled',
])

/**
 * REST paths relative to `VITE_API_BASE_URL` (e.g. `/api` + `/v1/user/assistant/history`).
 * Gateway prefix: /api/v1/user
 */
export const ASSISTANT_ENDPOINTS = {
  messages: '/v1/user/assistant/messages',
  history: '/v1/user/assistant/history',
  activeRun: '/v1/user/assistant/runs/active',
  runEvents: (runId: string, afterSequence: number) =>
    `/v1/user/assistant/runs/${runId}/events?afterSequence=${afterSequence}`,
} as const
