import { describe, expect, it, vi } from 'vitest'
import { POST } from './+server'

const { finishGameSessionMock } = vi.hoisted(() => ({
	finishGameSessionMock: vi.fn(),
}))

vi.mock('$lib/server/gameSession.server', () => ({
	finishGameSession: finishGameSessionMock,
}))

describe('POST /api/game/finish', () => {
	it('returns 401 when session cookie is missing', async () => {
		const response = await POST({
			cookies: { get: vi.fn(() => undefined) },
		} as never)

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: 'Missing session cookie' })
	})

	it('returns 200 with finished payload', async () => {
		finishGameSessionMock.mockResolvedValueOnce({
			status: 'finished',
			score: 3,
			timeLeftMs: 0,
		})

		const response = await POST({
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			finished: true,
			score: 3,
			timeLeftMs: 0,
		})
	})

	it('maps not_found to 404', async () => {
		finishGameSessionMock.mockResolvedValueOnce({ status: 'not_found' })
		const response = await POST({
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)

		expect(response.status).toBe(404)
		expect(await response.json()).toEqual({ error: 'Session not found' })
	})

	it('maps already_finished to finished response', async () => {
		finishGameSessionMock.mockResolvedValueOnce({
			status: 'already_finished',
			score: 5,
			timeLeftMs: 100,
		})
		const response = await POST({
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			finished: true,
			alreadyFinished: true,
			score: 5,
			timeLeftMs: 100,
		})
	})

	it('returns 500 on unexpected handler error', async () => {
		finishGameSessionMock.mockRejectedValueOnce(new Error('fail'))
		const response = await POST({
			cookies: { get: vi.fn(() => 'session-1') },
		} as never)

		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'Failed to finish game' })
	})
})
