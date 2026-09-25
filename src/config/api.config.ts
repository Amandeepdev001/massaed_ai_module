function optionalEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  userId: import.meta.env.VITE_USER_ID ?? '123456',
  sessionId: optionalEnv(import.meta.env.VITE_SESSION_ID),
  agencyId: optionalEnv(import.meta.env.VITE_AGENCY_ID),
} as const

export function buildAssistantHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  headers.set('x-user-id', apiConfig.userId)
  if (apiConfig.sessionId) headers.set('x-session-id', apiConfig.sessionId)
  if (!headers.has('x-request-id')) {
    headers.set('x-request-id', crypto.randomUUID())
  }
  return headers
}
