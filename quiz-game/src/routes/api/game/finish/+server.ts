import { db } from "$lib/server/db";
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        let payload;
        try {
            payload = await request.json();
        } catch (e) {
            return json({ error: 'Malformed JSON payload' }, { status: 400 });
        }
        const { sessionId } = payload;
        
        if (!sessionId || (typeof sessionId !== 'string' && typeof sessionId !== 'number')) {
            return json({ error: 'Session ID is required and must be a string or number' }, { status: 400 });
        }

        // 1. Fetch session
        const sessionResult = await db.execute({
            sql: 'SELECT * FROM game_sessions WHERE id = ? AND status = "active" AND expires_at > ?',
            args: [sessionId, Date.now()]
        });

        if (sessionResult.rows.length === 0) {
            return json({ error: 'Invalid or expired session' }, { status: 403 });
        }

        const session = sessionResult.rows[0];

        // 2 & 3. Atomic finalize session and insert score
        const tx = await db.transaction("write");
        try {
            const updateResult = await tx.execute({
                sql: 'UPDATE game_sessions SET status = "finished" WHERE id = ? AND status != "finished" AND expires_at > ?',
                args: [sessionId, Date.now()]
            });

            if (updateResult.rowsAffected > 0) {
                await tx.execute({
                    sql: 'INSERT INTO scores (name, score) VALUES (?, ?)',
                    args: [session.player_name, session.score]
                });
                await tx.commit();
            } else {
                await tx.rollback();
                return json({ error: 'Session already finished or expired' }, { status: 403 });
            }
        } catch (error) {
            await tx.rollback();
            throw error;
        }

        return json({ message: 'Game finished', finalScore: session.score });

    } catch (error) {
        console.error(error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
