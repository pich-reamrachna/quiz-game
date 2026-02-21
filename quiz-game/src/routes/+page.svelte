<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

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

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Noto Sans JP', sans-serif;
		background: #07050f;
	}

	.page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(ellipse at 50% 50%, #120820 0%, #07050f 70%);
		position: relative;
		overflow: hidden;
	}

	.bg-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.bg-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(180, 100, 255, 0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(180, 100, 255, 0.04) 1px, transparent 1px);
		background-size: 48px 48px;
		pointer-events: none;
	}

	/* ── Card ──────────────────────────── */
	.card {
		position: relative;
		z-index: 1;
		background: rgba(15, 8, 30, 0.75);
		border: 1px solid rgba(180, 100, 255, 0.2);
		border-radius: 28px;
		padding: 3rem 3.5rem;
		max-width: 440px;
		width: 90%;
		text-align: center;
		backdrop-filter: blur(24px);
		box-shadow:
			0 0 80px rgba(140, 60, 255, 0.15),
			0 2px 0 rgba(255, 255, 255, 0.05) inset,
			0 -1px 0 rgba(0, 0, 0, 0.4) inset;
		animation: cardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes cardIn {
		from { opacity: 0; transform: translateY(30px) scale(0.96); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}

	/* ── Logo ──────────────────────────── */
	.logo-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.1rem;
		margin-bottom: 0.75rem;
	}

	.kanji-badge {
		width: 72px;
		height: 72px;
		border-radius: 20px;
		background: linear-gradient(135deg, #8b2ff8, #c97fff);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 8px 28px rgba(139, 47, 248, 0.6),
			0 0 0 1px rgba(255, 255, 255, 0.12) inset;
		animation: pulse 3s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { box-shadow: 0 8px 28px rgba(139, 47, 248, 0.6), 0 0 0 1px rgba(255,255,255,0.12) inset; }
		50%       { box-shadow: 0 8px 48px rgba(139, 47, 248, 0.9), 0 0 0 1px rgba(255,255,255,0.12) inset; }
	}

	.logo-kanji {
		font-family: 'Zen Dots', cursive;
		font-size: 2.5rem;
		color: #fff;
		line-height: 1;
	}

	.logo-text { text-align: left; }

	.logo-sub {
		margin: 0;
		font-size: 0.7rem;
		letter-spacing: 0.35em;
		color: #a060e0;
		text-transform: uppercase;
	}

	.logo-main {
		margin: 0;
		font-family: 'Zen Dots', cursive;
		font-size: 3rem;
		color: #fff;
		line-height: 1;
		letter-spacing: 0.05em;
		text-shadow: 0 0 40px rgba(200, 127, 255, 0.5);
	}

	.tagline {
		color: #7a6a9a;
		font-size: 0.88rem;
		margin: 0.5rem 0 1.25rem;
	}

	.divider {
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(180, 100, 255, 0.35), transparent);
		margin-bottom: 1.5rem;
	}

	/* ── Input ─────────────────────────── */
	.input-group {
		text-align: left;
		margin-bottom: 1.5rem;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.72rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #a060e0;
		margin-bottom: 0.6rem;
		font-weight: 700;
	}

	.label-icon { font-size: 0.85rem; }

	.input-wrap { position: relative; }

	input {
		width: 100%;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(180, 100, 255, 0.25);
		border-radius: 12px;
		padding: 0.85rem 3rem 0.85rem 1.1rem;
		color: #fff;
		font-size: 1rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
		box-sizing: border-box;
	}

	input::placeholder { color: #4a3a6a; }

	input:focus {
		border-color: #a060e0;
		background: rgba(160, 96, 224, 0.08);
		box-shadow: 0 0 0 3px rgba(160, 96, 224, 0.15);
	}

	.input-count {
		position: absolute;
		right: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.72rem;
		color: #4a3a6a;
		pointer-events: none;
	}

	.error-msg {
		color: #ff6b8a;
		font-size: 0.8rem;
		margin: 0.5rem 0 0;
		animation: shake 0.3s ease;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25%       { transform: translateX(-6px); }
		75%       { transform: translateX(6px); }
	}

	/* ── Buttons ───────────────────────── */
	.btn-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.btn {
		width: 100%;
		padding: 0.95rem 1.5rem;
		border: none;
		border-radius: 14px;
		font-size: 1rem;
		font-family: 'Zen Dots', cursive;
		letter-spacing: 0.1em;
		cursor: pointer;
		transition: transform 0.15s, filter 0.15s, box-shadow 0.15s;
		position: relative;
		overflow: hidden;
	}

	.btn:active { transform: scale(0.97) !important; }

	.btn-start {
		background: linear-gradient(135deg, #7b1fe8, #c97fff);
		color: #fff;
		box-shadow:
			0 4px 28px rgba(139, 47, 248, 0.55),
			0 1px 0 rgba(255, 255, 255, 0.2) inset;
	}

	.btn-start:hover {
		filter: brightness(1.12);
		transform: translateY(-2px);
		box-shadow:
			0 10px 36px rgba(139, 47, 248, 0.7),
			0 1px 0 rgba(255, 255, 255, 0.2) inset;
	}

	.btn-glow {
		position: absolute;
		inset: 0;
		background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
		transform: translateX(-100%);
		animation: sweep 2.5s ease-in-out infinite;
	}

	@keyframes sweep {
		0%        { transform: translateX(-100%); }
		50%, 100% { transform: translateX(220%); }
	}

	.btn-content {
		position: relative;
		z-index: 1;
	}

	.btn-leaderboard {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(180, 100, 255, 0.3);
		color: #b080e0;
	}

	.btn-leaderboard:hover {
		background: rgba(180, 100, 255, 0.1);
		border-color: #a060e0;
		transform: translateY(-2px);
	}

	/* ── Badges ────────────────────────── */
	.badges {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		background: rgba(180, 100, 255, 0.08);
		border: 1px solid rgba(180, 100, 255, 0.18);
		border-radius: 99px;
		padding: 0.3rem 0.75rem;
		font-size: 0.72rem;
		color: #7050a0;
		letter-spacing: 0.05em;
	}
</style>