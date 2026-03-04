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

function publicQuestionFromState(questionId: string, map: ChoiceOrderMap): PublicQuestion | null {
    const base = QUESTIONS.find((q) => q.id === questionId);
    const choices = map[questionId];
    if (!base || !choices || choices.length !== 3) return null;
    const reordered: Question = { ...base, choices };
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
    const tx = await db.transaction();
    try {
        const updateResult = await tx.execute({
            sql: `
                UPDATE game_sessions
                SET status = 'finished',
                    finished_at = CURRENT_TIMESTAMP,
                    score = ?,
                    score_saved = 1
                WHERE id = ? AND status = 'playing' AND score_saved = 0
            `,
            args: [finalScore, sessionId]
        });

        if (updateResult.rowsAffected === 1) {
            await tx.execute({
                sql: `
                    INSERT INTO scores (name, score, created_at)
                    SELECT player_name, ?, CURRENT_TIMESTAMP
                    FROM game_sessions
                    WHERE id = ?
                `,
                args: [finalScore, sessionId]
            });
            await tx.commit();
        } else {
            await tx.rollback();
        }
    } catch (e) {
        await tx.rollback();
        throw e;
    }
}

export async function createGameSession(playerName: string) {
    const sessionId = crypto.randomUUID();
    const questionOrder = shuffleArray(QUESTIONS.map((q) => q.id));
    const choiceOrderMap = buildChoiceOrderMap();
    const GRACE_PERIOD_MS = 5000; // Account for 3s countdown + network lag
    const expiresAt = new Date(Date.now() + GAME_DURATION_MS + GRACE_PERIOD_MS).toISOString();

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
        timeLeftMs: getTimeLeftMs(expiresAt),
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
        const updateResult = await db.execute({
            sql: `
                UPDATE game_sessions
                SET score = ?, question_index = ?
                WHERE id = ? AND status = 'playing' AND question_index = ?
            `,
            args: [newScore, nextIndex, session.id, currentIndex]
        });

        if (updateResult.rowsAffected === 0) {
            return { status: 'invalid_sequence' };
        }
        await finalizeSession(session.id, newScore);
        return { status: 'finished', correct, score: newScore, timeLeftMs: 0 };
    }

    const updateResult = await db.execute({
        sql: `
            UPDATE game_sessions
            SET score = ?, question_index = ?
            WHERE id = ? AND status = 'playing' AND question_index = ?
        `,
        args: [newScore, nextIndex, session.id, currentIndex]
    });

    if (updateResult.rowsAffected === 0) {
        return { status: 'invalid_sequence' };
    }

    const question = publicQuestionFromState(nextQuestionId, choiceOrderMap);
    if (!question) return { status: 'invalid_session_data' };
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
    const latest = await getSession(session.id);
    if (!latest) return { status: 'not_found' };
    return { status: 'finished', score: latest.score, timeLeftMs: 0 };
}
