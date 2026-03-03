import { db } from '$lib/server/db';
import { QUESTIONS } from '$lib/server/questions.server';
import { toPublicQuestion } from '$lib/server/questionMapper.server';
import type { Choice, ChoiceKey, FinishGameSessionResult, GameSessionRow, PublicQuestion, Question, SubmitAnswerResult
} from '$lib/types';

const GAME_DURATION_MS = 30_000;
const LABELS: ChoiceKey[] = ['A', 'B', 'C'];

type ChoiceOrderMap = Record<string, Choice[]>;

function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
    return copy;
}

function buildChoiceOrderMap(): ChoiceOrderMap {
    const map: ChoiceOrderMap = {};
        for (const q of QUESTIONS) {
            map[q.id] = shuffleArray(q.choices).map((c, i) => ({ ...c, key: LABELS[i] }));
        }
    return map;
}

function publicQuestionFromState(questionId: string, map: ChoiceOrderMap): PublicQuestion {
    const base = QUESTIONS.find((q) => q.id === questionId);
    if (!base) throw new Error(`Question not found: ${questionId}`);
    const reordered: Question = { ...base, choices: map[questionId] };
    return toPublicQuestion(reordered);
}

function getTimeLeftMs(expiresAtIso: string): number {
    return Math.max(0, new Date(expiresAtIso).getTime() - Date.now());
}

function isExpired(expiresAtIso: string): boolean {
    return getTimeLeftMs(expiresAtIso) <= 0;
}

async function getSession(sessionId: string): Promise<GameSessionRow | null> {
    const result = await db.execute({
        sql: 'SELECT * FROM game_sessions WHERE id = ? LIMIT 1',
        args: [sessionId]
    });

    const row = result.rows[0];
    return row ? (row as unknown as GameSessionRow) : null;
}

async function finalizeSession(sessionId: string, finalScore: number): Promise<void> {
    await db.execute({
        sql: `
            UPDATE game_sessions
            SET status = 'finished',
                finished_at = CURRENT_TIMESTAMP,
                score = ?
            WHERE id = ? AND status = 'playing'
        `,
        args: [finalScore, sessionId]
    });

    await db.execute({
        sql: `
            INSERT INTO scores (name, score, created_at)
            SELECT player_name, ?, CURRENT_TIMESTAMP
            FROM game_sessions
            WHERE id = ? AND score_saved = 0
        `,
        args: [finalScore, sessionId]
    });

    await db.execute({
        sql: 'UPDATE game_sessions SET score_saved = 1 WHERE id = ?',
        args: [sessionId]
    });
}

export async function createGameSession(playerName: string) {
    const sessionId = crypto.randomUUID();
    const questionOrder = shuffleArray(QUESTIONS.map((q) => q.id));
    const choiceOrderMap = buildChoiceOrderMap();
    const expiresAt = new Date(Date.now() + GAME_DURATION_MS).toISOString();

    await db.execute({
        sql: `
        INSERT INTO game_sessions (
            id, player_name, status, score, question_index,
            question_order_json, choice_order_json, expires_at, score_saved
        )
        VALUES (?, ?, 'playing', 0, 0, ?, ?, ?, 0)
        `,
        args: [sessionId, playerName, JSON.stringify(questionOrder), JSON.stringify(choiceOrderMap), expiresAt]
    });

    return {
        sessionId,
        timeLeftMs: GAME_DURATION_MS,
        questionIndex: 0,
        score: 0,
        question: publicQuestionFromState(questionOrder[0], choiceOrderMap)
    };
}

export async function submitGameAnswer(
    sessionId: string,
    questionId: string,
    choiceKey: ChoiceKey
): Promise<SubmitAnswerResult> {
    const session = await getSession(sessionId);
    if (!session) return { status: 'not_found' };
    if (session.status !== 'playing') return { status: 'already_finished' };

    let questionOrder: string[];
    let choiceOrderMap: ChoiceOrderMap;
    try {
        questionOrder = JSON.parse(session.question_order_json) as string[];
        choiceOrderMap = JSON.parse(session.choice_order_json) as ChoiceOrderMap;
    } catch {
        return { status: 'invalid_session_data' };
    }

    const currentIndex = session.question_index;
    const expectedQuestionId = questionOrder[currentIndex];

    if (!expectedQuestionId || isExpired(session.expires_at)) {
        await finalizeSession(session.id, session.score);
        return { status: 'finished', correct: false, score: session.score, timeLeftMs: 0 };
    }

    if (questionId !== expectedQuestionId) {
        return { status: 'invalid_sequence' };
    }

    const shuffledChoices = choiceOrderMap[questionId];
    if (!shuffledChoices || shuffledChoices.length !== 3) {
        return { status: 'invalid_session_data' };
    }

    const selected = shuffledChoices.find((c) => c.key === choiceKey);
    if (!selected) return { status: 'invalid_choice' };

    const correct = selected.isCorrect;
    const newScore = correct ? session.score + 1 : session.score;
    const nextIndex = currentIndex + 1;
    const nextQuestionId = questionOrder[nextIndex];

    if (!nextQuestionId || isExpired(session.expires_at)) {
        await db.execute({
            sql: `
                UPDATE game_sessions
                SET score = ?, question_index = ?, status = 'finished', finished_at = CURRENT_TIMESTAMP
                WHERE id = ? AND status = 'playing'
            `,
            args: [newScore, nextIndex, session.id]
        });
        await finalizeSession(session.id, newScore);
        return { status: 'finished', correct, score: newScore, timeLeftMs: 0 };
    }

    await db.execute({
        sql: `
            UPDATE game_sessions
            SET score = ?, question_index = ?
            WHERE id = ? AND status = 'playing'
        `,
        args: [newScore, nextIndex, session.id]
    });

    const question = publicQuestionFromState(nextQuestionId, choiceOrderMap);
    return {
        status: 'continue',
        correct,
        score: newScore,
        questionIndex: nextIndex,
        question,
        timeLeftMs: getTimeLeftMs(session.expires_at)
    };
}

export async function finishGameSession(sessionId: string): Promise<FinishGameSessionResult> {
    const session = await getSession(sessionId);
    if (!session) return { status: 'not_found' };

    if (session.status !== 'playing') {
        return {
            status: 'already_finished',
            score: session.score,
            timeLeftMs: getTimeLeftMs(session.expires_at)
        };
    }

    await finalizeSession(session.id, session.score);
    return { status: 'finished', score: session.score, timeLeftMs: 0 };
}
