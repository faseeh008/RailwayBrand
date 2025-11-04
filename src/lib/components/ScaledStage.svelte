<script lang="ts">
	/**
	 * ScaledStage - Responsive slide container that scales content to fit any screen
	 * Maintains 1920x1080 coordinate system with CSS transform scaling
	 */
	
	interface Props {
		width?: number;
		height?: number;
		background?: string;
	}
	
	let { width = 1920, height = 1080, background = '#ffffff' }: Props = $props();
	
	let containerEl = $state<HTMLDivElement | undefined>(undefined);
	let scale = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);
	
	$effect(() => {
		if (!containerEl) return;
		
		const observer = new ResizeObserver(() => {
			updateScale();
		});
		
		observer.observe(containerEl);
		updateScale();
		
		return () => observer.disconnect();
	});
	
	function updateScale() {
		if (!containerEl) return;
		
		const containerW = Math.max(200, Math.floor(containerEl.clientWidth));
		const containerH = Math.max(120, Math.floor(containerEl.clientHeight));
		
		// Calculate scale to fit container while maintaining aspect ratio
		const sw = containerW / width;
		const sh = containerH / height;
		// Set minimum scale to 0.3 (30%) and max to 1.0 (100%)
		scale = Math.max(0.3, Math.min(1.0, Math.min(sw, sh)));
		
		// Calculate stage dimensions and centering offsets
		const stageW = width * scale;
		const stageH = height * scale;
		offsetX = Math.max(0, Math.floor((containerW - stageW) / 2));
		offsetY = Math.max(0, Math.floor((containerH - stageH) / 2));
	}
</script>

<div
	class="relative w-full"
	bind:this={containerEl}
	style="max-width: 100%; aspect-ratio: {width} / {height}; overflow: hidden;"
>
	<div
		class="absolute"
		style="
			top: {offsetY}px;
			left: {offsetX}px;
			width: {width}px;
			height: {height}px;
			transform-origin: top left;
			transform: scale({scale});
			background: {background};
			box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		"
	>
		<slot />
	</div>
</div>

<style>
	/* Ensure crisp rendering at any scale */
	div {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
</style>

