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

	let name = $state('')
	let currentQuestion = $state<Question | null>(null);
	let questionIndex = $state(0);
	let score = $state(0);
	let timeLeft = $state(TOTAL_TIME);
	let selectedKey = $state<string | null>(null);
	let phase = $state<'playing' | 'feedback'>('playing');
	let showPopup = $state(false);
	let fwCanvas: HTMLCanvasElement | undefined = $state();
	let fwCanvasInner: HTMLCanvasElement | undefined = $state();
	let popupPhase = $state<'score' | 'full'>('score');
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
    if (hasEnded) return;
    hasEnded = true;

    if (pendingAdvance) {
        clearTimeout(pendingAdvance);
        pendingAdvance = null;
    }
    engine.stopTimer();
    showPopup = true;
	popupPhase = 'score';
	setTimeout(() => {
		popupPhase = 'full';
		startFireworks(fwCanvas, 50);
		startFireworks(fwCanvasInner, 50);
}, 2000);
}
async function submitAndLeave() {
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

function startFireworks(canvas: HTMLCanvasElement | undefined, p0: number) {
	if (!canvas) return;
	const ctx = canvas.getContext('2d')!;
	canvas.width = canvas.offsetWidth || window.innerWidth;
	canvas.height = canvas.offsetHeight || window.innerHeight;

		const colors = ['#ff6b6b', '#ffd93d', '#c97fff', '#4fc3f7', '#6bcb77'];
		const dots: { x: number; y: number; vx: number; vy: number; alpha: number; color: string }[] = [];

		function burst(x: number, y: number) {
			const color = colors[Math.floor(Math.random() * colors.length)];
			for (let i = 0; i < 40; i++) {
				const angle = (Math.PI * 2 * i) / 40;
				const speed = Math.random() * 3 + 1;
				dots.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, alpha: 1, color });
			}
		}

		let frame: number;

		function draw() {
			ctx.fillStyle = 'rgba(0,0,0,0.12)';
			ctx.fillRect(0, 0, canvas!.width, canvas!.height);

			for (let i = dots.length - 1; i >= 0; i--) {
				const d = dots[i];
				d.x += d.vx;
				d.y += d.vy;
				d.vy += 0.06;
				d.alpha -= 0.018;
				if (d.alpha <= 0) { dots.splice(i, 1); continue; }
				ctx.beginPath();
				ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
				ctx.fillStyle = d.color;
				ctx.globalAlpha = d.alpha;
				ctx.fill();
				ctx.globalAlpha = 1;
			}
			frame = requestAnimationFrame(draw);
		}

		let count = 0;
		const interval = setInterval(() => {
			burst(
				Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
				Math.random() * canvas.height * 0.4 + 50
			);
			count++;
			if (count >= 6) clearInterval(interval);
		}, 400);

		draw();
		setTimeout(() => {
			cancelAnimationFrame(frame);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}, 4000);
	}
	onMount(() => {

		// retrieve the name from browser ram
		const storedName = sessionStorage.getItem('playerName')

		if (!storedName) {
			goto('/');
			return;
		}
		name = storedName


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
	<canvas bind:this={fwCanvas} class="fw-canvas-full"></canvas>
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
			{#if popupPhase === 'score'}
			<p class="score-reveal">{score} / {QUESTIONS.length}</p>
		{:else}	
			<div class="popup-card">
			<canvas bind:this={fwCanvasInner} class="fw-canvas-inner"></canvas>
				<h2 class="popup-title">ゲームオーバー!</h2>
				<img src="/congrats.png" alt="congrats" class="popup-img" />
				<p class="popup-msg">頑張れ,  練習を続けてください！！💪</p>
				<button class="popup-btn" onclick={submitAndLeave}>
					view leaderboard →
				</button>
			</div>
		{/if}
		</div>
	{/if}
</div>

