<script lang="ts">
	import './quiz.css';
	import { goto } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import type { ChoiceKey } from '$lib/types';
	import { audioManager } from '$lib/audioManager.svelte';

	const TOTAL_TIME = 30;

	type PublicQuestion = {
		id: string;
		promptEn: string;
		choices: Array<{ key: ChoiceKey; text: string }>;
	};

	let name = $state('');
	let sessionId = $state('');
	let currentQuestion = $state<PublicQuestion | null>(null);
	let questionIndex = $state(0);
	let score = $state(0);
	let timeLeft = $state(TOTAL_TIME);
	let selectedKey = $state<ChoiceKey | null>(null);
	let correctKey = $state<ChoiceKey | null>(null);
	let phase = $state<'playing' | 'feedback'>('playing');
	let showPopup = $state(false);

	let popupTimeout: ReturnType<typeof setTimeout> | null = null;
	let pendingAdvance: ReturnType<typeof setTimeout> | null = null;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let hasEnded = false;

	const progress = $derived((timeLeft / TOTAL_TIME) * 100);
	const timerColor = $derived(timeLeft > 10 ? '#a060e0' : timeLeft > 5 ? '#f59e0b' : '#ef4444');

	function startTimer() {
		timeLeft = TOTAL_TIME;
		stopTimer();
		timerInterval = setInterval(() => {
			if (hasEnded) return;
			timeLeft -= 1;
			if (timeLeft <= 0) {
				timeLeft = 0;
				stopTimer();
				void endGame();
			}
		}, 1000);
	}

	function stopTimer() {
		if (!timerInterval) return;
		clearInterval(timerInterval);
		timerInterval = null;
	}

	async function choose(key: ChoiceKey) {
		if (phase !== 'playing' || !currentQuestion) return;

		audioManager.playSfx('click');
		selectedKey = key;
		phase = 'feedback';

		try {
			const res = await fetch('/api/game/answer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, choiceKey: key })
			});
			if (!res.ok) throw new Error('Failed to submit answer');
			const result = await res.json();

			correctKey = result.correctKey ?? null;
			score = Number(result.score ?? score);
			if (result.correct) {
				audioManager.playSfx('correct');
			} else {
				audioManager.playSfx('wrong');
			}

			pendingAdvance = setTimeout(() => {
				if (hasEnded) return;
				if (result.finished) {
					void endGame();
					return;
				}
				currentQuestion = result.question ?? null;
				questionIndex = Number(result.questionIndex ?? questionIndex + 1);
				selectedKey = null;
				correctKey = null;
				phase = 'playing';
			}, 900);
		} catch (error) {
			console.error(error);
			audioManager.playSfx('wrong');
			selectedKey = null;
			phase = 'playing';
		}
	}

	async function endGame() {
		if (hasEnded) return;
		hasEnded = true;

		if (pendingAdvance) {
			clearTimeout(pendingAdvance);
			pendingAdvance = null;
		}
		stopTimer();

		try {
			if (sessionId) {
				const res = await fetch('/api/game/finish', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sessionId })
				});
				if (res.ok) {
					const result = await res.json();
					if (typeof result.score === 'number') {
						score = result.score;
					}
				}
			}
		} catch (e) {
			console.error('Failed to finish game:', e);
		}

		showPopup = true;
		popupTimeout = setTimeout(() => {
			sessionStorage.setItem('lastScore', String(score));
			goto('/leaderboard');
		}, 2000);
	}

	onMount(async () => {
		const storedName = sessionStorage.getItem('playerName')?.trim();
		if (!storedName) {
			goto('/');
			return;
		}
		name = storedName;
		audioManager.playQuizBgm();

		try {
			const bootstrapRaw = sessionStorage.getItem('gameBootstrap');
			if (bootstrapRaw) {
				sessionStorage.removeItem('gameBootstrap');
				const bootstrap = JSON.parse(bootstrapRaw) as {
					sessionId?: string;
					question?: PublicQuestion | null;
					score?: number;
				};

				if (bootstrap.sessionId && bootstrap.question) {
					sessionId = bootstrap.sessionId;
					currentQuestion = bootstrap.question;
					questionIndex = 1;
					score = Number(bootstrap.score ?? 0);
					startTimer();
					return;
				}
			}

			const res = await fetch('/api/game/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerName: name })
			});
			if (!res.ok) throw new Error('Failed to start game');
			const result = await res.json();

			sessionId = result.sessionId;
			currentQuestion = result.question ?? null;
			questionIndex = currentQuestion ? 1 : 0;
			score = Number(result.score ?? 0);

			if (!currentQuestion || !sessionId) {
				void endGame();
				return;
			}
			startTimer();
		} catch (error) {
			console.error(error);
			goto('/');
		}
	});

	onDestroy(() => {
		if (pendingAdvance) clearTimeout(pendingAdvance);
		if (popupTimeout) clearTimeout(popupTimeout);
		stopTimer();
		audioManager.fadeOut(1000);
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
			<span class="q-num">Q&nbsp;{questionIndex}</span>

			<span class="score-badge">✓ {score}</span>

			<div class="timer-wrap">
				<span class="timer-num" style="color: {timerColor}">{timeLeft}</span>
				<span class="timer-label">sec</span>
			</div>
		</div>

		<div class="timer-bar-track">
			<div class="timer-bar-fill" style="width: {progress}%; background: {timerColor}"></div>
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
						class:correct={phase === 'feedback' && correctKey === choice.key}
						class:wrong={phase === 'feedback' && correctKey !== null && selectedKey === choice.key && correctKey !== choice.key}
						class:dim={phase === 'feedback' && correctKey !== null && correctKey !== choice.key && selectedKey !== choice.key}
						disabled={phase === 'feedback'}
						onclick={() => choose(choice.key)}
					>
						<span class="choice-label">{choice.key}</span>
						<span class="choice-text">{choice.text}</span>
						{#if phase === 'feedback' && correctKey !== null && correctKey === choice.key}
							<span class="choice-icon">✓</span>
						{:else if phase === 'feedback' && correctKey !== null && selectedKey === choice.key && correctKey !== choice.key}
							<span class="choice-icon">✗</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}

		<p class="player-tag">👤 {name}</p>
	</main>
	{#if showPopup}
		<div class="popup-overlay">
			<p class="score-reveal">Time's Up!</p>
		</div>
	{/if}
</div>
