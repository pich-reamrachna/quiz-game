import { json, type RequestHandler } from '@sveltejs/kit'
import { submitGameAnswer } from '$lib/server/gameSession.server'
import type { ChoiceKey } from '$lib/types/types'

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const sessionId = cookies.get('quiz_session')
		if (!sessionId) {
			return json({ error: 'Missing session cookie' }, { status: 401 })
		}

		let body: unknown
		try {
			body = await request.json()
		} catch {
			return json({ error: 'Invalid JSON body' }, { status: 400 })
		}

		const questionId =
			typeof body === 'object' &&
			body &&
			'questionId' in body &&
			typeof (body as { questionId: unknown }).questionId === 'string'
				? (body as { questionId: string }).questionId
				: ''

		const choiceKey =
			typeof body === 'object' &&
			body &&
			'choiceKey' in body &&
			typeof (body as { choiceKey: unknown }).choiceKey === 'string'
				? (body as { choiceKey: string }).choiceKey
				: ''

		if (!questionId || !['A', 'B', 'C'].includes(choiceKey)) {
			return json({ error: 'Invalid answer payload' }, { status: 400 })
		}

		const result = await submitGameAnswer(sessionId, questionId, choiceKey as ChoiceKey)

		if (result.status === 'not_found') {
			return json({ error: 'Session not found' }, { status: 404 })
		}
		if (result.status === 'already_finished') {
			return json({ error: 'Game already finished' }, { status: 409 })
		}
		if (result.status === 'invalid_sequence') {
			return json({ error: 'Question out of sequence' }, { status: 409 })
		}
		if (result.status === 'invalid_choice') {
			return json({ error: 'Invalid choice key' }, { status: 400 })
		}
		if (result.status === 'invalid_session_data') {
			return json({ error: 'Corrupt session data' }, { status: 500 })
		}

		if (result.status === 'finished') {
			return json(
				{
					finished: true,
					correct: result.correct,
					score: result.score,
					timeLeftMs: result.timeLeftMs,
				},
				{ status: 200 },
			)
		}

		return json(
			{
				finished: false,
				correct: result.correct,
				score: result.score,
				questionIndex: result.questionIndex,
				question: result.question,
				timeLeftMs: result.timeLeftMs,
			},
			{ status: 200 },
		)
	} catch (error) {
		console.error('POST /api/game/answer failed:', error)
		return json({ error: 'Failed to submit answer' }, { status: 500 })
	}
}
