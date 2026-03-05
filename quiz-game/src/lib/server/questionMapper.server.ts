import type { Question, PublicQuestion } from '$lib/types';

export function toPublicQuestion(q: Question): PublicQuestion {
	return {
		id: q.id,
		promptEn: q.promptEn,
		choices: q.choices.map((c) => ({ key: c.key, text: c.text })),
	};
}
