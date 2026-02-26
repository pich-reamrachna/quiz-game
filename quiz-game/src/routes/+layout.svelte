<script lang="ts">
	import './layout.css';
	import MuteButton from '$lib/components/MuteButton.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="" /></svelte:head>
{@render children()}
<MuteButton />
