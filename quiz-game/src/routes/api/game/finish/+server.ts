import { db } from "$lib/server/db";
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const { sessionId } = await request.json();

        // 1. Fetch session
        const sessionResult = await db.execute({
            sql: 'SELECT * FROM game_sessions WHERE id = ? AND status = "active"',
            args: [sessionId]
        });

        if (sessionResult.rows.length === 0) {
            return json({ error: 'Invalid or expired session' }, { status: 403 });
        }

        const session = sessionResult.rows[0];

        // 2. Mark session as finished
        await db.execute({
            sql: 'UPDATE game_sessions SET status = "finished" WHERE id = ?',
            args: [sessionId]
        });

        // 3. Finalize score into the leaderboard
        await db.execute({
            sql: 'INSERT INTO scores (name, score) VALUES (?, ?)',
            args: [session.player_name, session.score]
        });

        return json({ message: 'Game finished', finalScore: session.score });

    } catch (error) {
        console.error(error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
