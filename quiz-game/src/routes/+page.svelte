<script lang="ts">
	import { goto } from '$app/navigation';
	import './startPage.css';

	let name = $state('');
	let error = $state('');
	
	function handleStart() {
		if (!name.trim()) {
			error = 'Please enter your name!';
			return;
		}
		goto(`/play?name=${encodeURIComponent(name.trim())}`);
	}

	function handleLeaderboard() {
		goto('/leaderboard');
	}

	function handleCredit() {
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
		rel="preconnect" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"	
	/>
	<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">

</svelte:head>

<div class="start-page">
	<div class="bg-grid"></div>

	<main class="content">
		<h1 class="startPage-title">日本語クイズ</h1>
	
		<div class="input-group">
			<label for="name-input">
			</label>
			<div class="input-wrap">
				<input
					id="name-input"
					type="text"
					bind:value={name}
					onkeydown={handleKeydown}
					placeholder="Enter your name..."
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
			<button class="pixel-btn" onclick={handleStart}>
				<img src="/play-button.png" alt="Play" />
			</button>
			<!-- Temporary Button -->
			<button class="pixel-btn" onclick={handleCredit}>
				<img src="/backdoor.png" alt="Credit" />
			</button>
		</div>
	</main>
</div>

		

