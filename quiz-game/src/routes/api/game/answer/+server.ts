import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { ChoiceKey } from '$lib/types';
import {
	getSession,
	isExpired,
	persistScore,
	sanitizeSessionQuestion,
	type SessionQuestion
} from '$lib/server/game-session';

function isChoiceKey(value: unknown): value is ChoiceKey {
	return value === 'A' || value === 'B' || value === 'C';
}

export async function POST({ request }) {
	try {
		const body = await request.json();
		const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
		const choiceKey = body?.choiceKey;

		if (!sessionId || !isChoiceKey(choiceKey)) {
			return json({ error: 'Invalid payload.' }, { status: 400 });
		}

		const session = await getSession(sessionId);
		if (!session) return json({ error: 'Session not found.' }, { status: 404 });
		if (session.finished) return json({ error: 'Session already finished.' }, { status: 409 });
		if (isExpired(session.expires_at)) return json({ error: 'Session expired.' }, { status: 410 });

		const sessionQuestions = JSON.parse(session.question_order) as SessionQuestion[];
		const currentQuestion = sessionQuestions[session.question_index];
		if (!currentQuestion) return json({ error: 'Question not found.' }, { status: 500 });

		const chosen = currentQuestion.choices.find((c) => c.key === choiceKey);
		const correct = currentQuestion.choices.find((c) => c.isCorrect);
		if (!chosen || !correct) return json({ error: 'Invalid question data.' }, { status: 500 });

		const nextScore = session.score + (chosen.isCorrect ? 1 : 0);
		const nextIndex = session.question_index + 1;
		const finished = nextIndex >= sessionQuestions.length;

		if (finished) {
			await persistScore(session.player_name, nextScore);
			await db.execute({
				sql: `UPDATE game_sessions
            SET score = ?, question_index = ?, finished = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
				args: [nextScore, nextIndex, sessionId]
			});

			return json({
				correct: chosen.isCorrect,
				correctKey: correct.key,
				score: nextScore,
				finished: true
			});
		}

		const nextQuestion = sessionQuestions[nextIndex];
		if (!nextQuestion) return json({ error: 'Next question not found.' }, { status: 500 });

		await db.execute({
			sql: `UPDATE game_sessions
          SET score = ?, question_index = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
			args: [nextScore, nextIndex, sessionId]
		});

		return json({
			correct: chosen.isCorrect,
			correctKey: correct.key,
			score: nextScore,
			finished: false,
			questionIndex: nextIndex + 1,
			question: sanitizeSessionQuestion(nextQuestion)
		});
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to submit answer.' }, { status: 500 });
	}
}
