<!-- Leaderboard screen -->
<script lang="ts">
    import './leaderboard.css'
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { ScoreRow } from '$lib/types';
	import { QUESTIONS } from '$lib/questions';
	import { audioManager } from '$lib/audioManager.svelte';

	let entries = $state<ScoreRow[]>([]);
	let status  = $state<'loading' | 'error' | 'empty' | 'ok'>('loading');

	let showResult  = $state(false);
    let resultScore = $state(0);
    let resultName  = $state('');
    let fwCanvas: HTMLCanvasElement | undefined = $state();

	onMount(async () => {
        // Check if coming from play screen with a score
        const params = new URLSearchParams(window.location.search);
		resultScore = Number(params.get('score') ?? 0);
		resultName  = params.get('name') ?? '';

		if (params.has('score')) {
    		showResult = true;
    		setTimeout(() => startFireworks(fwCanvas), 50);
		}
		// Ensure home BGM is playing/continues
		audioManager.playHomeBgm();

		try {
			const res = await fetch('/api/scores?limit=100');
			if (!res.ok) throw new Error();
			const data: ScoreRow[] = await res.json();
			entries = data;
			status  = data.length === 0 ? 'empty' : 'ok';
		} catch {
			status = 'error';
		}
	});

	function handleBack() {
		audioManager.playSfx('click');
		goto('/');
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('ja-JP', {
			year:  'numeric',
			month: '2-digit',
			day:   '2-digit'
		});
	}

	function medal(rank: number) {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return String(rank);
	}
	function startFireworks(canvas: HTMLCanvasElement | undefined) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#ff6b6b', '#ffd93d', '#c97fff', '#4fc3f7', '#6bcb77'];
        const dots: {
            x: number; y: number;
            vx: number; vy: number;
            alpha: number; color: string;
        }[] = [];

        function burst(x: number, y: number) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            for (let i = 0; i < 40; i++) {
                const angle = (Math.PI * 2 * i) / 40;
                const speed = Math.random() * 3 + 1;
                dots.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    color
                });
            }
        }

        let frame: number;

        function draw() {
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(0, 0, canvas!.width, canvas!.height);

            for (let i = dots.length - 1; i >= 0; i--) {
                const d = dots[i];
                d.x     += d.vx;
                d.y     += d.vy;
                d.vy    += 0.06;
                d.alpha -= 0.018;

                if (d.alpha <= 0) { dots.splice(i, 1); continue; }

                ctx.beginPath();
                ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
                ctx.fillStyle   = d.color;
                ctx.globalAlpha = d.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            frame = requestAnimationFrame(draw);
        }

        // Launch 6 bursts every 400ms
        let count = 0;
        const interval = setInterval(() => {
            burst(
                Math.random() * canvas.width  * 0.8 + canvas.width  * 0.1,
                Math.random() * canvas.height * 0.4 + 50
            );
            count++;
            if (count >= 6) clearInterval(interval);
        }, 400);

        draw();

        // Stop after 4 seconds
        setTimeout(() => {
            cancelAnimationFrame(frame);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 4000);
    }

</script>

<svelte:head>
	<title>Leaderboard</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		href="https://fonts.googleapis.com/css2?family=Zen+Dots&family=Noto+Sans+JP:wght@400;700&display=swap"
		rel="stylesheet"
	/>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"/>
	<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet"/>

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
						{#each entries as entry, i}
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

		<button class="btn-play" onclick={handleBack}>▶ Play Again</button>
	</main>
	<!-- Result popup — only shows when coming from play screen -->
    {#if showResult}
        <canvas bind:this={fwCanvas} class="fw-canvas-full"></canvas>

        <div class="popup-overlay">
            <div class="popup-card">

                <button class="close-btn" onclick={() => showResult = false}>✕</button>

                <h2 class="popup-title">ゲームオーバー!</h2>
                <img src="/congrats.png" alt="congrats" class="popup-img" />
                <p class="popup-score">{resultScore}<span> / {QUESTIONS.length}</span></p>
                <p class="popup-msg">頑張れ！練習を続けてください！💪</p>

            </div>
        </div>
    {/if}
</div>
