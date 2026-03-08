<script lang="ts">
	import '$lib/styles/quiz.css'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { onMount, onDestroy } from 'svelte'
	import type {
		PublicQuestion,
		StartGameResponse,
		AnswerGameResponse,
		FinishGameResponse,
	} from '$lib/types/types'
	import { audioManager } from '$lib/services/audioManager.svelte'

	const TOTAL_TIME = 30

	let name = $state('')
	let currentQuestion = $state<PublicQuestion | undefined>(undefined)
	let questionIndex = $state(0)
	let score = $state(0)
	let timeLeft = $state(TOTAL_TIME)
	let selectedKey = $state<string | undefined>(undefined)
	let phase = $state<'playing' | 'feedback'>('playing')
	let showPopup = $state(false)
	let countdown = $state<number | 'Go!' | undefined>(3)

	let countInterval: ReturnType<typeof setInterval> | undefined = undefined
	let popupTimeout: ReturnType<typeof setTimeout> | undefined = undefined
	let pendingAdvance: ReturnType<typeof setTimeout> | undefined = undefined // stores the ID of the 900ms feedback timeout
	let hasEnded = false

	let gameTimerInterval: ReturnType<typeof setInterval> | undefined = undefined
	let lastAnswerCorrect = $state<boolean | undefined>(undefined)
	let startPromise: Promise<StartGameResponse> | undefined = undefined

	const progress = $derived((timeLeft / TOTAL_TIME) * 100)
	const timerColor = $derived(timeLeft > 10 ? '#a060e0' : timeLeft > 5 ? '#f59e0b' : '#ef4444')

	function startTimer(): void {
		if (gameTimerInterval) {
			clearInterval(gameTimerInterval)
			gameTimerInterval = undefined
		}

		gameTimerInterval = setInterval(() => {
			timeLeft -= 1
			if (timeLeft <= 0) {
				timeLeft = 0
				if (gameTimerInterval) {
					clearInterval(gameTimerInterval)
					gameTimerInterval = undefined
				}
				void endGame()
			}
		}, 1000)
	}

	function startCountdown(): void {
		let count = 3
		countdown = 3

		countInterval = setInterval(() => {
			count--

			if (count > 0) {
				countdown = count
				if (count === 2 && !startPromise) {
					startPromise = startGame()
				}
			} else if (count === 0) {
				countdown = 'Go!'
			} else {
				clearInterval(countInterval!)
				countInterval = undefined
				countdown = undefined

				// Start authoritative game session and load first question
				void (async (): Promise<void> => {
					try {
						const data = await (startPromise ?? startGame())
						startPromise = undefined
						currentQuestion = data.question
						questionIndex = data.questionIndex
						score = data.score
						timeLeft = Math.min(TOTAL_TIME, Math.ceil(data.timeLeftMs / 1000))
						startTimer()
					} catch (e) {
						console.error('Failed to start game:', e)
						goto(resolve('/'))
					}
				})()
			}
		}, 1000)
	}

	function choose(key: string): void {
		if (phase !== 'playing' || !currentQuestion) return

		audioManager.playSfx('click')
		selectedKey = key
		phase = 'feedback'

		const currentQuestionId = currentQuestion.id

		void (async (): Promise<void> => {
			try {
				const res = await submitAnswer(currentQuestionId, key)
				if (hasEnded) return
				lastAnswerCorrect = res.correct
				score = res.score
				// Don't update timeLeft here to prevent jumping.
				// The local timer handles the display, while the server enforces the limit.

				if (res.correct) {
					audioManager.playSfx('correct')
				} else {
					audioManager.playSfx('wrong')
				}

				if (res.finished) {
					await endGame()
					return
				}

				pendingAdvance = setTimeout(() => {
					if (hasEnded) return
					currentQuestion = res.question
					questionIndex = res.questionIndex
					lastAnswerCorrect = undefined
					selectedKey = undefined
					phase = 'playing'
				}, 800)
			} catch (e) {
				console.error('Failed to submit answer:', e)
				if (!hasEnded) await endGame()
			}
		})()
	}

	async function endGame(): Promise<void> {
		if (hasEnded) return
		hasEnded = true

		if (pendingAdvance) {
			clearTimeout(pendingAdvance)
			pendingAdvance = undefined
		}

		if (gameTimerInterval) {
			clearInterval(gameTimerInterval)
			gameTimerInterval = undefined
		}

		try {
			const finishRes = await finishGameApi()
			if (finishRes) {
				score = finishRes.score
				timeLeft = Math.ceil(finishRes.timeLeftMs / 1000)
			}
		} catch (e) {
			console.error('Failed to finish game session:', e)
		}

		showPopup = true
		popupTimeout = setTimeout(() => {
			sessionStorage.setItem('lastScore', String(score))
			sessionStorage.setItem('played', 'true')
			goto(resolve('/leaderboard'))
		}, 2000)
	}

	// Start Game
	async function startGame(): Promise<StartGameResponse> {
		const res = await fetch('/api/game/start', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playerName: name }),
		})

		if (!res.ok) {
			throw new Error('Failed to start game')
		}

		return (await res.json()) as StartGameResponse
	}

	// Submit answer
	async function submitAnswer(questionId: string, choiceKey: string): Promise<AnswerGameResponse> {
		const res = await fetch('/api/game/answer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ questionId, choiceKey }),
		})

		if (!res.ok) {
			throw new Error('Failed to submit answer')
		}

		return (await res.json()) as AnswerGameResponse
	}

	// Finish Game
	async function finishGameApi(): Promise<FinishGameResponse | undefined> {
		const res = await fetch('/api/game/finish', {
			method: 'POST',
		})

		if (!res.ok) {
			return undefined
		}

		return (await res.json()) as FinishGameResponse
	}

	onMount(() => {
		const storedName = sessionStorage.getItem('playerName')
		if (!storedName) {
			goto(resolve('/'))
			return
		}
		name = storedName

		audioManager.playQuizBgm()

		startCountdown()
	})

	onDestroy(() => {
		startPromise = undefined

		if (!hasEnded) {
			void finishGameApi()
		}

		if (countInterval) clearInterval(countInterval)
		if (pendingAdvance) clearTimeout(pendingAdvance)
		if (popupTimeout) clearTimeout(popupTimeout)

		if (gameTimerInterval) {
			clearInterval(gameTimerInterval)
			gameTimerInterval = undefined
		}
		audioManager.fadeOut(1000)
	})
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
			<div class="timer-bar-fill" style="width: {progress}%; background: {timerColor}"></div>
		</div>

		{#if currentQuestion}
			<div class="prompt-box">
				<p class="prompt-label">Translate to Japanese</p>
				<p class="prompt-text">{currentQuestion.promptEn}</p>
			</div>

			<div class="choices">
				{#each currentQuestion.choices as choice (choice.key)}
					<button
						class="choice-btn"
						class:correct={phase === 'feedback' &&
							selectedKey === choice.key &&
							lastAnswerCorrect === true}
						class:wrong={phase === 'feedback' &&
							selectedKey === choice.key &&
							lastAnswerCorrect === false}
						class:dim={phase === 'feedback' && selectedKey !== choice.key}
						disabled={phase === 'feedback' || countdown !== undefined}
						onclick={() => choose(choice.key)}
					>
						<span class="choice-label">{choice.key}</span>
						<span class="choice-text">{choice.text}</span>
						{#if phase === 'feedback' && selectedKey === choice.key && lastAnswerCorrect === true}
							<span class="choice-icon">✓</span>
						{:else if phase === 'feedback' && selectedKey === choice.key && lastAnswerCorrect === false}
							<span class="choice-icon">✗</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}

		<p class="player-tag">👤 {name}</p>
	</main>
	{#if countdown !== undefined}
		<div class="countdown-overlay">
			{#key countdown}
				<p class="countdown-text">{countdown}</p>
			{/key}
		</div>
	{/if}
	{#if showPopup}
		<div class="popup-overlay">
			<p class="score-reveal">Time's Up!</p>
		</div>
	{/if}
</div>
