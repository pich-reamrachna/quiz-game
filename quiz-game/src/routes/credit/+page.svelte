<script lang="ts">
	import { goto } from '$app/navigation';
    import './credit.css';
    import { onMount } from 'svelte';
    import { audioManager } from '$lib/audioManager.svelte';

    onMount(() => {
        audioManager.playHomeBgm();
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
</svelte:head>

<div class="credit-page">
	<div class="credit-bg-grid"></div>
    <div class="credit-shell">
        <h1 class="credit-title">CREDITS</h1>
    
        <main class="credit-card">
            <!-- Header -->
            

            <!-- Table area -->
            
        </main>

        <button class="credit-back-btn" onclick={handleBack}>← Back</button>
    </div>
    
</div>
