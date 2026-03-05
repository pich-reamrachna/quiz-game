import { db } from '$lib/server/db'
import { json } from '@sveltejs/kit'

export async function GET({ url }) {
	try {
		// example: /api/scores?limit=10
		const limitParam = url.searchParams.get('limit')

		// limit parameter, and if not specified, default to 10
		let limit = limitParam ? parseInt(limitParam) : 10

		// if limit is below 1, use default of 10
		if (isNaN(limit) || limit < 1) limit = 10

		// limit to 100 max
		if (limit > 100) limit = 100

		// query for ranking
		const result = await db.execute({
			sql: 'SELECT * FROM scores ORDER BY score DESC, created_at ASC LIMIT ?',
			args: [limit],
		})

		// return rows
		return json(result.rows)
	} catch (error) {
		console.error(error)
		return json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
	}
}
