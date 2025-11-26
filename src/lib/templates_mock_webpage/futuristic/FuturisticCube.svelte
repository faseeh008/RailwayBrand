<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	let cubeRef: HTMLDivElement;
	let cubeContainer: HTMLDivElement;
	
	onMount(async () => {
		if (!browser || !cubeContainer) return;
		
		// Dynamic import for SSR compatibility
		const animeModule = await import('animejs');
		const anime = animeModule.default || animeModule;
		
		const cubeInner = cubeContainer.querySelector('.cube-inner');
		if (!cubeInner) return;
		
		// Animate the cube rotation using transform
		anime({
			targets: cubeInner,
			rotateX: [20, 25, 20],
			rotateY: 360,
			duration: 20000,
			easing: 'linear',
			loop: true
		});
		
		// Animate floating particles
		const particles = cubeContainer.querySelectorAll('.particle');
		particles.forEach((particle, i) => {
			anime({
				targets: particle,
				translateY: [0, -20, 0],
				opacity: [0.4, 1, 0.4],
				scale: [1, 1.3, 1],
				duration: 3000 + Math.random() * 2000,
				delay: i * 200,
				easing: 'easeInOut',
				loop: true
			});
		});
		
		// Animate outer glow
		const glow = cubeContainer.querySelector('.glow');
		if (glow) {
			anime({
				targets: glow,
				opacity: [0.5, 0.8, 0.5],
				scale: [1, 1.05, 1],
				duration: 3000,
				easing: 'easeInOut',
				loop: true
			});
		}
		
		// Animate orbiting rings
		const rings = cubeContainer.querySelectorAll('.ring');
		rings.forEach((ring, i) => {
			anime({
				targets: ring,
				rotateZ: 360,
				duration: 15000 + i * 5000,
				easing: 'linear',
				loop: true
			});
		});
	});
</script>

<div bind:this={cubeRef} class="relative w-full h-[600px] flex items-center justify-center">
	<div bind:this={cubeContainer} class="relative w-[450px] h-[450px]" style="perspective: 1500px;">
		<div class="cube-inner relative w-full h-full" style="transform-style: preserve-3d;">
			<!-- Front Face -->
			<div
				class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border border-cyan-400/40 rounded-lg"
				style="transform: translateZ(225px); box-shadow: inset 0 0 60px rgba(6, 182, 212, 0.2), 0 0 40px rgba(6, 182, 212, 0.1);"
			>
				<div class="absolute inset-[20%] border border-cyan-300/30 rounded-sm bg-blue-400/5">
					<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full blur-sm" />
				</div>
			</div>

			<!-- Back Face -->
			<div
				class="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-500/10 backdrop-blur-sm border border-cyan-400/40 rounded-lg"
				style="transform: rotateY(180deg) translateZ(225px); box-shadow: inset 0 0 60px rgba(6, 182, 212, 0.2);"
			>
				<div class="absolute inset-[25%] border border-cyan-300/30 rounded-sm bg-blue-400/5" />
			</div>

			<!-- Right Face -->
			<div
				class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 backdrop-blur-sm border border-cyan-400/40 rounded-lg"
				style="transform: rotateY(90deg) translateZ(225px); box-shadow: inset 0 0 60px rgba(6, 182, 212, 0.2);"
			>
				<div class="absolute inset-[30%] border border-cyan-300/30 rounded-sm bg-blue-400/5">
					<div class="absolute bottom-4 right-4 w-3 h-3 bg-cyan-400 rounded-full blur-sm" />
				</div>
			</div>

			<!-- Left Face -->
			<div
				class="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-500/10 backdrop-blur-sm border border-cyan-400/40 rounded-lg"
				style="transform: rotateY(-90deg) translateZ(225px); box-shadow: inset 0 0 60px rgba(6, 182, 212, 0.2);"
			>
				<div class="absolute inset-[30%] border border-cyan-300/30 rounded-sm bg-blue-400/5" />
			</div>

			<!-- Top Face -->
			<div
				class="absolute inset-0 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 backdrop-blur-sm border border-cyan-400/40 rounded-lg"
				style="transform: rotateX(90deg) translateZ(225px); box-shadow: inset 0 0 60px rgba(6, 182, 212, 0.2);"
			>
				<div class="absolute inset-[35%] border border-cyan-300/30 rounded-sm bg-blue-400/5">
					<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full blur-sm" />
				</div>
			</div>

			<!-- Bottom Face -->
			<div
				class="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-cyan-400/15 backdrop-blur-sm border border-cyan-400/40 rounded-lg"
				style="transform: rotateX(-90deg) translateZ(225px); box-shadow: inset 0 0 60px rgba(6, 182, 212, 0.2);"
			>
				<div class="absolute inset-[35%] border border-cyan-300/30 rounded-sm bg-blue-400/5" />
			</div>

			<!-- Floating particles inside the cube -->
			{#each Array(12) as _, i}
				{@const x = (Math.random() - 0.5) * 300}
				{@const y = (Math.random() - 0.5) * 300}
				{@const z = (Math.random() - 0.5) * 300}
				<div
					class="particle absolute w-3 h-3 bg-cyan-400 rounded-full"
					style="left: 50%; top: 50%; transform: translate3d({x}px, {y}px, {z}px); box-shadow: 0 0 10px rgba(6, 182, 212, 0.8);"
				></div>
			{/each}
		</div>

		<!-- Outer glow effect -->
		<div
			class="glow absolute inset-0 rounded-lg"
			style="background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);"
		></div>

		<!-- Orbiting rings -->
		{#each [0, 1, 2] as i}
			<div
				class="ring absolute inset-[-10%] border border-cyan-400/20 rounded-full"
				style="transform: rotateX({60 + i * 30}deg); transform-style: preserve-3d;"
			></div>
		{/each}
	</div>
</div>
