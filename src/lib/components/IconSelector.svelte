<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		industryIcons,
		INDUSTRY_LABELS,
		defaultIndustries,
		type IndustryIconDescriptor,
		type IndustryIconRegistry,
		type IndustryKey
	} from '$lib/icons/industry-icon-registry';

	export type IconSelectDetail = { industry: IndustryKey; icon: IndustryIconDescriptor };

	const dispatch = createEventDispatcher<{ select: IconSelectDetail }>();

	export let industries: IndustryKey[] = defaultIndustries;
	export let selectedIndustry: IndustryKey = industries[0];
	export let selectedIconId: string | null = null;
	export let iconSize: number = 36;
	export let strokeWidth: number = 1.8;
	export let registry: IndustryIconRegistry = industryIcons;

	let activeIndustry: IndustryKey = selectedIndustry ?? industries[0];

	$: {
		if (!industries.includes(activeIndustry)) {
			activeIndustry = industries[0];
		}
	}

	$: availableIcons = registry[activeIndustry] ?? [];

	function handleIndustryChange(industry: IndustryKey) {
		if (industry === activeIndustry) return;
		activeIndustry = industry;
	}

	function handleSelect(icon: IndustryIconDescriptor) {
		selectedIconId = icon.id;
		dispatch('select', { industry: activeIndustry, icon });
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap gap-2">
		{#each industries as industry}
			<button
				type="button"
				class="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:border-orange-300/70 hover:text-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
				class:bg-orange-500={industry === activeIndustry}
				class:text-white={industry === activeIndustry}
				class:border-orange-500={industry === activeIndustry}
				on:click={() => handleIndustryChange(industry)}
				aria-pressed={industry === activeIndustry}
			>
				{INDUSTRY_LABELS[industry]}
			</button>
		{/each}
	</div>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
		{#if availableIcons.length === 0}
			<div class="col-span-full rounded-lg border border-dashed border-orange-200/60 bg-orange-50/40 p-4 text-center text-sm text-orange-700">
				No icons registered for this industry yet.
			</div>
		{:else}
			{#each availableIcons as icon}
				<button
					type="button"
					class="flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
					class:border-orange-500={selectedIconId === icon.id}
					class:bg-orange-50={selectedIconId === icon.id}
					on:click={() => handleSelect(icon)}
					aria-pressed={selectedIconId === icon.id}
				>
					<HugeiconsIcon icon={icon.icon} size={iconSize} strokeWidth={strokeWidth} />
					<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{icon.name}
					</span>
				</button>
			{/each}
		{/if}
	</div>
</div>

