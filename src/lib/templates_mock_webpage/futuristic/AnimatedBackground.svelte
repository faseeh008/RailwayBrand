<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	let backgroundRef: HTMLDivElement;
	let sphereRef: HTMLDivElement;
	let cubeRef: HTMLDivElement;
	
	onMount(async () => {
		if (!browser || !backgroundRef) return;
		
		// Dynamic import for SSR compatibility
		const animeModule = await import('animejs');
		const anime = animeModule.default || animeModule;
		
		// Animate rotating circles
		const circles = backgroundRef.querySelectorAll('.rotating-circle');
		circles.forEach((circle, i) => {
			anime({
				targets: circle,
				rotateZ: 360,
				scale: [1, 1.2 + i * 0.1, 1],
				duration: 20000 + i * 5000,
				easing: 'linear',
				loop: true
			});
		});
		
		// Animate floating geometric shapes
		const shapes = backgroundRef.querySelectorAll('.floating-shape');
		shapes.forEach((shape, i) => {
			anime({
				targets: shape,
				rotate: 360,
				scale: [1, 1.2, 1],
				opacity: [0.2, 0.5, 0.2],
				duration: 10000 + i * 2000,
				easing: 'linear',
				delay: i * 500,
				loop: true
			});
		});
		
		// Animate rotating cube in background
		if (cubeRef) {
			const cubeInner = cubeRef.querySelector('.cube-inner-bg');
			if (cubeInner) {
				anime({
					targets: cubeInner,
					rotateX: 360,
					rotateY: 360,
					duration: 20000,
					easing: 'linear',
					loop: true
				});
			}
		}
		
		// Animate sphere rotation and particles if sphere exists
		if (sphereRef) {
			const sphereInner = sphereRef.querySelector('.sphere-inner');
			if (sphereInner) {
				anime({
					targets: sphereInner,
					rotateY: 360,
					duration: 30000,
					easing: 'linear',
					loop: true
				});
			}
			
			const particles = sphereRef.querySelectorAll('.sphere-particle');
			particles.forEach((particle, i) => {
				anime({
					targets: particle,
					boxShadow: [
						'0 0 15px rgba(59, 130, 246, 0.8)',
						'0 0 30px rgba(147, 51, 234, 1)',
						'0 0 15px rgba(59, 130, 246, 0.8)'
					],
					backgroundColor: [
						'rgba(59, 130, 246, 1)',
						'rgba(147, 51, 234, 1)',
						'rgba(59, 130, 246, 1)'
					],
					duration: 3000,
					delay: i * 10,
					easing: 'easeInOut',
					loop: true
				});
			});
		}
	});
</script>

<div bind:this={backgroundRef} class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
	<!-- Gradient overlay -->
	<div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
	
	<!-- Large 3D Rotating Sphere with particles -->
	<div bind:this={sphereRef} class="absolute top-[5%] right-[5%] w-[800px] h-[800px] flex items-center justify-center">
		<div class="relative w-full h-full" style="perspective: 2000px;">
			<div class="sphere-inner relative w-full h-full" style="transform-style: preserve-3d;">
				{#each Array(150) as _, i}
					{@const phi = Math.acos(-1 + (2 * i) / 150)}
					{@const theta = Math.sqrt(150 * Math.PI) * phi}
					{@const radius = 400}
					{@const x = radius * Math.cos(theta) * Math.sin(phi)}
					{@const y = radius * Math.sin(theta) * Math.sin(phi)}
					{@const z = radius * Math.cos(phi)}
					{@const scale = (z + radius) / (2 * radius)}
					<div
						class="sphere-particle absolute w-4 h-4 bg-blue-400 rounded-full"
						style="left: 50%; top: 50%; transform: translate3d({x}px, {y}px, {z}px); opacity: {0.5 + scale * 0.5};"
					></div>
				{/each}
				
				<!-- Wireframe circles -->
				{#each Array(15) as _, i}
					<div
						class="absolute inset-0 border-2 border-blue-400/30 rounded-full"
						style="transform: rotateY({i * 12}deg) rotateX(60deg); transform-style: preserve-3d;"
					></div>
				{/each}
			</div>
		</div>
	</div>
	
	<!-- 3D Rotating Cube -->
	<div bind:this={cubeRef} class="absolute bottom-[10%] left-[10%] w-[450px] h-[450px]" style="perspective: 1500px;">
		<div class="cube-inner-bg relative w-full h-full" style="transform-style: preserve-3d;">
			<!-- Cube faces -->
			<div
				class="absolute inset-0 border-[3px] border-purple-400/70 bg-gradient-to-br from-purple-500/25 to-transparent backdrop-blur-sm rounded-lg"
				style="transform: translateZ(225px);"
			></div>
			<div
				class="absolute inset-0 border-[3px] border-purple-400/70 bg-gradient-to-br from-purple-500/25 to-transparent backdrop-blur-sm rounded-lg"
				style="transform: rotateY(180deg) translateZ(225px);"
			></div>
			<div
				class="absolute inset-0 border-[3px] border-blue-400/70 bg-gradient-to-br from-blue-500/25 to-transparent backdrop-blur-sm rounded-lg"
				style="transform: rotateY(90deg) translateZ(225px);"
			></div>
			<div
				class="absolute inset-0 border-[3px] border-blue-400/70 bg-gradient-to-br from-blue-500/25 to-transparent backdrop-blur-sm rounded-lg"
				style="transform: rotateY(-90deg) translateZ(225px);"
			></div>
			<div
				class="absolute inset-0 border-[3px] border-cyan-400/70 bg-gradient-to-br from-cyan-500/25 to-transparent backdrop-blur-sm rounded-lg"
				style="transform: rotateX(90deg) translateZ(225px);"
			></div>
			<div
				class="absolute inset-0 border-[3px] border-cyan-400/70 bg-gradient-to-br from-cyan-500/25 to-transparent backdrop-blur-sm rounded-lg"
				style="transform: rotateX(-90deg) translateZ(225px);"
			></div>
		</div>
	</div>
	
	<!-- Animated rotating circles -->
	<div
		class="rotating-circle absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl"
	></div>
	
	<div
		class="rotating-circle absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"
	></div>
	
	<div
		class="rotating-circle absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"
	></div>
	
	<!-- Floating geometric shapes -->
	{#each Array(6) as _, i}
		<div
			class="floating-shape absolute w-20 h-20 border border-blue-500/30"
			style="top: {Math.random() * 100}%; left: {Math.random() * 100}%;"
		></div>
	{/each}
	
	<!-- Grid pattern -->
	<div
		class="absolute inset-0 opacity-10"
		style="background-image: linear-gradient(to right, rgb(59, 130, 246) 1px, transparent 1px), linear-gradient(to bottom, rgb(59, 130, 246) 1px, transparent 1px); background-size: 80px 80px;"
	></div>
</div>
