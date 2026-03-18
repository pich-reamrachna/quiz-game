import { describe, expect, it, vi } from 'vitest'
import { GET } from './+server'

const { createDbMock, executeMock } = vi.hoisted(() => ({
	createDbMock: vi.fn(),
	executeMock: vi.fn(),
}))

vi.mock('$lib/server/db', () => ({
	createDb: createDbMock,
}))

describe('GET /api/scores', () => {
	it('uses default limit and returns rows', async () => {
		createDbMock.mockReturnValueOnce({ execute: executeMock })
		executeMock.mockResolvedValueOnce({
			rows: [{ id: 1, name: 'Alice', score: 10, created_at: '2026-01-01T00:00:00.000Z' }],
		})

		const response = await GET({ url: new URL('http://localhost/api/scores') })

		expect(executeMock).toHaveBeenCalledWith({
			sql: 'SELECT * FROM scores ORDER BY score DESC, created_at ASC LIMIT ?',
			args: [10],
		})
		expect(response.status).toBe(200)
		expect(await response.json()).toEqual([
			{ id: 1, name: 'Alice', score: 10, created_at: '2026-01-01T00:00:00.000Z' },
		])
	})

	it('clamps limit above max to 100', async () => {
		createDbMock.mockReturnValueOnce({ execute: executeMock })
		executeMock.mockResolvedValueOnce({ rows: [] })

		await GET({ url: new URL('http://localhost/api/scores?limit=999') })
		expect(executeMock).toHaveBeenCalledWith({
			sql: 'SELECT * FROM scores ORDER BY score DESC, created_at ASC LIMIT ?',
			args: [100],
		})
	})

	it('returns 500 when db throws', async () => {
		createDbMock.mockReturnValueOnce({ execute: executeMock })
		executeMock.mockRejectedValueOnce(new Error('db down'))

		const response = await GET({ url: new URL('http://localhost/api/scores?limit=3') })
		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'Failed to fetch leaderboard' })
	})
})
