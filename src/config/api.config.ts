function optionalEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** Same-origin /api only — Vite + Vercel proxy to the backend (avoids browser CORS). */
function resolveApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return '/api'
  return trimmed.replace(/\/$/, '') || '/api'
}

export const apiConfig = {
  baseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
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
