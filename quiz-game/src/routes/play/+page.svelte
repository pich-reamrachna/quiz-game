<script lang="ts">
	import './quiz.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { createGameEngine } from '$lib/game/engine';
	import { QUESTIONS } from '$lib/questions';
	import type { Question } from '$lib/types';
	import { audioManager } from '$lib/audioManager.svelte';

	const TOTAL_TIME = 5;
	const engine = createGameEngine(QUESTIONS);

	let name = $derived($page.url.searchParams.get('name') ?? '');

	let currentQuestion = $state<Question | null>(null);
	let questionIndex = $state(0);
	let score = $state(0);
	let timeLeft = $state(TOTAL_TIME);
	let selectedKey = $state<string | null>(null);
	let phase = $state<'playing' | 'feedback'>('playing');

	const progress = $derived((timeLeft / TOTAL_TIME) * 100);
	const timerColor = $derived(timeLeft > 10 ? '#a060e0' : timeLeft > 5 ? '#f59e0b' : '#ef4444');

	function startTimer() {
		engine.startTimer(
			TOTAL_TIME,
			(secondsLeft) => {
				timeLeft = secondsLeft;
			},
			() => {
				void endGame();
			}
		);
	}

	let pendingAdvance: ReturnType<typeof setTimeout> | null = null; // stores the ID of the 900ms feedback timeout
	let hasEnded = false;

	function choose(key: string) {
		if (phase !== 'playing' || !currentQuestion) return;

		audioManager.playSfx('click');

		const chosen = currentQuestion.choices.find((c) => c.key === key);
		const correct = chosen?.isCorrect ?? false;

		selectedKey = key;
		phase = 'feedback';
		if (correct) {
			score += 1;
			audioManager.playSfx('correct');
		} else {
			audioManager.playSfx('wrong');
		}

		// After the 900ms feedback delay, continue only if the game has not ended
		pendingAdvance = setTimeout(() => {
			if (hasEnded) return;

			engine.nextQuestion();
			const state = engine.getState();

			// When we answer the last question (no more question)
			if (state.status === 'finished' || !state.currentQuestion) {
				void endGame();
			} else {
				currentQuestion = state.currentQuestion;
				questionIndex = Math.max(0, state.questionCount - 1);
				selectedKey = null;
				phase = 'playing';
			}
		}, 900);
	}

	async function endGame() {
		if (hasEnded) return; // prevent multiple calls to endGame()
		hasEnded = true;

		if (pendingAdvance) {
			clearTimeout(pendingAdvance);
			pendingAdvance = null;
		}

		engine.stopTimer();

		try {
			await fetch('/api/scores', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerName: name, score })
			});
		} catch (e) {
			console.error('Failed to save score:', e);
		}
		goto('/leaderboard');
	}

	onMount(() => {
		if (!name) {
			goto('/');
			return;
		}

		audioManager.playQuizBgm();
		
		engine.start(name, TOTAL_TIME);
		engine.nextQuestion();
		const state = engine.getState();
		
		if (state.status === 'finished' || !state.currentQuestion) {
			void endGame();
			return;
		}
		
		currentQuestion = state.currentQuestion;
		questionIndex = Math.max(0, state.questionCount - 1); // defensive: prevent negative index
		score = 0;
		startTimer();
	});

	onDestroy(() => {
		if (pendingAdvance) {
			clearTimeout(pendingAdvance);
		}
		engine.stopTimer();
		audioManager.fadeOut();
	});
</script>

<svelte:head>
	<title>日本語クイズ</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		href="https://fonts.googleapis.com/css2?family=Zen+Dots&family=Noto+Sans+JP:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	<div class="bg-grid"></div>

	<main class="card">
		<div class="top-bar">
			<span class="q-num">
				Q&nbsp;{questionIndex + 1}
			</span>

			<span class="score-badge">✓ {score}</span>

			<div class="timer-wrap">
				<span class="timer-num" style="color: {timerColor}">{timeLeft}</span>
				<span class="timer-label">sec</span>
			</div>
		</div>

		<div class="timer-bar-track">
			<div
				class="timer-bar-fill"
				style="width: {progress}%; background: {timerColor}"
			></div>
		</div>

		{#if currentQuestion}
			<div class="prompt-box">
				<p class="prompt-label">Translate to Japanese</p>
				<p class="prompt-text">{currentQuestion.promptEn}</p>
			</div>

			<div class="choices">
				{#each currentQuestion.choices as choice}
					<button
						class="choice-btn"
						class:correct={phase === 'feedback' && choice.isCorrect}
						class:wrong={phase === 'feedback' && selectedKey === choice.key && !choice.isCorrect}
						class:dim={phase === 'feedback' && !choice.isCorrect && selectedKey !== choice.key}
						disabled={phase === 'feedback'}
						onclick={() => choose(choice.key)}
					>
						<span class="choice-label">{choice.key}</span>
						<span class="choice-text">{choice.text}</span>
						{#if phase === 'feedback' && choice.isCorrect}
							<span class="choice-icon">✓</span>
						{:else if phase === 'feedback' && selectedKey === choice.key && !choice.isCorrect}
							<span class="choice-icon">✗</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}

		<p class="player-tag">👤 {name}</p>
	</main>
</div>
