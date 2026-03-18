import { readFile } from 'node:fs/promises'
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
	throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')
}

const db = createClient({
	url,
	authToken,
})

const files = ['migrations/001_create_scores.sql', 'migrations/002_create_game_sessions.sql']

/** @param {string} sqlText
 * @returns {string[]} */
function toStatements(sqlText) {
	const noBom = sqlText.replace(/^\uFEFF/, '')
	const noComments = noBom
		.split(/\r?\n/)
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n')

	return noComments
		.split(';')
		.map((s) => s.trim())
		.filter(Boolean)
}

for (const file of files) {
	const raw = await readFile(file, 'utf8')
	const statements = toStatements(raw)

	await db.execute('BEGIN')
	try {
		for (let i = 0; i < statements.length; i++) {
			const sql = statements[i]
			await db.execute(sql)
		}
		await db.execute('COMMIT')
	} catch (err) {
		await db.execute('ROLLBACK')
		throw err
	}
}
