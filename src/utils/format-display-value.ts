const ISO_DATE_TIME_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?)?$/

function isMidnightUtc(date: Date) {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

function shouldShowDateTime(header: string, rawValue: string, date: Date) {
  const headerLower = header.toLowerCase()

  if (
    headerLower.includes('created') ||
    headerLower.includes('updated') ||
    headerLower.includes('time') ||
    headerLower.includes(' at')
  ) {
    return true
  }

  if (headerLower.includes('date') && !rawValue.includes('T')) {
    return false
  }

  if (headerLower.includes('date') && isMidnightUtc(date)) {
    return false
  }

  return rawValue.includes('T') && !isMidnightUtc(date)
}

export function formatDisplayValue(value: string, header = ''): string {
  const trimmed = value.trim()
  if (!trimmed || !ISO_DATE_TIME_REGEX.test(trimmed)) return value

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return value

  if (shouldShowDateTime(header, trimmed, date)) {
    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMessageTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
