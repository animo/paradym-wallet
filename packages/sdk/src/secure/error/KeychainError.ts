export class KeychainError extends Error {
  public readonly reason: 'userCancelled' | 'unknown'

  public constructor(message: string, options: ErrorOptions & { reason?: 'userCancelled' | 'unknown' } = {}) {
    super(message, options)
    this.reason = options.reason ?? 'unknown'
  }
}
