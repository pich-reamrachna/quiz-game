import { json, type RequestHandler } from '@sveltejs/kit';
import { createGameSession } from '$lib/server/gameSession.server';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	// Validates name
	const playerName =
		typeof body === 'object' &&
		body !== null &&
		'playerName' in body &&
		typeof (body as { playerName: unknown }).playerName === 'string'
			? (body as { playerName: string }).playerName.trim()
			: '';

	if (playerName.length < 1 || playerName.length > 20) {
		return json({ error: 'Name must be between 1 and 20 characters.' }, { status: 400 });
	}

	// creates session
	try {
		const session = await createGameSession(playerName);

		// set cookies
		cookies.set('quiz_session', session.sessionId, {
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			path: '/',
			maxAge: 30,
		});

		// return first public question
		return json({ sessionStarted: true, ...session }, { status: 201 });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to start game' }, { status: 500 });
	}
};
