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
import { finishGameSession } from './gameSession.server'

describe('gameSession.server', () => {
	const makeSession = (overrides: Partial<GameSessionRow> = {}): GameSessionRow => ({
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
		...overrides,
	})

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
		const session = makeSession()

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

	it('returns not_found when no session exists', async () => {
		dbMock.execute.mockResolvedValueOnce({ rows: [], rowsAffected: 0 })
		const result = await submitGameAnswer('missing', 'q1', 'A')
		expect(result).toEqual({ status: 'not_found' })
	})

	it('returns already_finished when session is not playing', async () => {
		dbMock.execute.mockResolvedValueOnce({
			rows: [makeSession({ status: 'finished' })],
			rowsAffected: 0,
		})
		const result = await submitGameAnswer('session-1', 'q1', 'A')
		expect(result).toEqual({ status: 'already_finished' })
	})

	it('returns invalid_session_data for broken JSON', async () => {
		dbMock.execute.mockResolvedValueOnce({
			rows: [makeSession({ question_order_json: '{bad-json' })],
			rowsAffected: 0,
		})
		const result = await submitGameAnswer('session-1', 'q1', 'A')
		expect(result).toEqual({ status: 'invalid_session_data' })
	})

	it('returns invalid_sequence for wrong question id', async () => {
		dbMock.execute.mockResolvedValueOnce({ rows: [makeSession()], rowsAffected: 0 })
		const result = await submitGameAnswer('session-1', 'q2', 'A')
		expect(result).toEqual({ status: 'invalid_sequence' })
	})

	it('returns invalid_choice for missing key in shuffled choices', async () => {
		dbMock.execute.mockResolvedValueOnce({
			rows: [
				makeSession({
					choice_order_json: JSON.stringify({
						q1: [
							{ key: 'A', text: 'a1', isCorrect: true },
							{ key: 'B', text: 'b1', isCorrect: false },
							{ key: 'B', text: 'b2', isCorrect: false },
						],
						q2: [
							{ key: 'A', text: 'a2', isCorrect: true },
							{ key: 'B', text: 'b2', isCorrect: false },
							{ key: 'C', text: 'c2', isCorrect: false },
						],
					}),
				}),
			],
			rowsAffected: 0,
		})
		const result = await submitGameAnswer('session-1', 'q1', 'C')
		expect(result).toEqual({ status: 'invalid_choice' })
	})

	it('finishes session when final question is answered', async () => {
		const tx = { execute: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
		dbMock.transaction.mockResolvedValueOnce(tx)
		dbMock.execute
			.mockResolvedValueOnce({
				rows: [makeSession({ question_order_json: JSON.stringify(['q1']) })],
				rowsAffected: 0,
			})
			.mockResolvedValueOnce({ rows: [], rowsAffected: 1 })
		tx.execute.mockResolvedValueOnce({ rowsAffected: 1 }).mockResolvedValueOnce({ rowsAffected: 1 })

		const result = await submitGameAnswer('session-1', 'q1', 'A')
		expect(result.status).toBe('finished')
		if (result.status === 'finished') {
			expect(result.score).toBe(1)
			expect(result.correct).toBe(true)
		}
		expect(tx.commit).toHaveBeenCalledTimes(1)
	})

	it('returns finished when session is expired before answer processing', async () => {
		const tx = { execute: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
		dbMock.transaction.mockResolvedValueOnce(tx)
		dbMock.execute.mockResolvedValueOnce({
			rows: [makeSession({ expires_at: new Date(Date.now() - 1_000).toISOString(), score: 4 })],
			rowsAffected: 0,
		})
		tx.execute.mockResolvedValueOnce({ rowsAffected: 1 }).mockResolvedValueOnce({ rowsAffected: 1 })

		const result = await submitGameAnswer('session-1', 'q1', 'A')
		expect(result).toEqual({ status: 'finished', correct: false, score: 4, timeLeftMs: 0 })
		expect(tx.commit).toHaveBeenCalledTimes(1)
	})

	it('returns invalid_session_data when expected question choices are malformed', async () => {
		dbMock.execute.mockResolvedValueOnce({
			rows: [
				makeSession({
					choice_order_json: JSON.stringify({
						q1: [
							{ key: 'A', text: 'a1', isCorrect: true },
							{ key: 'B', text: 'b1', isCorrect: false },
						],
					}),
				}),
			],
			rowsAffected: 0,
		})

		const result = await submitGameAnswer('session-1', 'q1', 'A')
		expect(result).toEqual({ status: 'invalid_session_data' })
	})

	it('returns invalid_sequence when final-step update races and affects zero rows', async () => {
		dbMock.execute
			.mockResolvedValueOnce({
				rows: [makeSession({ question_order_json: JSON.stringify(['q1']) })],
				rowsAffected: 0,
			})
			.mockResolvedValueOnce({ rows: [], rowsAffected: 0 })

		const result = await submitGameAnswer('session-1', 'q1', 'A')
		expect(result).toEqual({ status: 'invalid_sequence' })
	})

	it('returns invalid_sequence when continue-step update affects zero rows', async () => {
		dbMock.execute
			.mockResolvedValueOnce({ rows: [makeSession()], rowsAffected: 0 })
			.mockResolvedValueOnce({ rows: [], rowsAffected: 0 })

		const result = await submitGameAnswer('session-1', 'q1', 'A')
		expect(result).toEqual({ status: 'invalid_sequence' })
	})

	it('finishGameSession returns already_finished for non-playing session', async () => {
		dbMock.execute.mockResolvedValueOnce({
			rows: [makeSession({ status: 'finished', score: 3 })],
			rowsAffected: 0,
		})
		const result = await finishGameSession('session-1')
		expect(result.status).toBe('already_finished')
		if (result.status === 'already_finished') {
			expect(result.score).toBe(3)
		}
	})

	it('finishGameSession finalizes and returns finished state', async () => {
		const tx = { execute: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
		dbMock.transaction.mockResolvedValueOnce(tx)
		dbMock.execute
			.mockResolvedValueOnce({ rows: [makeSession({ score: 2 })], rowsAffected: 0 })
			.mockResolvedValueOnce({
				rows: [makeSession({ status: 'finished', score: 2 })],
				rowsAffected: 0,
			})
		tx.execute.mockResolvedValueOnce({ rowsAffected: 1 }).mockResolvedValueOnce({ rowsAffected: 1 })

		const result = await finishGameSession('session-1')
		expect(result).toEqual({ status: 'finished', score: 2, timeLeftMs: 0 })
		expect(tx.commit).toHaveBeenCalledTimes(1)
	})

	it('rolls back when finalize update does not affect a row', async () => {
		const tx = { execute: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
		dbMock.transaction.mockResolvedValueOnce(tx)
		dbMock.execute.mockResolvedValueOnce({
			rows: [makeSession({ expires_at: new Date(Date.now() - 1_000).toISOString(), score: 9 })],
			rowsAffected: 0,
		})
		tx.execute.mockResolvedValueOnce({ rowsAffected: 0 })

		const result = await submitGameAnswer('session-1', 'q1', 'A')
		expect(result).toEqual({ status: 'finished', correct: false, score: 9, timeLeftMs: 0 })
		expect(tx.rollback).toHaveBeenCalledTimes(1)
		expect(tx.commit).not.toHaveBeenCalled()
	})

	it('rethrows when finalize transaction execute throws', async () => {
		const tx = { execute: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
		dbMock.transaction.mockResolvedValueOnce(tx)
		dbMock.execute.mockResolvedValueOnce({
			rows: [makeSession({ expires_at: new Date(Date.now() - 1_000).toISOString() })],
			rowsAffected: 0,
		})
		tx.execute.mockRejectedValueOnce(new Error('tx fail'))

		await expect(submitGameAnswer('session-1', 'q1', 'A')).rejects.toThrow('tx fail')
		expect(tx.rollback).toHaveBeenCalledTimes(1)
	})
})
