import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createDbMock, dbMock } = vi.hoisted(() => {
	const db = {
		execute: vi.fn(),
		transaction: vi.fn(),
	}

	return {
		createDbMock: vi.fn(() => db),
		dbMock: db,
	}
})

vi.mock('$lib/server/db', () => ({
	createDb: createDbMock,
}))

import { createGameSession, submitGameAnswer } from './gameSession.server'
import type { GameSessionRow } from '$lib/types/types'

describe('gameSession.server', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('creates a game session with a public first question', async () => {
		dbMock.execute.mockResolvedValueOnce({ rows: [], rowsAffected: 1 })

		const result = await createGameSession('Alice')

		expect(dbMock.execute).toHaveBeenCalledTimes(1)
		expect(result.sessionId).toBeTypeOf('string')
		expect(result.questionIndex).toBe(0)
		expect(result.score).toBe(0)
		expect(result.timeLeftMs).toBeGreaterThan(0)
		expect(result.question).toBeDefined()
		expect(result.question?.choices).toHaveLength(3)

		const insertPayload = dbMock.execute.mock.calls[0]?.[0]
		const questionOrder = JSON.parse(String(insertPayload?.args?.[2])) as string[]
		expect(questionOrder.length).toBeGreaterThan(0)
		expect(result.question?.id).toBe(questionOrder[0])
	})

	it('submits an answer and returns next question when session continues', async () => {
		const session: GameSessionRow = {
			id: 'session-1',
			player_name: 'Alice',
			status: 'playing',
			score: 0,
			question_index: 0,
			question_order_json: JSON.stringify(['q1', 'q2']),
			choice_order_json: JSON.stringify({
				q1: [
					{ key: 'A', text: 'a1', isCorrect: true },
					{ key: 'B', text: 'b1', isCorrect: false },
					{ key: 'C', text: 'c1', isCorrect: false },
				],
				q2: [
					{ key: 'A', text: 'a2', isCorrect: true },
					{ key: 'B', text: 'b2', isCorrect: false },
					{ key: 'C', text: 'c2', isCorrect: false },
				],
			}),
			expires_at: new Date(Date.now() + 60_000).toISOString(),
			score_saved: 0,
		}

		dbMock.execute
			.mockResolvedValueOnce({ rows: [session], rowsAffected: 0 })
			.mockResolvedValueOnce({ rows: [], rowsAffected: 1 })

		const result = await submitGameAnswer('session-1', 'q1', 'A')

		expect(result.status).toBe('continue')
		if (result.status === 'continue') {
			expect(result.correct).toBe(true)
			expect(result.score).toBe(1)
			expect(result.questionIndex).toBe(1)
			expect(result.question.id).toBe('q2')
			expect(result.question.choices).toHaveLength(3)
			expect(result.timeLeftMs).toBeGreaterThan(0)
		}
	})
})
