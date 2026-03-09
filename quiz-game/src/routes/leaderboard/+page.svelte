<!-- Leaderboard screen -->
<script lang="ts">
	import '$lib/styles/leaderboard.css'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { onMount } from 'svelte'
	import type { ScoreRow } from '$lib/types/types'
	import { audioManager } from '$lib/services/audioManager.svelte'

	let entries = $state<ScoreRow[]>([])
	let status = $state<'loading' | 'error' | 'empty' | 'ok'>('loading')
	let showPlayAgain = $state(false)

	let showResult = $state(false)
	let resultScore = $state(0)
	let resultName = $state('')

	let fwCanvasFull: HTMLCanvasElement | undefined = $state()

	onMount(async () => {
		showPlayAgain =
			window.location.search.includes('played=true') || sessionStorage.getItem('played') === 'true'
		sessionStorage.removeItem('played')

		// Check if coming from play screen with a score in sessionStorage.
		const storedScore = sessionStorage.getItem('lastScore') ?? undefined
		const storedName = sessionStorage.getItem('playerName')?.trim() ?? ''
		resultName = storedName

		if (storedScore !== undefined) {
			const parsedScore = Number(storedScore)
			if (Number.isFinite(parsedScore) && parsedScore >= 0) {
				resultScore = parsedScore
				showResult = true
				setTimeout(() => {
					startFireworks(fwCanvasFull, false)
				}, 50)
			}
			// One-time popup trigger; do not keep showing on refreshes.
			sessionStorage.removeItem('lastScore')
		}
		// Ensure home BGM is playing/continues
		audioManager.playHomeBgm()

		try {
			const res = await fetch('/api/scores?limit=100')
			if (!res.ok) throw new Error()
			const data: ScoreRow[] = await res.json()
			entries = data
			status = data.length === 0 ? 'empty' : 'ok'
		} catch {
			status = 'error'
		}
	})

	function startFireworks(canvas: HTMLCanvasElement | undefined, isInner: boolean): void {
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		canvas.width = isInner ? canvas.offsetWidth : window.innerWidth
		canvas.height = isInner ? canvas.offsetHeight : window.innerHeight

		const safeCtx = ctx
		const safeCanvas = canvas

		const colors = ['#ff6b6b', '#ffd93d', '#c97fff', '#4fc3f7', '#6bcb77', '#ff9f43', '#ff6eb4']

		const dots: {
			x: number
			y: number
			vx: number
			vy: number
			alpha: number
			color: string
			isConfetti: boolean
			rotation: number
		}[] = []

		function burst(x: number, y: number): void {
			for (let i = 0; i < 50; i++) {
				const angle = (Math.PI * 2 * i) / 50
				const speed = Math.random() * 4 + 1
				dots.push({
					x,
					y,
					vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
					vy: Math.sin(angle) * speed - Math.random() * 3,
					alpha: 1,
					color: colors[Math.floor(Math.random() * colors.length)],
					isConfetti: i % 3 === 0,
					rotation: Math.random() * Math.PI * 2,
				})
			}
		}

		let frame: number

		function draw(): void {
			safeCtx.fillStyle = 'rgba(0,0,0,0.12)'
			safeCtx.fillRect(0, 0, safeCanvas.width, safeCanvas.height)

			for (let i = dots.length - 1; i >= 0; i--) {
				const d = dots[i]
				d.x += d.vx
				d.y += d.vy
				d.vy += 0.06
				d.alpha -= 0.016
				d.rotation += 0.08

				if (d.alpha <= 0) {
					dots.splice(i, 1)
					continue
				}

				safeCtx.globalAlpha = d.alpha

				if (d.isConfetti) {
					// Rectangle confetti piece
					safeCtx.save()
					safeCtx.translate(d.x, d.y)
					safeCtx.rotate(d.rotation)
					safeCtx.fillStyle = d.color
					safeCtx.fillRect(-5, -2, 10, 5)
					safeCtx.restore()
				} else {
					// Circle particle
					safeCtx.beginPath()
					safeCtx.arc(d.x, d.y, 3, 0, Math.PI * 2)
					safeCtx.fillStyle = d.color
					safeCtx.fill()
				}

				safeCtx.globalAlpha = 1
			}

			frame = requestAnimationFrame(draw)
		}

		let count = 0
		const interval = setInterval(() => {
			burst(
				Math.random() * safeCanvas.width * 0.8 + safeCanvas.width * 0.1,
				Math.random() * safeCanvas.height * 0.4 + 50,
			)
			count++
			if (count >= 10) clearInterval(interval)
		}, 400)

		draw()

		setTimeout(() => {
			cancelAnimationFrame(frame)
			safeCtx.clearRect(0, 0, safeCanvas.width, safeCanvas.height)
		}, 6000)
	}

	function handleBack(): void {
		audioManager.playSfx('click')
		goto(resolve('/'))
	}

	function handlePlayAgain(): void {
		audioManager.playSfx('click')
		goto(resolve('/play'))
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		})
	}

	function medal(rank: number): string {
		if (rank === 1) return '🥇'
		if (rank === 2) return '🥈'
		if (rank === 3) return '🥉'
		return String(rank)
	}
