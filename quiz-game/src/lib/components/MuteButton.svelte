<script lang="ts">
    import { audioManager } from '$lib/audioManager.svelte';
</script>

<button 
    class="mute-btn" 
    onclick={() => audioManager.toggleMute()}
    aria-label={audioManager.isMuted ? "Unmute" : "Mute"}
>
    {#if audioManager.isMuted}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M5.889 16H2V8h3.889L11 3v18l-5.111-5zm7.301-11.459 1.414-1.414 7.071 7.071-7.071 7.071-1.414-1.414 5.657-5.657-5.657-5.657z"/>
        </svg>
    {:else}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    {/if}
</button>

<style>
    .mute-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .mute-btn:hover {
        background: rgba(0, 0, 0, 0.6);
        transform: scale(1.1) rotate(5deg);
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }

    .mute-btn:active {
        transform: scale(0.95);
    }

    svg {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
</style>
