import { db } from "$lib/server/db";
import { json } from '@sveltejs/kit';
import { QUESTIONS } from '$lib/questions';

export async function POST({ request }) {
    try {
        const { sessionId, questionId, answerText, currentIdx } = await request.json();

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
        const question = QUESTIONS.find(q => q.id === questionId);
        if (!question) {
            return json({ error: 'Invalid question ID' }, { status: 400 });
        }

        const choice = question.choices.find(c => c.text === answerText);
        const isCorrect = choice?.isCorrect ?? false;
        const newScore = isCorrect ? Number(session.score) + 1 : Number(session.score);

        // 5. Update session
        await db.execute({
            sql: 'UPDATE game_sessions SET score = ?, current_question_index = ? WHERE id = ?',
            args: [newScore, currentIdx + 1, sessionId]
        });

        return json({ correct: isCorrect, score: newScore });

    } catch (error) {
        console.error(error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
