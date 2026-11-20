import { CoachServiceError, type CoachProvider, type CoachRequest, type CoachResponse } from './coachContract.ts'

/** Same-origin backend seam. Demo mode never instantiates or calls this provider. */
export class HttpCoachProvider implements CoachProvider {
  private readonly endpoint: string
  private readonly timeoutMs: number

  constructor(endpoint = '/api/coach/messages', timeoutMs = 20_000) {
    this.endpoint = endpoint
    this.timeoutMs = timeoutMs
  }

  async sendMessage(request: CoachRequest, signal?: AbortSignal): Promise<CoachResponse> {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), this.timeoutMs)
    const forwardAbort = () => controller.abort()
    signal?.addEventListener('abort', forwardAbort, { once: true })
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
      if (!response.ok) throw new CoachServiceError('The coach service could not complete this request.', 'rejected')
      const data: unknown = await response.json()
      if (!isCoachResponse(data)) throw new CoachServiceError('The coach service returned an unexpected response.', 'invalid_response')
      return data
    } catch (error) {
      if (error instanceof CoachServiceError) throw error
      if (controller.signal.aborted) throw new CoachServiceError('The coach request timed out or was cancelled.', 'timeout')
      throw new CoachServiceError('The coach service is unavailable right now.', 'unavailable')
    } finally {
      globalThis.clearTimeout(timeout)
      signal?.removeEventListener('abort', forwardAbort)
    }
  }
}

function isCoachResponse(value: unknown): value is CoachResponse {
  if (!value || typeof value !== 'object') return false
  const response = value as Partial<CoachResponse>
  return response.mode === 'live' && typeof response.conversationId === 'string' && !!response.message &&
    typeof response.message.id === 'string' && response.message.role === 'assistant' &&
    typeof response.message.content === 'string' && typeof response.message.createdAt === 'string'
}
