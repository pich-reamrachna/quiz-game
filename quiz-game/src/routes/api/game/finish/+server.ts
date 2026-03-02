import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { getSession, isExpired, persistScore } from '$lib/server/game-session';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
		if (!sessionId) return json({ error: 'Invalid payload.' }, { status: 400 });

		const session = await getSession(sessionId);
		if (!session) return json({ error: 'Session not found.' }, { status: 404 });
		if (session.finished) return json({ score: session.score, finished: true });
		if (isExpired(session.expires_at)) return json({ error: 'Session expired.' }, { status: 410 });

		await persistScore(session.player_name, session.score);
		await db.execute({
			sql: `UPDATE game_sessions
          SET finished = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
			args: [sessionId]
		});

		return json({ score: session.score, finished: true });
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to finish game.' }, { status: 500 });
	}
}

