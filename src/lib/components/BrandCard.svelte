<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Eye, Trash2 } from 'lucide-svelte';

interface Brand {
	id: string;
	brandName: string;
	shortDescription?: string | null;
	brandDomain?: string | null;
	mood?: string | null;
	selectedMood?: string | null;
	createdAt?: string | Date;
}

	interface Props {
		brand: Brand;
		onPreview: (brand: Brand) => void;
		onDelete: (brand: Brand) => void;
		compact?: boolean; // For sidebar use
	}

	let { brand, onPreview, onDelete, compact = false }: Props = $props();

	function truncateDescription(desc: string | null | undefined, maxLength: number = 100): string {
		if (!desc) return 'No description available';
		if (desc.length <= maxLength) return desc;
		return desc.substring(0, maxLength).trim() + '...';
	}

	function getDescription(): string {
		return truncateDescription(brand.shortDescription, compact ? 60 : 100);
	}
</script>

<Card class="group relative flex flex-col transition-shadow hover:shadow-md {compact ? 'p-2' : ''}">
	<CardHeader class="{compact ? 'p-3 pb-2' : ''}">
		<CardTitle class="{compact ? 'text-sm' : 'text-lg'}">{brand.brandName}</CardTitle>
	<CardDescription class="{compact ? 'text-xs line-clamp-2' : 'line-clamp-2'}">
		{getDescription()}
	</CardDescription>
	<p class="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
		vibe: {(brand.mood || brand.selectedMood || 'Not set').toLowerCase()}
	</p>
	</CardHeader>
	<CardContent class="mt-auto flex gap-2 {compact ? 'p-3 pt-0' : ''}">
		<Button
			variant="outline"
			size={compact ? 'sm' : 'default'}
			class="flex-1"
			onclick={() => onPreview(brand)}
		>
			<Eye class="mr-2 h-4 w-4" />
			Preview
		</Button>
		<Button
			variant="outline"
			size={compact ? 'sm' : 'default'}
			class="border-destructive/30 text-destructive hover:bg-destructive/10"
			onclick={() => onDelete(brand)}
		>
			<Trash2 class="h-4 w-4" />
		</Button>
	</CardContent>
</Card>

