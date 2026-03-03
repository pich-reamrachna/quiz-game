import { db } from "$lib/server/db";
import { json } from '@sveltejs/kit';
import { QUESTIONS } from '$lib/questions';

export async function POST({ request }) {
    try {
        let payload;
        try {
            payload = await request.json();
        } catch (e) {
            return json({ error: 'Malformed JSON payload' }, { status: 400 });
        }
        const { sessionId, questionId, answerText, currentIdx } = payload;

        // 1. Fetch session
        const sessionResult = await db.execute({
            sql: 'SELECT * FROM game_sessions WHERE id = ? AND status = "active"',
            args: [sessionId]
        });

        if (sessionResult.rows.length === 0) {
            return json({ error: 'Invalid or expired session' }, { status: 403 });
        }

        const session = sessionResult.rows[0];

        // 2. Security Check: Time expirations
        if (Date.now() > Number(session.expires_at)) {
            await db.execute({
                sql: 'UPDATE game_sessions SET status = "expired" WHERE id = ?',
                args: [sessionId]
            });
            return json({ error: 'Session expired' }, { status: 403 });
        }

        // 3. Security Check: Sequencing (Prevent double-hits)
        if (Number(session.current_question_index) !== currentIdx) {
            return json({ error: 'Question out of sequence' }, { status: 400 });
        }

        // 4. Validate Answer
        const expectedQuestion = QUESTIONS[Number(session.current_question_index)];
        if (!expectedQuestion || expectedQuestion.id !== questionId) {
            return json({ error: 'Question sequence mismatch' }, { status: 400 });
        }

        const choice = expectedQuestion.choices.find(c => c.text === answerText);
        const isCorrect = choice?.isCorrect ?? false;
        const newScore = isCorrect ? Number(session.score) + 1 : Number(session.score);

        // 5. Update session
        const updateResult = await db.execute({
            sql: 'UPDATE game_sessions SET score = ?, current_question_index = ? WHERE id = ? AND current_question_index = ? AND status = ?',
            args: [newScore, currentIdx + 1, sessionId, currentIdx, 'active']
        });

        if (updateResult.rowsAffected === 0) {
            return json({ error: 'Session state conflict or expired' }, { status: 409 });
        }

        return json({ correct: isCorrect, score: newScore });

    } catch (error) {
        console.error(error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
