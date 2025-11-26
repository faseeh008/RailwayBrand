<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	export let icon: any;
	export let title: string;
	export let description: string;
	export let index: number;
	export let primaryColor: string = '#3b82f6';
	export let secondaryColor: string = '#9333ea';
	
	let cardRef: HTMLDivElement;
	let iconRef: HTMLDivElement;
	
	onMount(async () => {
		if (!browser || !cardRef) return;
		
		// Dynamic import for SSR compatibility
		const animeModule = await import('animejs');
		const anime = animeModule.default || animeModule;
		
		// Animate card entrance
		anime({
			targets: cardRef,
			opacity: [0, 1],
			translateY: [50, 0],
			duration: 500,
			delay: index * 100,
			easing: 'easeOutQuad'
		});
		
		// Animate icon on hover
		const iconContainer = cardRef.querySelector('.icon-container');
		if (iconContainer) {
			cardRef.addEventListener('mouseenter', () => {
				anime({
					targets: iconContainer,
					rotate: 360,
					duration: 600,
					easing: 'easeInOutQuad'
				});
			});
		}
	});
</script>

<div bind:this={cardRef} class="relative group opacity-0">
	<div class="relative p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 overflow-hidden">
		<!-- Animated border glow -->
		<div class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style="background: linear-gradient(90deg, rgba(59,130,246,0.5), rgba(147,51,234,0.5)); filter: blur(20px);"></div>
		
		<div class="relative z-10">
			<div
				bind:this={iconRef}
				class="icon-container w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
				style="background: linear-gradient(to bottom right, {primaryColor}, {secondaryColor});"
			>
				<svelte:component this={icon} class="w-8 h-8 text-white" />
			</div>
			
			<h3 class="text-white mb-3">{title}</h3>
			<p class="text-slate-400">{description}</p>
		</div>
	</div>
</div>
