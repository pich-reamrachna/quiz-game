import { describe, expect, it, vi } from 'vitest'
import { POST } from './+server'

const { createGameSessionMock } = vi.hoisted(() => ({
	createGameSessionMock: vi.fn(),
}))

vi.mock('$lib/server/gameSession.server', () => ({
	createGameSession: createGameSessionMock,
}))

describe('POST /api/game/start', () => {
	it('returns 400 when body is invalid JSON', async () => {
		const request = new Request('http://localhost/api/game/start', {
			method: 'POST',
			body: '{bad-json',
		})

		const response = await POST({
			request,
			cookies: { set: vi.fn() },
			url: new URL('http://localhost/api/game/start'),
		} as never)

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: 'Invalid JSON body' })
	})

	it('returns 201 and sets cookie when session is created', async () => {
		createGameSessionMock.mockResolvedValueOnce({
			sessionId: 'session-abc',
			timeLeftMs: 30000,
			questionIndex: 0,
			score: 0,
			question: { id: 'q1', promptEn: 'p', choices: [{ key: 'A', text: 'a' }] },
		})
		const cookieSet = vi.fn()
		const request = new Request('http://localhost/api/game/start', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ playerName: 'Alice' }),
		})

		const response = await POST({
			request,
			cookies: { set: cookieSet },
			url: new URL('http://localhost/api/game/start'),
		} as never)

		expect(response.status).toBe(201)
		expect(cookieSet).toHaveBeenCalledTimes(1)
		const body = await response.json()
		expect(body.sessionStarted).toBe(true)
		expect(body.sessionId).toBe('session-abc')
	})
})
