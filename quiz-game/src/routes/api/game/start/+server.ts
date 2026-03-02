import { json } from '@sveltejs/kit';
import { createSession, normalizePlayerName } from '$lib/server/game-session';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const playerName = normalizePlayerName(body?.playerName);
		if (!playerName) {
			return json({ error: 'Name must be between 1 and 20 characters.' }, { status: 400 });
		}

		const session = await createSession(playerName);
		return json(
			{
				sessionId: session.sessionId,
				question: session.question,
				totalQuestions: session.totalQuestions,
				score: 0
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to start game.' }, { status: 500 });
	}
}

