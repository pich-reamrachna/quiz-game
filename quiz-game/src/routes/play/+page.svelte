<script lang="ts">
	import './quiz.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { createGameEngine } from '$lib/game/engine';
	import { QUESTIONS } from '$lib/questions';
	import type { Question } from '$lib/types';
	import { audioManager } from '$lib/audioManager.svelte';

	const TOTAL_TIME = 30;
	const engine = createGameEngine(QUESTIONS);

	let name = $state('');
	let currentQuestion = $state<Question | null>(null);
	let questionIndex = $state(0);
	let score = $state(0);
	let timeLeft = $state(TOTAL_TIME);
	let selectedKey = $state<string | null>(null);
	let phase = $state<'playing' | 'feedback'>('playing');
	let showPopup = $state(false);

	let sessionId = $state<string | null>(null);
	let isInitializing = $state(true);

	let popupTimeout: ReturnType<typeof setTimeout> | null = null;
	let pendingAdvance: ReturnType<typeof setTimeout> | null = null;
	let hasEnded = false;

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

	let initError = $state<string | null>(null);

	async function startSession() {
		try {
			const res = await fetch('/api/game/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerName: name })
			});
			
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || `Server responded with ${res.status}`);
			}

			const data = await res.json();
			if (data.sessionId) {
				sessionId = data.sessionId;
				isInitializing = false;
				startTimer();
			} else {
				throw new Error('No sessionId received');
			}
		} catch (e: any) {
			console.error('Session error:', e);
			initError = e.message || 'Unknown error';
			goto('/');
		}
	}

	async function choose(key: string) {
		if (phase !== 'playing' || !currentQuestion || !sessionId) return;

		audioManager.playSfx('click');

		const chosen = currentQuestion.choices.find((c) => c.key === key);
		if (!chosen) return;

		selectedKey = key;
		phase = 'feedback';

		try {
			const res = await fetch('/api/game/answer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					sessionId, 
					questionId: currentQuestion.id, 
					answerText: chosen.text,
					currentIdx: questionIndex
				})
			});
			const data = await res.json();
			
			if (data.correct) {
				score = data.score;
				audioManager.playSfx('correct');
			} else {
				audioManager.playSfx('wrong');
			}
		} catch (e) {
			console.error('Answer submission failed:', e);
		}

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

	 let finishError = $state<string | null>(null);

	 async function endGame() {
        if (hasEnded) return;
        hasEnded = true;

        if (pendingAdvance) {
            clearTimeout(pendingAdvance);
            pendingAdvance = null;
        }

        engine.stopTimer();

        if (sessionId) {
            try {
                const res = await fetch('/api/game/finish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Server error: ${res.status}`);
                }
            } catch (e: any) {
                console.error('Failed to finish game:', e);
                finishError = e.message || 'Network error';
                hasEnded = false; // Allow retry if possible, or at least don't state we're done
                return;
            }
        }

        showPopup    = true;
        popupTimeout = setTimeout(() => {
            sessionStorage.setItem('lastScore', String(score));
            goto('/leaderboard');
        }, 2000);
    }

    onMount(async () => {
        const storedName = sessionStorage.getItem('playerName');
        if (!storedName) { 
            goto('/'); 
            return; 
        }
        name = storedName;

        audioManager.playQuizBgm();

        engine.start(name, TOTAL_TIME);
        engine.nextQuestion();

        const state = engine.getState();
        if (state.status === 'finished' || !state.currentQuestion) {
            void endGame();
            return;
        }

        currentQuestion = state.currentQuestion;
        questionIndex   = Math.max(0, state.questionCount - 1);
        score           = 0;

		await startSession();
    });

	onDestroy(() => {
		if (pendingAdvance) {
			clearTimeout(pendingAdvance); }
		if (popupTimeout) {
		clearTimeout(popupTimeout);}
		engine.stopTimer();
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
	{#if isInitializing}
		<div class="loading-screen">
			<p>Initializing Game Session...</p>
		</div>
	{:else}
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
{#if showPopup}
		<div class="popup-overlay">	
			<p class="score-reveal">Time's Up!</p>
		</div>
	{/if}

	{#if finishError}
		<div class="popup-overlay error-overlay">
			<div class="error-msg">
				<p>Failed to save score: {finishError}</p>
				<button class="retry-btn" onclick={() => { finishError = null; endGame(); }}>
					Retry Submission
				</button>
			</div>
		</div>
	{/if}
{/if}
</div>

