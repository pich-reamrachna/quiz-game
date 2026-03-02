<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { audioManager } from '$lib/audioManager.svelte';
	import './startPage.css';

	let name = $state('');
	let error = $state('');
	let isStarting = $state(false);

	onMount(() => {
		// Play BGM on mount. If blocked, it will play on first click.
		audioManager.playHomeBgm();
	});

	async function handleStart() {
		if (isStarting) return;
		audioManager.playSfx('click');
		if (!name.trim()) {
			error = 'Please enter your name!';
			return;
		}

		const playerName = name.trim();
		error = '';
		isStarting = true;

		try {
			sessionStorage.setItem('playerName', playerName);
			const res = await fetch('/api/game/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerName })
			});
			if (res.ok) {
				const bootstrap = await res.json();
				sessionStorage.setItem('gameBootstrap', JSON.stringify(bootstrap));
			}
			goto('/play');
		} catch {
			error = 'Failed to start game. Please try again.';
		} finally {
			isStarting = false;
		}
	}

	function handleLeaderboard() {
		audioManager.playSfx('click');
		goto('/leaderboard');
	}

	function handleCredit() {
		audioManager.playSfx('click');
		goto('/credit');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleStart();
	}
</script>

<svelte:head>
	<title>日本語クイズ</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Zen+Dots&family=Noto+Sans+JP:wght@400;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"	
	/>
	<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">

</svelte:head>

<div class="start-page">
	<div class="bg-grid"></div>

	<main class="content">
		<h1 class="startPage-title">日本語クイズ</h1>
	
		<div class="input-group">
			<label for="name-input">名前を入力してください</label>
			<div class="input-wrap">
				<input
					id="name-input"
					type="text"
					bind:value={name}
					onkeydown={handleKeydown}
					placeholder="skibidii"
					maxlength={20}
					autocomplete="off"
				/>
				<span class="input-count">{name.length}/20</span>
			</div>
			{#if error}
				<p class="error-msg">{error}</p>
			{/if}
		</div>

		<div class="btn-group">
			<button class="pixel-btn" onclick={handleLeaderboard}>
				<img src="/Scoreboard.png" alt="Scoreboard" />
			</button>
			<button class="pixel-btn" onclick={handleStart} disabled={isStarting} aria-busy={isStarting}>
				<img src="/play-button.png" alt="Play" />
			</button>
			<!-- Temporary Button -->
			
		</div>

		<div class="btm-btn-group">
			<button class="credit-btn" onclick={handleCredit}>
				<img src="/star.png" alt="Credit" />
			</button>
		</div>
	</main>
</div>
