import { apiConfig, buildAssistantHeaders } from '@/config/api.config'
import { ASSISTANT_ENDPOINTS } from '@/constants/assistant-api.constants'
import type { AssistantRunEvent } from '@/types/assistant.api.types'
import {
  parseAssistantRunEvent,
  shouldCloseAssistantStream,
} from '@/utils/assistant-event.utils'

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

function parseSseBlock(block: string): { id?: string; event?: string; data?: string } | null {
  const lines = block.split(/\r?\n/)
  let id: string | undefined
  let event: string | undefined
  const dataLines: string[] = []

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue
    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    const rawValue = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1)
    const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue

    if (field === 'id') id = value
    else if (field === 'event') event = value
    else if (field === 'data') dataLines.push(value)
  }

  if (dataLines.length === 0 && !event && !id) return null
  return { id, event, data: dataLines.join('\n') }
}

export type AssistantSseHandlers = {
  onEvent: (event: AssistantRunEvent) => void
  onError?: (message: string) => void
  onClose?: () => void
}

/**
 * Fetch-based SSE (EventSource cannot send x-user-id). Close rules match IMPACT:
 * terminal + pause events end the stream.
 */
export function subscribeAssistantRunEvents(
  runId: string,
  afterSequence: number,
  handlers: AssistantSseHandlers,
): () => void {
  const controller = new AbortController()
  const url = joinUrl(apiConfig.baseUrl, ASSISTANT_ENDPOINTS.runEvents(runId, afterSequence))

  void (async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildAssistantHeaders({ Accept: 'text/event-stream' }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`SSE failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('SSE response has no body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split(/\r?\n\r?\n/)
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const parsed = parseSseBlock(part.trim())
          if (!parsed?.data) continue

          const event = parseAssistantRunEvent(parsed.data)
          if (!event) continue

          handlers.onEvent(event)

          if (shouldCloseAssistantStream(event.eventType)) {
            controller.abort()
            handlers.onClose?.()
            return
          }
        }
      }

      handlers.onClose?.()
    } catch (error) {
      if (controller.signal.aborted) {
        handlers.onClose?.()
        return
      }
      const message =
        error instanceof Error
          ? error.message
          : 'The connection to the assistant was interrupted. Please try again.'
      handlers.onError?.(message)
    }
  })()

  return () => controller.abort()
}
