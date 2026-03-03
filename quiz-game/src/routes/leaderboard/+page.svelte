<!-- Leaderboard screen -->
<script lang="ts">
    import './leaderboard.css'
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { ScoreRow } from '$lib/types';
	import { audioManager } from '$lib/audioManager.svelte';
	import { page } from '$app/state';

	let entries = $state<ScoreRow[]>([]);
	let status  = $state<'loading' | 'error' | 'empty' | 'ok'>('loading');
	let showPlayAgain = $derived(page.url.searchParams.has('played')); // check for query of "played=true" in leaderboard url

	let showResult  = $state(false);
    let resultScore = $state(0);
    let resultName  = $state('');

	onMount(async () => {
        // Check if coming from play screen with a score in sessionStorage.
		const storedScore = sessionStorage.getItem('lastScore');
		const storedName = sessionStorage.getItem('playerName')?.trim() ?? '';
		resultName = storedName;

		if (storedScore !== null) {
			const parsedScore = Number(storedScore);
			if (Number.isFinite(parsedScore) && parsedScore >= 0) {
				resultScore = parsedScore;
    			showResult = true;
			}
			// One-time popup trigger; do not keep showing on refreshes.
			sessionStorage.removeItem('lastScore');
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
		{#if showPlayAgain}
		<button class="btn-play" onclick={handleBack}>▶ Play Again</button>
		{/if}
	</main>
	<!-- Result popup — only shows when coming from play screen -->
    {#if showResult}
        <div class="popup-overlay">
            <div class="popup-card">

                <button class="close-btn" onclick={() => showResult = false}>✕</button>

                <h2 class="popup-title">ゲームオーバー!</h2>
                <p class="popup-score">{resultScore}</p>
				<p class="popup-msg">プレイヤー {resultName}</p>
                <p class="popup-msg">頑張れ！練習を続けてください！</p>

            </div>
        </div>
    {/if}
</div>
