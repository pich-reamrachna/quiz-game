<script lang="ts">
	import '$lib/styles/layout.css'
	import MuteButton from '$lib/components/MuteButton.svelte'

	const { children } = $props()
</script>

<svelte:head><link rel="icon" href="/favicon.png" /></svelte:head>
{@render children()}
<MuteButton />
