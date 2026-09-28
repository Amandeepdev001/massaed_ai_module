const TRANSCRIPT_KEY = 'massaed-assistant-transcript'
const LEFT_KEY = 'massaed-assistant-chat-left'
const ALIVE_KEY = 'massaed-assistant-chat-alive'

/**
 * Purge DB history only on browser refresh or when the chat screen is reopened
 * after leaving — not on remount/scroll while staying on the page.
 */
export function shouldPurgeAssistantHistory(): boolean {
  if (typeof window === 'undefined') return true

  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined
  if (nav?.type === 'reload') return true

  if (sessionStorage.getItem(LEFT_KEY) === '1') return true

  // First visit to chat in this tab session.
  if (sessionStorage.getItem(ALIVE_KEY) !== '1') return true

  return false
}

export function markAssistantChatMounted(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ALIVE_KEY, '1')
  sessionStorage.removeItem(LEFT_KEY)
}

/** Call from chat page unmount so the next open is treated as a reopen. */
export function markAssistantChatLeft(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LEFT_KEY, '1')
  sessionStorage.removeItem(ALIVE_KEY)
}

export function loadAssistantTranscript<T>(): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(TRANSCRIPT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function saveAssistantTranscript(messages: unknown[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(messages))
  } catch {
    // Ignore quota / private-mode failures — in-memory transcript still works.
  }
}

export function clearAssistantTranscript(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TRANSCRIPT_KEY)
}
