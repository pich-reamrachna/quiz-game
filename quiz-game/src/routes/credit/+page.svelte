<script lang="ts">
	import { goto } from '$app/navigation';
    import './credit.css';
    import { onMount, onDestroy } from 'svelte';
    import { audioManager } from '$lib/audioManager.svelte';

    let creditCard = $state<HTMLElement | null>(null);
    let timer: ReturnType<typeof setInterval> | null = null;
    let isPaused = false;

    onMount(() => {
        audioManager.playHomeBgm();

        timer = setInterval(() => {
            if (!creditCard || isPaused) return;

            const atBottom =
                creditCard.scrollTop + creditCard.clientHeight >= creditCard.scrollHeight - 1; // scrollTop, clientHeight are built-in DOM properties of scrollable elements

            if (atBottom) {
                creditCard.scrollTop = 0; // loop back to top
            } else {
                creditCard.scrollTop += 1; // speed
            }
        }, 25);
    });

    onDestroy(() => {
        if (timer) clearInterval(timer);
    });

    function handleBack() {
        audioManager.playSfx('click');
        goto('/');
    }
</script>

<svelte:head>
	<title>Credit</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
		rel="stylesheet"
	/>
    <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet" />

</svelte:head>

<div class="credit-page">
	<div class="credit-bg-grid"></div>
    <div class="credit-shell">
        <h1 class="credit-title">CREDITS</h1>
    
        <main class="credit-card"
        bind:this={creditCard}
        onmouseenter={() => (isPaused = true)}
        onmouseleave={() => (isPaused = false)}
        >
            <section class="credit-section">
                <h2 class="credit-role">Start Screen</h2>
                <p class="credit-members">Phann chanthariroza ロザさん</p>
                <p class="credit-members">Pich Ream Rachna ラチナさん</p>
            </section>

            <section class="credit-section">
                <h2 class="credit-role">Play Screen</h2>
                <p class="credit-members">Phann chanthariroza ロザさん</p>
            </section>

            <section class="credit-section">
                <h2 class="credit-role">Leaderboard Screen</h2>
                <p class="credit-members">Phann chanthariroza ロザさん</p>
            </section>

            <section class="credit-section">
                <h2 class="credit-role">Credit Screen</h2>
                <p class="credit-members">Pich Ream Rachna ラチナさん</p>
            </section>

            <section class="credit-section">
                <h2 class="credit-role">Game Logic</h2>
                <p class="credit-members">Nethphorn Tepbrathna ラタナさん</p>
            </section>

            <section class="credit-section">
                <h2 class="credit-role">Database</h2>
                <p class="credit-members">Sok Kimlay ソクさん</p>
            </section>

            <section class="credit-section">
                <h2 class="credit-role">Music</h2>
                <p class="credit-members">Nethphorn Tepbrathna ラタナさん</p>
            </section>

            <section class="credit-section">
                <h2 class="credit-role">Bug Bounty</h2>
                <p class="credit-members">Sok Kimlay ソクさん</p>
                <p class="credit-members">Nethphorn Tepbrathna ラタナさん</p>
                <p class="credit-members">Pich Ream Rachna ラチナさん</p>
            </section>

            <section class="credit-section">
                <h2 class="credit-role">Reviewer</h2>
                <p class="credit-members">Nethphorn Tepbrathna ラタナさん</p>
                <p class="credit-members">Pich Ream Rachna ラチナさん</p>
            </section>

        </main>

        <button class="credit-back-btn" onclick={handleBack}>← Back</button>
    </div>
    
</div>
