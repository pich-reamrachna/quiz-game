import { createClient } from '@libsql/client'
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from '$env/static/private'

export function createDb(): ReturnType<typeof createClient> {
	if (!TURSO_DATABASE_URL) {
		throw new Error('Missing TURSO_DATABASE_URL')
	}

	return createClient({
		url: TURSO_DATABASE_URL,
		authToken: TURSO_AUTH_TOKEN,
	})
}
