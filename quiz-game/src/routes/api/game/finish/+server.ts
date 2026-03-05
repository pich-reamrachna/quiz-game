// src/routes/api/game/finish/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { finishGameSession } from '$lib/server/gameSession.server';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const sessionId = cookies.get('quiz_session');
		if (!sessionId) {
			return json({ error: 'Missing session cookie' }, { status: 401 });
		}

		const result = await finishGameSession(sessionId);

		if (result.status === 'not_found') {
			return json({ error: 'Session not found' }, { status: 404 });
		}

		if (result.status === 'already_finished') {
			return json(
				{
					finished: true,
					alreadyFinished: true,
					score: result.score,
					timeLeftMs: result.timeLeftMs,
				},
				{ status: 200 },
			);
		}

		return json(
			{
				finished: true,
				score: result.score,
				timeLeftMs: result.timeLeftMs,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error('POST /api/game/finish failed:', error);
		return json({ error: 'Failed to finish game' }, { status: 500 });
	}
};
