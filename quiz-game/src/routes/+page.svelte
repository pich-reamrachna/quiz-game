<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import './start page.css';

	let name = $state('');
	let error = $state('');
	let canvas: HTMLCanvasElement;

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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleStart();
	}

	// ── Particle canvas ─────────────────────────────────────────────────────────
	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		let w = (canvas.width = window.innerWidth);
		let h = (canvas.height = window.innerHeight);
		let animId: number;

		window.addEventListener('resize', () => {
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
		});

		// Particles
		type Particle = {
			x: number; y: number;
			vx: number; vy: number;
			r: number; alpha: number;
			color: string;
		};

		const colors = ['#c97fff', '#8b2ff8', '#e040fb', '#7c4dff', '#ffffff'];

		const particles: Particle[] = Array.from({ length: 90 }, () => ({
			x: Math.random() * w,
			y: Math.random() * h,
			vx: (Math.random() - 0.5) * 0.5,
			vy: (Math.random() - 0.5) * 0.5 - 0.2,
			r: Math.random() * 2.5 + 0.5,
			alpha: Math.random() * 0.6 + 0.2,
			color: colors[Math.floor(Math.random() * colors.length)]
		}));

		let t = 0;

		function draw() {
			t += 0.008;
			ctx.clearRect(0, 0, w, h);

			// Aurora waves at bottom
			for (let i = 0; i < 4; i++) {
				const grad = ctx.createLinearGradient(0, h * 0.5, 0, h);
				grad.addColorStop(0, `hsla(${270 + i * 20 + Math.sin(t + i) * 15}, 80%, 50%, 0)`);
				grad.addColorStop(0.5, `hsla(${270 + i * 20 + Math.sin(t + i) * 15}, 80%, 50%, ${0.06 + i * 0.015})`);
				grad.addColorStop(1, `hsla(${270 + i * 20 + Math.sin(t + i) * 15}, 80%, 30%, 0.12)`);

				ctx.beginPath();
				ctx.moveTo(0, h);
				for (let x = 0; x <= w; x += 8) {
					const y = h * 0.65
						+ Math.sin(x * 0.004 + t + i * 1.2) * 60
						+ Math.sin(x * 0.008 + t * 1.5 + i) * 30;
					ctx.lineTo(x, y);
				}
				ctx.lineTo(w, h);
				ctx.closePath();
				ctx.fillStyle = grad;
				ctx.fill();
			}

			// Draw and update particles
			for (const p of particles) {
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fillStyle = p.color;
				ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(t * 2 + p.x));
				ctx.fill();
				ctx.globalAlpha = 1;

				p.x += p.vx;
				p.y += p.vy;

				if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
				if (p.x < -10) p.x = w + 10;
				if (p.x > w + 10) p.x = -10;
			}

			// Glowing lines connecting nearby particles
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const dx = particles[i].x - particles[j].x;
					const dy = particles[i].y - particles[j].y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < 120) {
						ctx.beginPath();
						ctx.moveTo(particles[i].x, particles[i].y);
						ctx.lineTo(particles[j].x, particles[j].y);
						ctx.strokeStyle = '#a060e0';
						ctx.globalAlpha = (1 - dist / 120) * 0.15;
						ctx.lineWidth = 0.8;
						ctx.stroke();
						ctx.globalAlpha = 1;
					}
				}
			}

			animId = requestAnimationFrame(draw);
		}

		draw();
		return () => cancelAnimationFrame(animId);
	});
</script>

<svelte:head>
	<title>早押し日本語クイズ</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Zen+Dots&family=Noto+Sans+JP:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	<canvas bind:this={canvas} class="bg-canvas"></canvas>
	<div class="bg-grid"></div>

	<main class="card">
		<!-- Logo -->
		<div class="logo-wrap">
			<div class="kanji-badge">
				<span class="logo-kanji">日</span>
			</div>
			<div class="logo-text">
				<p class="logo-sub">早押し</p>
				<h1 class="logo-main">QUIZ</h1>
			</div>
		</div>

		<p class="tagline">英語を見て、日本語で答えよう！</p>

		<div class="divider"></div>

		<!-- Name input -->
		<div class="input-group">
			<label for="name-input">
				<span class="label-icon">👤</span> Your Name
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
				<p class="error-msg">⚠ {error}</p>
			{/if}
		</div>

		<!-- Buttons -->
		<div class="btn-group">
			<button class="btn btn-start" onclick={handleStart}>
				<span class="btn-glow"></span>
				<span class="btn-content">▶ &nbsp;START GAME</span>
			</button>
			<button class="btn btn-leaderboard" onclick={handleLeaderboard}>
				🏆 &nbsp;LEADERBOARD
			</button>
		</div>

		<!-- Info badges -->
		<div class="badges">
			<span class="badge">⏱ 20 sec</span>
			<span class="badge">📝 10 questions</span>
			<span class="badge">🎯 3 choices</span>
		</div>
	</main>
</div>

