export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseJsonObject(value: string, errorMessage = 'Invalid Digital Credentials API request payload') {
  try {
    const parsed = JSON.parse(value)
    if (isRecord(parsed)) return parsed
  } catch {
    // Throw stable domain error below.
  }

  throw new Error(errorMessage)
}
