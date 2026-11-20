import assert from 'node:assert/strict'
import test from 'node:test'
import { HttpCoachProvider } from '../src/coach/coachApi.ts'
import { COACH_SAMPLE_ANSWERS, COACH_SUGGESTIONS } from '../src/coach/coachSamples.ts'
import type { CoachResponse } from '../src/coach/coachContract.ts'

test('suggested coach conversations are explicitly demo content and cover every suggestion', () => {
  assert.equal(COACH_SUGGESTIONS.length, 4)
  for (const suggestion of COACH_SUGGESTIONS) assert.match(COACH_SAMPLE_ANSWERS[suggestion.id], /Sample preview only/)
})

test('future HTTP provider uses the same-origin contract and validates live responses', async () => {
  const oldFetch = globalThis.fetch
  let captured: { url: string; init?: RequestInit } | undefined
  const expected: CoachResponse = { conversationId: 'conversation-1', mode: 'live', message: { id: 'reply-1', role: 'assistant', content: 'Response from backend', createdAt: '2026-11-19T10:00:00.000Z' } }
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured = { url: String(input), init }
    return new Response(JSON.stringify(expected), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }) as typeof fetch
  try {
    const response = await new HttpCoachProvider().sendMessage({ message: 'Question', history: [] })
    assert.deepEqual(response, expected)
    assert.equal(captured?.url, '/api/coach/messages')
    assert.equal(captured?.init?.method, 'POST')
    assert.equal(captured?.init?.credentials, 'same-origin')
    assert.deepEqual(JSON.parse(String(captured?.init?.body)), { message: 'Question', history: [] })
    assert.equal((captured?.init?.headers as Record<string,string>)['Authorization'], undefined)
  } finally { globalThis.fetch = oldFetch }
})

test('future HTTP provider rejects malformed backend responses', async () => {
  const oldFetch = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'not a valid response' }), { status: 200 })) as typeof fetch
  try { await assert.rejects(() => new HttpCoachProvider().sendMessage({ message: 'Question', history: [] }), { code: 'invalid_response' }) }
  finally { globalThis.fetch = oldFetch }
})
