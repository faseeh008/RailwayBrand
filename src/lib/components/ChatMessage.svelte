<script lang="ts">
	import { Bot, User, Edit2, Download } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	export let message: {
		id: string;
		type: 'bot' | 'user';
		content: string;
		timestamp: Date;
		questionId?: string;
		edited?: boolean;
		logoData?: string; // Base64 data URL for logo image
		logoFilename?: string; // Filename for download
		waitingForLogoAcceptance?: boolean;
		logoAccepted?: boolean;
	};
	export let onEdit: (() => void) | undefined = undefined;
	export let canEdit: boolean = false;
	export let onAcceptLogo: ((messageId: string) => void) | undefined = undefined;
	export let onRegenerateLogo: ((messageId: string, feedback?: string) => void) | undefined = undefined;
	
	let showLogoModal = false;

	// Format timestamp
	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Parse markdown-style bold and italic
	function parseContent(content: string): string {
		return content
			.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
			.replace(/_(.*?)_/g, '<em class="italic text-muted-foreground">$1</em>')
			.replace(/\n/g, '<br>');
	}

	// Download logo function - always downloads as PNG
	async function downloadLogo(logoData: string, filename?: string) {
		try {
			// Get base filename without extension
			let baseFilename = filename || message.logoFilename || 'logo';
			// Remove any existing extension
			if (baseFilename.includes('.')) {
				baseFilename = baseFilename.substring(0, baseFilename.lastIndexOf('.'));
			}
			// Always use .png extension
			const downloadFilename = `${baseFilename}.png`;

			// Check if logo is SVG - need to convert to PNG
			if (logoData.includes('data:image/svg+xml')) {
				// Convert SVG to PNG
				const svgData = logoData;
				const img = new Image();
				
				await new Promise<void>((resolve, reject) => {
					img.onload = () => {
						try {
							// Create canvas
							const canvas = document.createElement('canvas');
							canvas.width = img.width || 800; // Default width if not specified
							canvas.height = img.height || 600; // Default height if not specified
							
							// If SVG doesn't have explicit dimensions, use a reasonable default
							if (!img.width || !img.height) {
								// Try to get viewBox from SVG
								const svgMatch = svgData.match(/viewBox=["']?([^"']+)["']?/i);
								if (svgMatch) {
									const viewBox = svgMatch[1].split(/\s+/);
									if (viewBox.length >= 4) {
										const width = parseFloat(viewBox[2]);
										const height = parseFloat(viewBox[3]);
										canvas.width = width || 800;
										canvas.height = height || 600;
									}
								} else {
									// Default size for logos
									canvas.width = 800;
									canvas.height = 600;
								}
							}
							
							const ctx = canvas.getContext('2d');
							if (!ctx) {
								reject(new Error('Could not get canvas context'));
								return;
							}
							
							// Draw image to canvas
							ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
							
							// Convert canvas to PNG blob
							canvas.toBlob((blob) => {
								if (!blob) {
									reject(new Error('Failed to convert canvas to blob'));
									return;
								}
								
								// Create download link
								const url = URL.createObjectURL(blob);
								const link = document.createElement('a');
								link.href = url;
								link.download = downloadFilename;
								document.body.appendChild(link);
								link.click();
								document.body.removeChild(link);
								URL.revokeObjectURL(url);
								resolve();
							}, 'image/png');
						} catch (error) {
							reject(error);
						}
					};
					img.onerror = () => reject(new Error('Failed to load SVG image'));
					img.src = svgData;
				});
			} else {
				// Already PNG or other format - download directly but ensure .png extension
				const link = document.createElement('a');
				link.href = logoData;
				link.download = downloadFilename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		} catch (error) {
			console.error('Error downloading logo:', error);
			alert('Failed to download logo. Please try again.');
		}
	}
</script>

{#if message.type === 'bot'}
	<div class="flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
		<!-- Bot Avatar -->
		<div class="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
			<Bot class="h-5 w-5 text-white" />
		</div>

		<!-- Message Content -->
		<div class="flex-1 max-w-[80%]">
			<div class="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-none px-4 py-3 border border-border/50">
				<div class="text-sm text-foreground leading-relaxed">
					{@html parseContent(message.content)}
				</div>
				{#if message.logoData}
					<div class="mt-3 pt-3 border-t border-border/50">
						<div class="flex items-center justify-between mb-2">
							<div class="text-xs text-muted-foreground">Generated Logo:</div>
							<button
								onclick={() => {
									if (message.logoData) {
										downloadLogo(message.logoData, message.logoFilename);
									}
								}}
								class="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
								title="Download logo"
							>
								<Download class="h-3.5 w-3.5" />
								Download
							</button>
						</div>
						<div class="bg-white rounded-lg p-3 flex items-center justify-center border border-border/30 cursor-pointer hover:border-orange-500 transition-colors" 
							 onclick={() => showLogoModal = true}>
							<img 
								src={message.logoData} 
								alt="Generated Logo" 
								class="max-w-full max-h-48 object-contain"
							/>
						</div>
						{#if message.logoData}
							<div class="mt-3 flex gap-2">
								{#if !message.logoAccepted}
									<button
										onclick={() => onAcceptLogo?.(message.id)}
										class="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-500/20"
									>
										✓ Accept Logo
									</button>
									<button
										onclick={() => {
											const feedback = prompt('What changes would you like to make to the logo? (e.g., "Make it more modern", "Change colors to blue", "Add a symbol")');
											if (feedback && onRegenerateLogo) {
												onRegenerateLogo(message.id, feedback);
											}
										}}
										class="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-orange-500/20"
									>
										🔄 Regenerate
									</button>
								{:else}
									<div class="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1">
										✓ Accepted
									</div>
								{/if}
							</div>
							{#if message.waitingForLogoAcceptance && !message.logoAccepted}
								<div class="mt-2 text-xs text-muted-foreground">
									Or type your feedback in the input below to request changes
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			</div>
			<div class="text-xs text-muted-foreground mt-1 ml-2">
				{formatTime(message.timestamp)}
			</div>
		</div>
	</div>
{:else}
	<div class="flex items-start gap-3 justify-end animate-in fade-in slide-in-from-right-4 duration-300 group">
		<!-- Message Content -->
		<div class="flex-1 max-w-[80%] flex flex-col items-end">
			<div class="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl rounded-tr-none px-4 py-3 shadow-lg shadow-orange-500/20">
				<div class="text-sm text-white leading-relaxed">
					{@html parseContent(message.content)}
				</div>
			</div>
			<div class="flex items-center gap-2 mt-1 mr-2">
				{#if canEdit && onEdit}
					<button
						onclick={onEdit}
						class="p-1 rounded hover:bg-muted transition-colors duration-200"
						title="Edit this answer"
					>
						<Edit2 class="h-3.5 w-3.5 text-orange-500 hover:text-orange-600" />
					</button>
				{/if}
				<span class="text-xs text-muted-foreground">
					{formatTime(message.timestamp)}
				</span>
			</div>
		</div>

		<!-- User Avatar -->
		<div class="flex-shrink-0 p-2 rounded-lg bg-card border border-border">
			<User class="h-5 w-5 text-muted-foreground" />
		</div>
	</div>
{/if}

<!-- Logo Modal -->
{#if showLogoModal && message.logoData}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" 
		 onclick={() => showLogoModal = false}>
		<div class="relative bg-white rounded-2xl p-8 max-w-4xl max-h-[90vh] overflow-auto" 
			 onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-800">Logo Preview</h3>
				<div class="flex items-center gap-2">
					<button
						onclick={() => {
							if (message.logoData) {
								downloadLogo(message.logoData, message.logoFilename);
							}
						}}
						class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
						title="Download logo"
					>
						<Download class="h-4 w-4" />
						Download Logo
					</button>
					<button
						onclick={() => showLogoModal = false}
						class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
					>
						×
					</button>
				</div>
			</div>
			<div class="flex items-center justify-center min-h-[400px]">
				<img 
					src={message.logoData} 
					alt="Generated Logo - Full Size" 
					class="max-w-full max-h-[70vh] object-contain"
				/>
			</div>
		</div>
	</div>
{/if}

