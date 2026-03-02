import { randomUUID } from 'node:crypto';
import { QUESTIONS } from '$lib/questions';
import { shuffleArray, shuffleChoicesWithRelabel } from '$lib/game/shuffle';
import { db } from '$lib/server/db';
import type { Choice, ChoiceKey, Question } from '$lib/types';

export const SESSION_TTL_SECONDS = 60 * 10;

export type PublicChoice = {
	key: ChoiceKey;
	text: string;
};

export type PublicQuestion = {
	id: string;
	promptEn: string;
	choices: PublicChoice[];
};

export type SessionQuestion = {
	id: string;
	promptEn: string;
	choices: Choice[];
};

export type SessionRow = {
	id: string;
	player_name: string;
	score: number;
	question_index: number;
	question_order: string;
	expires_at: string;
	finished: number;
};

export function sanitizeQuestion(question: Question): PublicQuestion {
	return {
		id: question.id,
		promptEn: question.promptEn,
		choices: question.choices.map((choice) => ({ key: choice.key, text: choice.text }))
	};
}

export function sanitizeSessionQuestion(question: SessionQuestion): PublicQuestion {
	return {
		id: question.id,
		promptEn: question.promptEn,
		choices: question.choices.map((choice) => ({ key: choice.key, text: choice.text }))
	};
}

export function normalizePlayerName(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > 20) return null;
	return trimmed;
}

function buildSessionQuestions(): SessionQuestion[] {
	return shuffleArray(QUESTIONS).map((q) => ({
		id: q.id,
		promptEn: q.promptEn,
		choices: shuffleChoicesWithRelabel(q.choices)
	}));
}

export function isExpired(expiresAt: string): boolean {
	const ts = Date.parse(expiresAt);
	return Number.isNaN(ts) || Date.now() > ts;
}

export async function persistScore(playerName: string, score: number): Promise<void> {
	await db.execute({
		sql: 'INSERT INTO scores (name, score, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
		args: [playerName, score]
	});
}

export async function createSession(playerName: string) {
	const sessionId = randomUUID();
	const sessionQuestions = buildSessionQuestions();
	const firstQuestion = sessionQuestions[0];
	if (!firstQuestion) {
		throw new Error('Question bank is empty.');
	}

	const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
	await db.execute({
		sql: `INSERT INTO game_sessions
      (id, player_name, score, question_index, question_order, expires_at, finished, created_at, updated_at)
      VALUES (?, ?, 0, 0, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
		args: [sessionId, playerName, JSON.stringify(sessionQuestions), expiresAt]
	});

	return {
		sessionId,
		question: sanitizeSessionQuestion(firstQuestion),
		totalQuestions: QUESTIONS.length
	};
}

export async function getSession(sessionId: string): Promise<SessionRow | null> {
	const result = await db.execute({
		sql: 'SELECT id, player_name, score, question_index, question_order, expires_at, finished FROM game_sessions WHERE id = ?',
		args: [sessionId]
	});

	const row = result.rows[0] as Record<string, unknown> | undefined;
	if (!row) return null;

	return {
		id: String(row.id),
		player_name: String(row.player_name),
		score: Number(row.score),
		question_index: Number(row.question_index),
		question_order: String(row.question_order),
		expires_at: String(row.expires_at),
		finished: Number(row.finished)
	};
}