</script>

<svelte:head>
	<title>Leaderboard</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		href="https://fonts.googleapis.com/css2?family=Zen+Dots&family=Noto+Sans+JP:wght@400;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
	/>
	<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page">
	<div class="orb orb-1"></div>
	<div class="orb orb-2"></div>
	<div class="bg-grid"></div>

	<main class="leaderboard-card">
		<!-- Header -->
		<div class="header">
			<button class="leaderboard-back-btn" onclick={handleBack}>← Back</button>
			<h1 class="leaderboard-title">LEADERBOARD</h1>
		</div>

		<!-- Table area -->
		<div class="table-wrap">
			{#if status === 'loading'}
				<div class="placeholder">
					<div class="spinner"></div>
					<p>Loading scores…</p>
				</div>
			{:else if status === 'error'}
				<div class="placeholder error-state">
					<p class="ph-icon">⚠️</p>
					<p>Failed to load leaderboard.</p>
					<button class="retry-btn" onclick={() => window.location.reload()}>Retry</button>
				</div>
			{:else if status === 'empty'}
				<div class="placeholder">
					<p class="ph-icon">📭</p>
					<p>No scores yet. Be the first!</p>
				</div>
			{:else}
				<table class="table">
					<thead>
						<tr>
							<th class="col-rank">Rank</th>
							<th class="col-name">Name</th>
							<th class="col-score">Score</th>
							<th class="col-date">Date</th>
						</tr>
					</thead>
					<tbody>
						{#each entries as entry, i (entry.id)}
							<tr class:top3={i < 3}>
								<td class="col-rank rank-cell">{medal(i + 1)}</td>
								<td class="col-name name-cell">{entry.name}</td>
								<td class="col-score score-cell">{entry.score}</td>
								<td class="col-date date-cell">{formatDate(entry.created_at)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
		{#if showPlayAgain}
			<button class="btn-play" onclick={handlePlayAgain}>▶ Play Again</button>
		{/if}
	</main>
	<!-- Result popup — only shows when coming from play screen -->
	{#if showResult}
		<canvas bind:this={fwCanvasFull} class="fw-canvas-full"></canvas>
		<div class="popup-overlay">
			<div class="popup-card">
				<button class="close-btn" onclick={() => (showResult = false)}>✕</button>

				<h2 class="popup-title">ゲームオーバー!</h2>
				<p class="popup-score">{resultScore}</p>
				<p class="popup-msg">プレイヤー {resultName}</p>
				<p class="popup-msg">頑張れ！練習を続けてください！</p>
			</div>
		</div>
	{/if}
</div>
