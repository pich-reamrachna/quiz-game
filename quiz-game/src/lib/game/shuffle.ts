import type { Choice, ChoiceKey } from '$lib/types';

const CHOICE_LABELS: ChoiceKey[] = ['A', 'B', 'C'];

export function shuffleArray<T>(array: T[]): T[] {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

export function shuffleChoicesWithRelabel(choices: Choice[]): Choice[] {
	return shuffleArray(choices).map((choice, index) => ({
		...choice,
		key: CHOICE_LABELS[index]
	}));
}
