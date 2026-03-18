import { describe, expect, it, vi } from 'vitest'
import { POST } from './+server'

const { submitGameAnswerMock } = vi.hoisted(() => ({
	submitGameAnswerMock: vi.fn(),
}))

vi.mock('$lib/server/gameSession.server', () => ({
	submitGameAnswer: submitGameAnswerMock,
}))

describe('POST /api/game/answer', () => {
	it('returns 401 when session cookie is missing', async () => {
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})

		const response = await POST({
			request,
			cookies: { get: vi.fn(() => undefined) },
		} as never)

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: 'Missing session cookie' })
	})

	it('returns 200 finished payload for finished result', async () => {
		submitGameAnswerMock.mockResolvedValueOnce({
			status: 'finished',
			correct: true,
			score: 2,
			timeLeftMs: 0,
		})
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})

		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			finished: true,
			correct: true,
			score: 2,
			timeLeftMs: 0,
		})
	})

	it('returns 400 for invalid payload', async () => {
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: '', choiceKey: 'Z' }),
		})

		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: 'Invalid answer payload' })
	})

	it('maps invalid_sequence to 409', async () => {
		submitGameAnswerMock.mockResolvedValueOnce({ status: 'invalid_sequence' })
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})

		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)

		expect(response.status).toBe(409)
		expect(await response.json()).toEqual({ error: 'Question out of sequence' })
	})

	it('returns continue payload for continue result', async () => {
		submitGameAnswerMock.mockResolvedValueOnce({
			status: 'continue',
			correct: false,
			score: 1,
			questionIndex: 1,
			question: { id: 'q2', promptEn: 'p2', choices: [{ key: 'A', text: 'a2' }] },
			timeLeftMs: 12345,
		})
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})

		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			finished: false,
			correct: false,
			score: 1,
			questionIndex: 1,
			question: { id: 'q2', promptEn: 'p2', choices: [{ key: 'A', text: 'a2' }] },
			timeLeftMs: 12345,
		})
	})

	it('maps not_found to 404', async () => {
		submitGameAnswerMock.mockResolvedValueOnce({ status: 'not_found' })
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})
		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)
		expect(response.status).toBe(404)
		expect(await response.json()).toEqual({ error: 'Session not found' })
	})

	it('maps already_finished to 409', async () => {
		submitGameAnswerMock.mockResolvedValueOnce({ status: 'already_finished' })
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})
		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)
		expect(response.status).toBe(409)
		expect(await response.json()).toEqual({ error: 'Game already finished' })
	})

	it('maps invalid_choice to 400', async () => {
		submitGameAnswerMock.mockResolvedValueOnce({ status: 'invalid_choice' })
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})
		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)
		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: 'Invalid choice key' })
	})

	it('maps invalid_session_data to 500', async () => {
		submitGameAnswerMock.mockResolvedValueOnce({ status: 'invalid_session_data' })
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})
		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)
		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'Corrupt session data' })
	})

	it('returns 400 when request body is invalid JSON', async () => {
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			body: '{bad-json',
		})
		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)
		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: 'Invalid JSON body' })
	})

	it('returns 500 on unexpected handler error', async () => {
		submitGameAnswerMock.mockRejectedValueOnce(new Error('boom'))
		const request = new Request('http://localhost/api/game/answer', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ questionId: 'q1', choiceKey: 'A' }),
		})
		const response = await POST({
			request,
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)
		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'Failed to submit answer' })
	})
})
