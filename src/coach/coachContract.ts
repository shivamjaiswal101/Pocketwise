/** Stable application/backend contract for future authenticated coach requests. */
export type CoachRole = 'user' | 'assistant'
export type CoachMessage = {
  id: string
  role: CoachRole
  content: string
  createdAt: string
}
export type CoachRequest = {
  conversationId?: string
  message: string
  history: CoachMessage[]
}
export type CoachResponse = {
  conversationId: string
  message: CoachMessage
  mode: 'live'
}
export interface CoachProvider {
  sendMessage(request: CoachRequest, signal?: AbortSignal): Promise<CoachResponse>
}

export class CoachServiceError extends Error {
  readonly code: 'unavailable' | 'timeout' | 'invalid_response' | 'rejected'

  constructor(message: string, code: 'unavailable' | 'timeout' | 'invalid_response' | 'rejected') {
    super(message)
    this.name = 'CoachServiceError'
    this.code = code
  }
}
