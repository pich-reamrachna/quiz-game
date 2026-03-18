import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn(() => ({ execute: vi.fn() }))

vi.mock('@libsql/client', () => ({
	createClient: createClientMock,
}))

async function importDbWithEnv(
	url: string | undefined,
	token: string | undefined,
): Promise<typeof import('./db')> {
	vi.resetModules()
	vi.doMock('$env/static/private', () => ({
		TURSO_DATABASE_URL: url,
		TURSO_AUTH_TOKEN: token,
	}))
	return import('./db')
}

describe('createDb', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('throws when TURSO_DATABASE_URL is missing', async () => {
		const mod = await importDbWithEnv('', 'token-1')

		expect(() => mod.createDb()).toThrow('Missing TURSO_DATABASE_URL')
		expect(createClientMock).not.toHaveBeenCalled()
	})

	it('creates libsql client with env url and token', async () => {
		const mod = await importDbWithEnv('libsql://db.example.turso.io', 'token-2')

		mod.createDb()

		expect(createClientMock).toHaveBeenCalledWith({
			url: 'libsql://db.example.turso.io',
			authToken: 'token-2',
		})
	})
})
