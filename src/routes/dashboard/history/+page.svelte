<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		History,
		Clock,
		FileText,
		Eye,
		ArrowLeft,
		Calendar,
		Tag,
		Users,
		Palette,
		Edit3,
		Save,
		X,
		Download,
		Trash2,
		ChevronLeft,
		ChevronRight,
		RotateCcw
	} from 'lucide-svelte';
	import type { BrandGuidelines } from '$lib/db/schema';
	import { goto } from '$app/navigation';
	import { exportAsPDF, exportAsText, type ExportOptions } from '$lib/utils/export';
	import StepViewer from '$lib/components/StepViewer.svelte';
	import { onMount, onDestroy } from 'svelte';
	import interact from 'interactjs';

	// Props from server
	export let data;

	let userGuidelines: BrandGuidelines[] = data.userGuidelines || [];
	let selectedGuideline: BrandGuidelines | null = null;
	let isEditing = false;
	let editedContent = '';
	let editedBrandName = '';
	let errorMessage = '';
	let showDeleteConfirm = false;
	let guidelineToDelete: BrandGuidelines | null = null;
	let isDeleting = false;
	
	// Slide management - converted to preview-html format
	let slides: Array<{ name: string; html: string; slideNumber: number; slideTitle: string }> = [];
	let originalSlidesSnapshot: Array<{ name: string; html: string }> = [];
	let currentSlideIndex = 0;
	let loadingSlides = false;
	let slidesError: string | null = null;
	
	// Editing functionality
	let isEditable = false;
	let editMode: 'text' | 'layout' = 'text';
	let iframeRef: HTMLIFrameElement;
	let interactInstance: any = null;
	let isInjectingInteract = false;
	let brandData: any = null;
	let selectedTemplateSet = 'default';
	let isSwitchingTemplate = false;
	let isDownloading = false;
	let showExportDropdown = false;
	let exportDropdownRef: HTMLDivElement;
	
	// Available template sets
	const templateSets = [
		{ value: 'default', label: 'Classic (Default)', description: 'Arial font, gradient backgrounds' },
		{ value: 'modern-minimal', label: 'Modern Minimal', description: 'Helvetica Neue, clean whitespace' },
		{ value: 'corporate-professional', label: 'Corporate Professional', description: 'Navy blue, structured layout' },
		{ value: 'creative-bold', label: 'Creative Bold', description: 'Vibrant colors, dynamic layouts' }
	];
	
	// Auto-refresh mechanism
	let refreshInterval: NodeJS.Timeout | null = null;

	function formatDate(date: Date | string) {
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatTimeAgo(date: Date | string) {
		const d = new Date(date);
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

		if (diffInSeconds < 60) return 'Just now';
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
		if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
		return formatDate(date);
	}

	onMount(() => {
		// Start auto-refresh every 3 seconds when viewing slides
		refreshInterval = setInterval(() => {
			if (selectedGuideline && slides.length > 0) {
				// Silently refresh slides to get latest updates
				loadSlidesForGuideline(selectedGuideline, true);
			}
		}, 3000);
		
		// Handle clicking outside export dropdown to close it
		document.addEventListener('click', (e) => {
			if (showExportDropdown && exportDropdownRef && !exportDropdownRef.contains(e.target as Node)) {
				showExportDropdown = false;
			}
		});
	});
	
	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	function viewGuideline(guideline: BrandGuidelines) {
		selectedGuideline = guideline;
		loadSlidesForGuideline(guideline);
	}
	
	async function loadSlidesForGuideline(guideline: BrandGuidelines, silent = false) {
		try {
			if (!silent) {
				loadingSlides = true;
				slidesError = null;
			}
			
			if (!silent) {
				console.log('🔍 Loading slides for guideline:', guideline.brandName);
			}
			
			// Always fetch from API to get latest database updates
			const response = await fetch(`/api/history-slides?brandName=${encodeURIComponent(guideline.brandName)}`);
			const data = await response.json();
			
			if (data.success) {
				const apiSlides = data.slides;
				// Convert database format to preview-html format
				const newSlides = apiSlides.map((slide: any) => ({
					name: slide.slideData?.filename || `slide-${slide.slideNumber.toString().padStart(2, '0')}.html`,
					html: slide.htmlContent,
					slideNumber: slide.slideNumber,
					slideTitle: slide.slideTitle
				}));
					
				// Only reset to first slide if this is a new guideline or first load
				if (!silent) {
					currentSlideIndex = 0;
					console.log(`✅ Loaded ${newSlides.length} slides from API for ${guideline.brandName}`);
					// Initialize snapshot
					originalSlidesSnapshot = newSlides.map(slide => ({ name: slide.name, html: slide.html }));
					
					// Build brandData from guideline for editing functionality
					const structuredData = typeof guideline.structuredData === 'string' 
						? JSON.parse(guideline.structuredData) 
						: guideline.structuredData;
					
					// Parse contactInfo from database
					let contactInfo = null;
					if (guideline.contactInfo) {
						try {
							contactInfo = typeof guideline.contactInfo === 'string' 
								? JSON.parse(guideline.contactInfo) 
								: guideline.contactInfo;
						} catch (e) {
							console.warn('Failed to parse contactInfo:', e);
						}
					}
					
					brandData = {
						brandName: guideline.brandName,
						brand_domain: guideline.brandDomain || structuredData?.brand_domain || guideline.industry || '',
						short_description: guideline.shortDescription || structuredData?.short_description || '',
						// Include all builder form inputs from database
						selectedMood: guideline.mood || structuredData?.selectedMood || null,
						selectedAudience: guideline.audience || structuredData?.selectedAudience || null,
						brandValues: guideline.brandValues || structuredData?.brandValues || null,
						customPrompt: guideline.customPrompt || structuredData?.customPrompt || null,
						stepHistory: structuredData?.stepHistory || [],
						logoFiles: guideline.logoFiles ? (typeof guideline.logoFiles === 'string' ? JSON.parse(guideline.logoFiles) : guideline.logoFiles) : [],
						// Include contact information
						contact: contactInfo || structuredData?.contact || {
							name: contactInfo?.name || '',
							email: contactInfo?.email || '',
							role: contactInfo?.role || '',
							company: contactInfo?.company || guideline.brandName,
							website: contactInfo?.website || '',
							phone: contactInfo?.phone || ''
						},
						id: guideline.id,
						guidelineId: guideline.id
					};
					
					// Store guideline ID for database sync
					sessionStorage.setItem('current_guideline_id', guideline.id);
				} else {
					console.log(`🔄 Silent refresh: ${newSlides.length} slides for ${guideline.brandName}`);
				}
				slides = newSlides;
			} else {
				if (!silent) {
					slidesError = data.error || 'Failed to load slides';
					console.error('❌ Error loading slides:', slidesError);
				}
			}
		} catch (error) {
			if (!silent) {
				slidesError = 'Failed to load slides';
				console.error('❌ Error loading slides:', error);
			}
		} finally {
			if (!silent) {
				loadingSlides = false;
			}
		}
	}
	
	function nextSlide() {
		// If currently editing, save changes before switching slides
		if (isEditable) {
			updateSlideContent();
		}
		if (slides.length > 0) {
			currentSlideIndex = Math.min(slides.length - 1, currentSlideIndex + 1);
		}
	}
	
	function prevSlide() {
		// If currently editing, save changes before switching slides
		if (isEditable) {
			updateSlideContent();
		}
		if (slides.length > 0) {
			currentSlideIndex = Math.max(0, currentSlideIndex - 1);
		}
	}
	
	function goToSlide(index: number) {
		// If currently editing, save changes before switching slides
		if (isEditable) {
			updateSlideContent();
		}
		if (index >= 0 && index < slides.length) {
			currentSlideIndex = index;
		}
	}

	function goBack() {
		selectedGuideline = null;
	}

	function goToBuilder() {
		goto('/dashboard/builder');
	}

	function exportAsPDFFile(guideline: BrandGuidelines) {
		const exportOptions: ExportOptions = {
			brandName: guideline.brandName,
			content: guideline.content,
			includeMetadata: true,
			metadata: {
				industry: guideline.industry || undefined,
				mood: guideline.mood || undefined,
				audience: guideline.audience || undefined,
				createdAt: new Date(guideline.createdAt)
			},
			logoPath: guideline.logoPath || undefined
		};

		exportAsPDF(exportOptions);
	}

	function exportAsTextFile(guideline: BrandGuidelines) {
		const exportOptions: ExportOptions = {
			brandName: guideline.brandName,
			content: guideline.content,
			includeMetadata: true,
			metadata: {
				industry: guideline.industry || undefined,
				mood: guideline.mood || undefined,
				audience: guideline.audience || undefined,
				createdAt: new Date(guideline.createdAt)
			},
			logoPath: guideline.logoPath || undefined
		};

		exportAsText(exportOptions);
	}

	async function downloadPowerPoint(guideline: BrandGuidelines) {
		try {
			const response = await fetch(`/api/brand-guidelines/${guideline.id}/powerpoint`);

			if (response.ok) {
				const contentDisposition = response.headers.get('Content-Disposition');
				const filename =
					contentDisposition?.split('filename=')[1]?.replace(/"/g, '') ||
					`${guideline.brandName}_Brand_Guidelines.pptx`;

				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				const errorData = await response.json();
				alert(errorData.error || 'Failed to download PowerPoint');
			}
		} catch (error) {
			console.error('Error downloading PowerPoint:', error);
			alert('Failed to download PowerPoint');
		}
	}

	async function downloadSlidesFromHistory(guideline: BrandGuidelines) {
		try {
			isDownloading = true;
			console.log('📋 Downloading slides from history for:', guideline.brandName);
			
			if (slides.length === 0) {
				alert('No slides found for this brand guideline');
				return;
			}
			
			// Convert slides to the format expected by the API
			const slidesForDownload = slides.map(slide => ({
				name: slide.name,
				html: slide.html
			}));
			
			console.log('📋 Downloading slides from history:', {
				slidesCount: slidesForDownload.length,
				brandName: guideline.brandName
			});

			const res = await fetch('/api/generate-slides-html', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandName: guideline.brandName,
					brandDomain: brandData?.brand_domain || guideline.industry || '',
					stepHistory: brandData?.stepHistory || [],
					logoFiles: brandData?.logoFiles || [],
					savedSlides: slidesForDownload,
					templateSet: selectedTemplateSet === 'default' ? undefined : selectedTemplateSet
				})
			});

			if (!res.ok) {
				const errText = await res.text();
				throw new Error(errText || 'Export failed');
			}

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${guideline.brandName}-Brand-Guidelines.pptx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			console.log('✅ PPTX downloaded from history successfully');
		} catch (error) {
			console.error('❌ Error downloading slides from history:', error);
			alert('Failed to download PowerPoint from history');
		} finally {
			isDownloading = false;
		}
	}
	
	async function downloadPDF() {
		if (!selectedGuideline) return;
		try {
			isDownloading = true;
			
			const slidesForDownload = slides.map(slide => ({
				name: slide.name,
				html: slide.html
			}));
			
			const res = await fetch('/api/generate-pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandName: selectedGuideline.brandName,
					brandDomain: brandData?.brand_domain || selectedGuideline.industry || '',
					stepHistory: brandData?.stepHistory || [],
					logoFiles: brandData?.logoFiles || [],
					savedSlides: slidesForDownload,
					templateSet: selectedTemplateSet === 'default' ? undefined : selectedTemplateSet
				})
			});
			
			if (!res.ok) {
				const errText = await res.text();
				throw new Error(errText || 'PDF export failed');
			}
			
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${selectedGuideline.brandName}-Brand-Guidelines.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		} catch (err: any) {
			console.error('PDF export error:', err);
			alert(err.message || 'PDF export failed');
		} finally {
			isDownloading = false;
		}
	}

	function getSlideTitle(filename: string): string {
		if (filename.includes('slide-01')) return 'Cover';
		if (filename.includes('slide-02')) return 'Brand Introduction';
		if (filename.includes('slide-03')) return 'Brand Positioning';
		if (filename.includes('slide-04')) return 'Logo Guidelines';
		if (filename.includes('slide-10')) return 'Logo Do\'s';
		if (filename.includes('slide-11')) return 'Logo Don\'ts';
		if (filename.includes('slide-05')) return 'Color Palette';
		if (filename.includes('slide-06')) return 'Typography';
		if (filename.includes('slide-07')) return 'Iconography';
		if (filename.includes('slide-08')) return 'Photography';
		if (filename.includes('slide-09')) return 'Applications';
		if (filename.includes('slide-12')) return 'Thank You';
		return 'Slide';
	}

	function formatBrandGuidelines(content: string, logoPath?: string | null): string {
		let formatted = content
			// Convert markdown images to HTML img tags FIRST
			.replace(
				/!\[([^\]]*)\]\(([^)]+)\)/g,
				'<div class="my-6 flex justify-center"><img src="$2" alt="$1" class="max-h-32 max-w-full object-contain" /></div>'
			)
			// Convert markdown headers to HTML
			.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-foreground mt-6 mb-3">$1</h3>')
			.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-foreground mt-8 mb-4">$1</h2>')
			.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-foreground mt-8 mb-6">$1</h1>')
			// Convert bold text (remove asterisks and make bold)
			.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
			.replace(/\*(.*?)\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
			// Convert bullet points
			.replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
			.replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
			// Wrap consecutive list items in ul tags
			.replace(
				/(<li class="ml-4 mb-1">.*<\/li>)/gs,
				'<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>'
			)
			// Convert line breaks to paragraphs
			.replace(/\n\n/g, '</p><p class="mb-4">')
			.replace(/\n/g, '<br>')
			// Wrap in paragraph tags
			.replace(/^(.*)$/gm, '<p class="mb-4">$1</p>')
			// Clean up empty paragraphs
			.replace(/<p class="mb-4"><\/p>/g, '')
			// Clean up paragraphs that only contain HTML tags
			.replace(/<p class="mb-4">(<[^>]+>)<\/p>/g, '$1')
			// Clean up paragraphs that contain list items
			.replace(/<p class="mb-4">(<ul[^>]*>.*<\/ul>)<\/p>/g, '$1')
			// Clean up paragraphs that contain headers
			.replace(/<p class="mb-4">(<h[1-6][^>]*>.*<\/h[1-6]>)<\/p>/g, '$1')
			// Clean up paragraphs that contain images
			.replace(/<p class="mb-4">(<img[^>]*>)<\/p>/g, '$1');

		// Add logo visualization
		formatted = addLogoVisualization(formatted, logoPath);

		// Add color palette visualization
		formatted = addColorPaletteVisualization(formatted);

		// Add typography visualization
		formatted = addTypographyVisualization(formatted);

		return formatted;
	}

	function addColorPaletteVisualization(content: string): string {
		// Look specifically for Color Palette sections (3rd heading) and add visual swatches
		return content.replace(
			/(<h3[^>]*>.*[Cc]olor.*[Pp]alette.*<\/h3>.*?)(<h[1-3]|$)/gs,
			(match, colorSection, nextSection) => {
				// Extract hex codes from the content
				const hexMatches = colorSection.match(/#[0-9A-Fa-f]{6}/g);
				if (!hexMatches || hexMatches.length === 0) return match;

				// Create color swatches with enhanced information
				const colorSwatches = hexMatches
					.map((hex, index) => {
						const colorName = getColorName(hex);
						const rgb = hexToRgb(hex);
						const cmyk = hexToCmyk(hex);
						const usage = getColorUsage(index);

						return `
						<div class="flex items-center gap-3 mb-3 p-3 bg-muted rounded-lg">
							<div class="w-12 h-12 rounded-lg border-2 border-border shadow-sm" style="background-color: ${hex}"></div>
							<div class="flex-1">
								<div class="font-semibold text-foreground">${colorName}</div>
								<div class="text-sm text-muted-foreground font-mono">${hex.toUpperCase()}</div>
								<div class="text-xs text-muted-foreground mt-1">
									<div>RGB: ${rgb}</div>
									<div>CMYK: ${cmyk}</div>
									<div class="mt-1 text-muted-foreground">${usage}</div>
								</div>
							</div>
						</div>
					`;
					})
					.join('');

				return (
					colorSection.replace(
						/(<p class="mb-4">.*?<\/p>)/s,
						`$1<div class="mt-4 mb-6"><h4 class="text-md font-semibold text-foreground mb-3">Color Swatches</h4>${colorSwatches}</div>`
					) + nextSection
				);
			}
		);
	}

	function addTypographyVisualization(content: string): string {
		// Look specifically for Typography sections (heading 4) and add font showcase
		return content.replace(
			/(<h3[^>]*>.*[Tt]ypography.*<\/h3>.*?)(<h[1-3]|$)/gs,
			(match, typographySection, nextSection) => {
				// Extract font names from the content
				const fontMatches = typographySection.match(/([A-Za-z\s]+)(?:\s*\([^)]*\))?/g);
				const fonts =
					fontMatches
						?.filter(
							(font) =>
								font.length > 3 &&
								font.length < 30 &&
								!font.includes('font') &&
								!font.includes('size') &&
								!font.includes('weight') &&
								!font.includes('color') &&
								!font.includes('brand')
						)
						.slice(0, 2) || [];

				if (fonts.length === 0) return match;

				// Create typography showcase with enhanced information
				const typographyShowcase = fonts
					.map((font, index) => {
						const cleanFont = font.trim();
						const usage = index === 0 ? 'Primary Font (Headings)' : 'Secondary Font (Body Text)';
						const weights = 'Regular, Medium, Bold';

						return `
						<div class="mb-6 p-4 bg-muted rounded-lg">
							<div class="mb-3">
								<h4 class="text-lg font-semibold text-foreground mb-2">${cleanFont}</h4>
								<p class="text-sm text-muted-foreground mb-1">${usage}</p>
								<p class="text-xs text-muted-foreground">Weights: ${weights}</p>
							</div>
							<div class="space-y-2">
								<div class="text-2xl font-bold text-foreground" style="font-family: '${cleanFont}', serif;">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
								<div class="text-lg text-foreground" style="font-family: '${cleanFont}', serif;">abcdefghijklmnopqrstuvwxyz</div>
								<div class="text-lg text-foreground" style="font-family: '${cleanFont}', serif;">1234567890 !@#$%^&*()</div>
							</div>
						</div>
					`;
					})
					.join('');

				return (
					typographySection.replace(
						/(<p class="mb-4">.*?<\/p>)/s,
						`$1<div class="mt-4 mb-6"><h4 class="text-md font-semibold text-foreground mb-3">Font Showcase</h4>${typographyShowcase}</div>`
					) + nextSection
				);
			}
		);
	}

	function addLogoVisualization(content: string, logoPath: string | null): string {
		if (!logoPath) return content;

		// First, check if logo is already in the content (AI included it as markdown or HTML)
		if (content.includes(logoPath) || content.includes(`src="${logoPath}"`)) {
			return content; // Logo is already there, no need to add it
		}

		// Look for any logo-related sections (Logo Guidelines, Logo, Brand Logo, etc.)
		const logoSectionMatch = content.match(/(<h[2-3][^>]*>.*[Ll]ogo.*<\/h[2-3]>.*?)(<h[1-3]|$)/gs);

		if (logoSectionMatch) {
			// Found a logo section, add the logo there
			return content.replace(
				/(<h[2-3][^>]*>.*[Ll]ogo.*<\/h[2-3]>.*?)(<h[1-3]|$)/gs,
				(match, logoSection, nextSection) => {
					// Create simple centered logo display
					const logoDisplay = `
						<div class="my-6 flex justify-center">
							<img 
								src="${logoPath}" 
								alt="Brand Logo" 
								class="max-h-20 max-w-64 object-contain"
							/>
						</div>
					`;

					return (
						logoSection.replace(/(<p class="mb-4">.*?<\/p>)/s, `$1${logoDisplay}`) + nextSection
					);
				}
			);
		} else {
			// No logo section found, add a simple logo section at the beginning
			const logoSection = `
				<div class="mt-6 mb-6">
					<h3 class="text-lg font-bold text-foreground mt-6 mb-3">Logo Guidelines</h3>
					<div class="my-6 flex justify-center">
						<img 
							src="${logoPath}" 
							alt="Brand Logo" 
							class="max-h-20 max-w-64 object-contain"
						/>
					</div>
				</div>
			`;

			// Insert after the first heading
			return content.replace(/(<h1[^>]*>.*?<\/h1>)/s, `$1${logoSection}`);
		}
	}

	function getColorName(hex: string): string {
		const colorMap: { [key: string]: string } = {
			'#FFA500': 'Orange',
			'#007FFF': 'Blue',
			'#90EE90': 'Green',
			'#FFD700': 'Yellow',
			'#F5F5F5': 'Off-White',
			'#FF0000': 'Red',
			'#800080': 'Purple',
			'#000000': 'Black',
			'#FFFFFF': 'White',
			'#808080': 'Gray',
			'#00A699': 'Teal',
			'#F2F2F2': 'Light Gray',
			'#64B5F6': 'Light Blue',
			'#A7D1AB': 'Light Green',
			'#8BC34A': 'Green'
		};
		return colorMap[hex.toUpperCase()] || `Color ${hex.toUpperCase()}`;
	}

	// Helper function to convert hex to RGB
	function hexToRgb(hex: string): string {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (result) {
			const r = parseInt(result[1], 16);
			const g = parseInt(result[2], 16);
			const b = parseInt(result[3], 16);
			return `${r}, ${g}, ${b}`;
		}
		return '0, 0, 0';
	}

	// Helper function to convert hex to CMYK
	function hexToCmyk(hex: string): string {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (result) {
			const r = parseInt(result[1], 16) / 255;
			const g = parseInt(result[2], 16) / 255;
			const b = parseInt(result[3], 16) / 255;

			const k = 1 - Math.max(r, g, b);
			const c = (1 - r - k) / (1 - k) || 0;
			const m = (1 - g - k) / (1 - k) || 0;
			const y = (1 - b - k) / (1 - k) || 0;

			return `${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%`;
		}
		return '0%, 0%, 0%, 100%';
	}

	// Helper function to get color usage description
	function getColorUsage(index: number): string {
		const usages = [
			'Primary brand color - use for main elements, logos, and key highlights',
			'Secondary color - use for supporting elements and accents',
			'Accent color - use sparingly for highlights and call-to-action elements',
			'Neutral color - use for backgrounds, text, and subtle elements',
			'Background color - use for page backgrounds and large areas',
			'Text color - use for body text and readable content'
		];
		return usages[index] || 'Supporting color - use as needed for brand consistency';
	}

	// ============================================
	// EDITING FUNCTIONALITY (from preview-html)
	// ============================================
	
	async function toggleEdit() {
		if (isEditable) {
			// Currently editing, so save and stop editing
			if (iframeRef) {
				await updateSlideContent();
			}
			isEditable = false;
			
			// Clean up interact instances
			try {
				const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
				const iframeWindow = iframeRef.contentWindow;
				if (iframeDoc && iframeWindow && (iframeWindow as any).interact) {
					const iframeInteract = (iframeWindow as any).interact;
					const allElements = iframeDoc.querySelectorAll('.draggable-element');
					allElements.forEach((el: any) => {
						iframeInteract(el).unset();
					});
					console.log('🧹 Cleaned up', allElements.length, 'interact instances');
				}
			} catch (error) {
				console.warn('Error cleaning up interact instances:', error);
			}
			interactInstance = null;
			
			// Show saving message
			const savingMsg = document.createElement('div');
			savingMsg.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
			savingMsg.textContent = '💾 Saving changes...';
			document.body.appendChild(savingMsg);
			
			// Create clean HTML without editing styles and reload iframe
			if (iframeRef && slides[currentSlideIndex]) {
				const cleanHtml = createCleanHtml(slides[currentSlideIndex].html);
				slides[currentSlideIndex].html = cleanHtml;
				iframeRef.srcdoc = cleanHtml;
			}
			
			// Sync to database and show success message
			try {
				await syncToDatabase(brandData);
				
				// Update snapshot to current saved state
				originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
				console.log('📸 Updated snapshot after saving');
				
				// Remove saving message and show success
				savingMsg.remove();
				const successMsg = document.createElement('div');
				successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
				successMsg.textContent = '✅ Changes saved and synced!';
				document.body.appendChild(successMsg);
				setTimeout(() => successMsg.remove(), 3000);
			} catch (error) {
				savingMsg.remove();
				const errorMsg = document.createElement('div');
				errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
				errorMsg.textContent = '⚠️ Changes saved locally, sync failed';
				document.body.appendChild(errorMsg);
				setTimeout(() => errorMsg.remove(), 3000);
			}
		} else {
			// Not editing, so start editing
			originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
			console.log('📸 Created snapshot of original slides for revert');
			
			isEditable = true;
			
			// Wait for iframe to be ready, then make editable
			setTimeout(() => {
				if (iframeRef) {
					try {
						const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
						if (iframeDoc) {
							if (editMode === 'text') {
								enableTextEditing(iframeDoc);
							} else if (editMode === 'layout') {
								enableLayoutEditing(iframeDoc);
							}
						}
					} catch (error) {
						console.warn('Could not make iframe editable:', error);
					}
				}
			}, 200);
		}
	}
	
	// Revert all changes to original state
	async function revertChanges() {
		if (!originalSlidesSnapshot || originalSlidesSnapshot.length === 0) {
			console.warn('No snapshot available to revert to');
			return;
		}
		
		const confirmed = confirm('Are you sure you want to discard all your edits? This cannot be undone.');
		if (!confirmed) return;
		
		try {
			// Restore original slides
			slides = originalSlidesSnapshot.map(slide => ({ name: slide.name, html: slide.html }));
			
			// If currently editing, reload the iframe with original content
			if (iframeRef && slides[currentSlideIndex]) {
				slides[currentSlideIndex] = { ...slides[currentSlideIndex], html: originalSlidesSnapshot[currentSlideIndex].html };
				iframeRef.srcdoc = slides[currentSlideIndex].html;
			}
			
			// If editing was active, stop editing
			if (isEditable) {
				isEditable = false;
				
				// Clean up interact instances
				try {
					const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
					const iframeWindow = iframeRef.contentWindow;
					if (iframeDoc && iframeWindow && (iframeWindow as any).interact) {
						const iframeInteract = (iframeWindow as any).interact;
						const allElements = iframeDoc.querySelectorAll('.draggable-element');
						allElements.forEach((el: any) => {
							iframeInteract(el).unset();
						});
					}
				} catch (error) {
					console.warn('Error cleaning up interact instances:', error);
				}
				interactInstance = null;
			}
			
			// Sync original to database
			await syncToDatabase(brandData);
			
			// Show success message
			const successMsg = document.createElement('div');
			successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
			successMsg.textContent = '✅ Changes reverted to original state';
			document.body.appendChild(successMsg);
			setTimeout(() => successMsg.remove(), 3000);
			
			console.log('✅ All changes reverted successfully');
		} catch (error) {
			console.error('Error reverting changes:', error);
			const errorMsg = document.createElement('div');
			errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
			errorMsg.textContent = '⚠️ Failed to revert changes';
			document.body.appendChild(errorMsg);
			setTimeout(() => errorMsg.remove(), 3000);
		}
	}
	
	// Enable text editing mode
	function enableTextEditing(iframeDoc: Document) {
		const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
		const allDivs = iframeDoc.querySelectorAll('div');
		const editableDivs = Array.from(allDivs).filter((div: any) => {
			return !div.classList.contains('color-swatch') && 
			       !div.classList.contains('divider') &&
			       !div.classList.contains('logo-demo') &&
			       !div.classList.contains('strike') &&
			       !div.style.backgroundColor &&
			       div.textContent.trim().length > 0;
		});
		
		const allEditableElements = [...textElements, ...editableDivs];
		
		allEditableElements.forEach((element: any) => {
			element.contentEditable = 'true';
			element.style.outline = 'none';
			element.style.boxShadow = '0 0 0 1px #3b82f6';
			element.style.borderRadius = '2px';
			element.style.backgroundColor = 'rgba(59, 130, 246, 0.02)';
			element.style.transition = 'box-shadow 0.2s ease';
		});
		
		allEditableElements.forEach((element: any) => {
			element.addEventListener('focus', () => {
				element.style.boxShadow = '0 0 0 2px #3b82f6';
				element.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
			});
			
			element.addEventListener('blur', () => {
				element.style.boxShadow = '0 0 0 1px #3b82f6';
				element.style.backgroundColor = 'rgba(59, 130, 246, 0.02)';
				updateSlideContent();
			});
			
			element.addEventListener('input', () => {
				updateSlideContent();
			});
		});
	}
	
	// Enable layout editing mode with Interact.js
	function enableLayoutEditing(iframeDoc: Document) {
		console.log('🎨 Enabling layout editing mode');
		
		const iframeWindow = iframeDoc.defaultView || iframeRef.contentWindow;
		
		if (!iframeWindow || !(iframeWindow as any).interact) {
			if (isInjectingInteract) {
				console.warn('⚠️ Already injecting interact.js, waiting...');
				return;
			}
			isInjectingInteract = true;
			console.warn('⚠️ Interact.js not in iframe, injecting via script...');
			
			const script = iframeDoc.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/interactjs@1.10.27/dist/interact.min.js';
			script.onload = () => {
				console.log('✅ Interact.js loaded in iframe, now enabling layout editing');
				isInjectingInteract = false;
				enableLayoutEditingRetry(iframeDoc);
			};
			script.onerror = () => {
				console.error('❌ Failed to load interact.js, falling back to parent instance');
				isInjectingInteract = false;
				try {
					(iframeWindow as any).interact = interact;
					enableLayoutEditingRetry(iframeDoc);
				} catch (e) {
					console.error('❌ Could not inject interact from parent:', e);
				}
			};
			iframeDoc.head.appendChild(script);
			return;
		}
		const iframeInteract = (iframeWindow as any).interact;
		
		const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, img');
		const allDivs = iframeDoc.querySelectorAll('div');
		const editableDivs = Array.from(allDivs).filter((div: any) => {
			const excludedClasses = [
				'color-swatch', 'divider', 'logo-demo', 'strike',
				'slide', 'header', 'content', 'cards', 'cards-row',
				'positioning-grid', 'applications-grid', 'intro-box'
			];
			return !excludedClasses.some(className => div.classList.contains(className));
		});
		
		const allEditableElements = [...textElements, ...editableDivs];
		
		console.log(`🎯 Found ${allEditableElements.length} elements to make draggable`);
		
		allEditableElements.forEach((element: any) => {
			element.classList.add('draggable-element');
			
			const computedStyle = iframeDoc.defaultView?.getComputedStyle(element) || element.style;
			if (computedStyle.position === 'static' || !computedStyle.position) {
				element.style.position = 'relative';
			}
			
			const interactInstance = iframeInteract(element).draggable({
				inertia: false,
				autoScroll: false,
				listeners: {
					start(event) {
						event.target.classList.add('dragging');
						updateSlideContent();
					},
					move(event) {
						const target = event.target;
						const x = (parseFloat(target.dataset.x) || 0) + event.dx;
						const y = (parseFloat(target.dataset.y) || 0) + event.dy;
						
						target.style.transform = `translate(${x}px, ${y}px)`;
						target.dataset.x = x.toString();
						target.dataset.y = y.toString();
						
						updateSlideContent();
					},
					end(event) {
						event.target.classList.remove('dragging');
					}
				}
			}).resizable({
				edges: { left: true, right: true, bottom: true, top: true },
				listeners: {
					move(event) {
						const target = event.target;
						let x = (parseFloat(target.dataset.x) || 0);
						let y = (parseFloat(target.dataset.y) || 0);
						
						target.style.width = event.rect.width + 'px';
						target.style.height = event.rect.height + 'px';
						
						x += event.deltaRect.left;
						y += event.deltaRect.top;
						
						target.style.transform = `translate(${x}px, ${y}px)`;
						target.dataset.x = x.toString();
						target.dataset.y = y.toString();
						
						updateSlideContent();
					},
					end(event) {
						updateSlideContent();
					}
				},
				modifiers: [
					iframeInteract.modifiers.restrictSize({
						min: { width: 50, height: 30 }
					})
				]
			}).on('click', (event) => {
				allEditableElements.forEach((el: any) => el.classList.remove('selected'));
				event.target.classList.add('selected');
			});
		});
		
		const style = iframeDoc.createElement('style');
		style.textContent = `
			.draggable-element {
				cursor: grab !important;
				position: relative !important;
				transition: none !important;
				touch-action: none !important;
			}
			.draggable-element:hover {
				outline: 2px dashed #3b82f6 !important;
				outline-offset: 2px;
			}
			.draggable-element.dragging {
				cursor: grabbing !important;
				opacity: 0.8;
				z-index: 1000;
			}
			.draggable-element.selected {
				outline: 3px solid #3b82f6 !important;
				outline-offset: 2px;
			}
		`;
		iframeDoc.head.appendChild(style);
		
		console.log('✅ Layout editing mode enabled for', allEditableElements.length, 'elements');
	}
	
	function enableLayoutEditingRetry(iframeDoc: Document) {
		console.log('🔄 Retrying to enable layout editing after interact.js load...');
		enableLayoutEditing(iframeDoc);
	}
	
	// Toggle between text and layout modes
	function toggleEditMode() {
		if (isEditable) {
			updateSlideContent();
		}
		editMode = editMode === 'text' ? 'layout' : 'text';
		console.log('🔄 Edit mode switched to:', editMode);
		
		if (isEditable) {
			isEditable = false;
			setTimeout(() => {
				isEditable = true;
			}, 100);
		}
	}
	
	async function updateSlideContent() {
		if (iframeRef) {
			try {
				const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
				if (iframeDoc) {
					const newHtml = iframeDoc.documentElement.outerHTML;
					slides[currentSlideIndex].html = newHtml;
					
					// Update brandData stepHistory
					if (brandData) {
						const slidesStep = brandData.stepHistory?.find((s: any) => s.step === 'generated-slides');
						if (slidesStep) {
							slidesStep.content = JSON.stringify(slides);
						}
					}
					
					console.log('✅ Slide content updated');
					
					// Auto-sync to database (debounced)
					await syncToDatabase(brandData);
				}
			} catch (error) {
				console.warn('Could not update slide content:', error);
			}
		}
	}
	
	// Immediate database sync function
	async function syncToDatabase(updatedBrandData: any) {
		try {
			const guidelineId = sessionStorage.getItem('current_guideline_id') || selectedGuideline?.id;
			if (guidelineId) {
				console.log('🔄 Syncing slides to database...', {
					guidelineId,
					slidesCount: slides.length
				});
				const response = await fetch(`/api/brand-guidelines/${guidelineId}/sync-slides`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						slides: slides.map(s => ({ name: s.name, html: s.html })),
						stepHistory: updatedBrandData?.stepHistory || []
					})
				});
				
				if (response.ok) {
					const result = await response.json();
					console.log('✅ Slides synced to database:', result.message);
				} else {
					const error = await response.text();
					console.warn('⚠️ Failed to sync slides to database:', error);
				}
			} else {
				console.warn('⚠️ No guideline ID found for database sync');
			}
		} catch (error) {
			console.warn('⚠️ Error syncing to database:', error);
		}
	}
	
	function createCleanHtml(html: string): string {
		return html
			.replace(/contenteditable="true"/g, 'contenteditable="false"')
			.replace(/class="draggable-element selected"/g, '')
			.replace(/class="draggable-element dragging"/g, '')
			.replace(/class="draggable-element"/g, '')
			.replace(/data-x="[^"]*"/g, '')
			.replace(/data-y="[^"]*"/g, '')
			.replace(/style="[^"]*box-shadow:\s*0\s+0\s+0\s+1px\s+#3b82f6[^"]*"/g, 'style=""')
			.replace(/style="[^"]*box-shadow:\s*0\s+0\s+0\s+2px\s+#3b82f6[^"]*"/g, 'style=""')
			.replace(/style="[^"]*background-color:\s*rgba\(59,\s*130,\s*246,\s*0\.02\)[^"]*"/g, 'style=""')
			.replace(/style="[^"]*background-color:\s*rgba\(59,\s*130,\s*246,\s*0\.05\)[^"]*"/g, 'style=""')
			.replace(/style="[^"]*border-radius:\s*2px[^"]*"/g, 'style=""')
			.replace(/style="[^"]*transition:\s*box-shadow\s+0\.2s\s+ease[^"]*"/g, 'style=""')
			.replace(/style="[^"]*transition:\s*none[^"]*"/g, 'style=""')
			.replace(/style="[^"]*outline:\s*none[^"]*"/g, 'style=""')
			.replace(/style="([^"]*)"/g, (match, styles) => {
				let cleanStyle = styles
					.replace(/box-shadow:\s*0\s+0\s+0\s+1px\s+#3b82f6;?\s*/g, '')
					.replace(/box-shadow:\s*0\s+0\s+0\s+2px\s+#3b82f6;?\s*/g, '')
					.replace(/background-color:\s*rgba\(59,\s*130,\s*246,\s*0\.02\);?\s*/g, '')
					.replace(/background-color:\s*rgba\(59,\s*130,\s*246,\s*0\.05\);?\s*/g, '')
					.replace(/border-radius:\s*2px;?\s*/g, '')
					.replace(/transition:\s*box-shadow\s+0\.2s\s+ease;?\s*/g, '')
					.replace(/transition:\s*none;?\s*/g, '')
					.replace(/outline:\s*none;?\s*/g, '')
					.replace(/outline:\s*[^;]+;?\s*/g, '')
					.replace(/outline-offset:\s*[^;]+;?\s*/g, '')
					.replace(/cursor:\s*move;?\s*/g, '')
					.replace(/opacity:\s*0\.8;?\s*/g, '')
					.replace(/z-index:\s*1000;?\s*/g, '')
					.replace(/;\s*;+/g, ';')
					.replace(/^;\s*/, '')
					.replace(/\s*;$/, '')
					.trim();
				
				return cleanStyle ? `style="${cleanStyle}"` : '';
			});
	}
	
	async function switchTemplateSet(templateSet: string) {
		if (templateSet === selectedTemplateSet || !selectedGuideline) return;
		
		try {
			isSwitchingTemplate = true;
			console.log('🎨 Switching to template set:', templateSet);
			
			const res = await fetch('/api/preview-slides-html', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandName: selectedGuideline.brandName,
					brandDomain: brandData?.brand_domain || selectedGuideline.industry || '',
					stepHistory: brandData?.stepHistory || [],
					logoFiles: brandData?.logoFiles || [],
					templateSet: templateSet === 'default' ? undefined : templateSet
				})
			});
			
			if (!res.ok) throw new Error('Failed to load new template');
			
			const data = await res.json();
			if (data.success && data.slides) {
				// Preserve slide numbers and titles from existing slides
				slides = data.slides.map((slide: any, idx: number) => {
					const existingSlide = slides[idx] || slides.find(s => s.name === slide.name);
					return {
						name: slide.name,
						html: slide.html,
						slideNumber: existingSlide?.slideNumber || idx + 1,
						slideTitle: existingSlide?.slideTitle || slide.name.replace('.html', '').replace('slide-', 'Slide ')
					};
				});
				selectedTemplateSet = templateSet;
				currentSlideIndex = 0;
				originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
				console.log('✅ Template switched successfully');
			}
		} catch (err: any) {
			console.error('Failed to switch template:', err);
			errorMessage = err.message || 'Failed to switch template';
		} finally {
			isSwitchingTemplate = false;
		}
	}
	
	function startEditing() {
		if (selectedGuideline) {
			isEditing = true;
			editedContent = selectedGuideline.content;
			editedBrandName = selectedGuideline.brandName;
			errorMessage = '';
		}
	}

	function cancelEditing() {
		isEditing = false;
		editedContent = '';
		editedBrandName = '';
		errorMessage = '';
	}

	async function saveChanges() {
		if (!selectedGuideline) {
			errorMessage = 'No guideline to save';
			return;
		}

		try {
			const response = await fetch(`/api/brand-guidelines/${selectedGuideline.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					content: editedContent,
					brandName: editedBrandName
				})
			});

			const result = await response.json();

			if (result.success) {
				// Update the selected guideline
				selectedGuideline = result.guideline;
				// Update the guidelines list
				userGuidelines = userGuidelines.map((g) =>
					g.id === selectedGuideline.id ? selectedGuideline : g
				);
				isEditing = false;
				errorMessage = '';
			} else {
				errorMessage = result.error || 'Failed to save changes';
			}
		} catch (error) {
			console.error('Error saving changes:', error);
			errorMessage = 'Failed to save changes';
		}
	}

	function confirmDelete(guideline: BrandGuidelines) {
		guidelineToDelete = guideline;
		showDeleteConfirm = true;
	}

	function cancelDelete() {
		showDeleteConfirm = false;
		guidelineToDelete = null;
	}

	async function deleteGuideline() {
		if (!guidelineToDelete) return;

		isDeleting = true;
		errorMessage = '';

		try {
			const response = await fetch(`/api/brand-guidelines/${guidelineToDelete.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				// Remove from the guidelines list
				userGuidelines = userGuidelines.filter((g) => g.id !== guidelineToDelete.id);

				// If the deleted guideline was selected, clear the selection
				if (selectedGuideline && selectedGuideline.id === guidelineToDelete.id) {
					selectedGuideline = null;
				}

				showDeleteConfirm = false;
				guidelineToDelete = null;
			} else {
				errorMessage = result.error || 'Failed to delete guideline';
			}
		} catch (error) {
			console.error('Error deleting guideline:', error);
			errorMessage = 'Failed to delete guideline';
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Brand Guidelines History - AI Brand Assistant</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="mb-2 text-3xl font-bold text-foreground">Brand Guidelines History</h1>
				<p class="text-muted-foreground">View and manage your previously generated brand guidelines</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" onclick={goToBuilder}>
					<ArrowLeft class="mr-2 h-4 w-4" />
					Back to Builder
				</Button>
			</div>
		</div>
	</div>

	{#if selectedGuideline}
		<!-- Guideline Detail View -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle class="flex items-center gap-2">
							<FileText class="h-5 w-5" />
							{#if isEditing}
								<Input
									bind:value={editedBrandName}
									class="h-auto border-none bg-transparent p-0 text-lg font-semibold"
								/>
							{:else}
								{selectedGuideline.brandName} - Brand Guidelines
							{/if}
						</CardTitle>
						<CardDescription>
							Generated on {formatDate(selectedGuideline.createdAt)}
						</CardDescription>
					</div>
					<div class="flex gap-2">
						{#if isEditing}
							<Button size="sm" onclick={saveChanges}>
								<Save class="mr-2 h-4 w-4" />
								Save
							</Button>
							<Button variant="outline" size="sm" onclick={cancelEditing}>
								<X class="mr-2 h-4 w-4" />
								Cancel
							</Button>
						{/if}
						{#if selectedGuideline.powerpointContent}
							<Button
								variant="outline"
								size="sm"
								onclick={() => downloadPowerPoint(selectedGuideline)}
							>
								<Download class="mr-2 h-4 w-4" />
								PPTX
							</Button>
						{/if}
						<!-- Check for generated slides and show download button -->
						{#if selectedGuideline.structuredData}
							{@const structuredData = typeof selectedGuideline.structuredData === 'string' 
								? JSON.parse(selectedGuideline.structuredData) 
								: selectedGuideline.structuredData}
							
							<!-- Check for slides in current session data first -->
							{@const currentSessionData = (() => {
								try {
									const sessionData = sessionStorage.getItem('preview_brand_data');
									if (sessionData) {
										const parsed = JSON.parse(sessionData);
										// Check if this session data matches the current guideline
										if (parsed.brandName === selectedGuideline.brandName) {
											return parsed;
										}
									}
								} catch (e) {
									console.warn('Failed to parse session data:', e);
								}
								return null;
							})()}
							
							{@const sessionHasSlides = currentSessionData?.stepHistory?.find((s: any) => s.step === 'generated-slides')}
							{@const dbHasSlides = structuredData.stepHistory?.find((s: any) => s.step === 'generated-slides')}
							
							<!-- Use session data if available, otherwise use database data -->
							{@const activeData = currentSessionData || structuredData}
							{#if sessionHasSlides || dbHasSlides}
								<Button
									variant="outline"
									size="sm"
									onclick={() => downloadSlidesFromHistory(selectedGuideline)}
								>
									<Download class="mr-2 h-4 w-4" />
									Download Slides
								</Button>
							{/if}
						{/if}
						<Button
							variant="destructive"
							size="sm"
							onclick={() => confirmDelete(selectedGuideline)}
						>
							<Trash2 class="mr-2 h-4 w-4" />
							Delete
						</Button>
						<Button variant="outline" onclick={goBack}>
							<ArrowLeft class="mr-2 h-4 w-4" />
							Back to History
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<!-- Guideline Metadata -->
				<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					{#if selectedGuideline.industry}
						<div class="flex items-center gap-2 rounded-lg bg-muted p-3">
							<Tag class="h-4 w-4 text-muted-foreground" />
							<div>
								<p class="text-xs text-muted-foreground">Industry</p>
								<p class="text-sm font-medium">{selectedGuideline.industry}</p>
							</div>
						</div>
					{/if}
					{#if selectedGuideline.mood}
						<div class="flex items-center gap-2 rounded-lg bg-blue-50 p-3">
							<Palette class="h-4 w-4 text-blue-600" />
							<div>
								<p class="text-xs text-muted-foreground">Mood</p>
								<p class="text-sm font-medium">{selectedGuideline.mood}</p>
							</div>
						</div>
					{/if}
					{#if selectedGuideline.audience}
						<div class="flex items-center gap-2 rounded-lg bg-green-50 p-3">
							<Users class="h-4 w-4 text-green-600" />
							<div>
								<p class="text-xs text-muted-foreground">Audience</p>
								<p class="text-sm font-medium">{selectedGuideline.audience}</p>
							</div>
						</div>
					{/if}
					<div class="flex items-center gap-2 rounded-lg bg-purple-50 p-3">
						<Calendar class="h-4 w-4 text-purple-600" />
						<div>
							<p class="text-xs text-muted-foreground">Created</p>
							<p class="text-sm font-medium">{formatTimeAgo(selectedGuideline.createdAt)}</p>
						</div>
					</div>
				</div>

				<Separator class="my-6" />

				<!-- Error Message -->
				{#if errorMessage}
					<div class="mb-4 rounded-md bg-red-50 p-3">
						<p class="text-sm text-red-700">{errorMessage}</p>
					</div>
				{/if}

				<!-- Guideline Content -->
				{#if isEditing}
					<div class="space-y-4">
						<Label for="edited-content">Brand Guidelines Content</Label>
						<Textarea
							id="edited-content"
							bind:value={editedContent}
							rows={20}
							class="min-h-[400px]"
							placeholder="Edit your brand guidelines content..."
						/>
					</div>
				{:else}
					<!-- Show slides as primary content -->
					{#if loadingSlides}
						<div class="flex items-center justify-center py-12">
							<div class="text-center">
								<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
								<p class="text-muted-foreground">Loading slides...</p>
							</div>
						</div>
					{:else if slidesError}
						<div class="text-center py-12">
							<div class="text-red-600 mb-4">{slidesError}</div>
							<Button onclick={() => loadSlidesForGuideline(selectedGuideline)}>Retry</Button>
						</div>
					{:else if slides.length > 0}
						<!-- Show slides with full editing functionality -->
						<div class="space-y-6">
							<!-- Header Controls -->
							<div class="bg-white rounded-lg shadow-sm p-4">
								<div class="flex items-center justify-between flex-wrap gap-4">
									<div class="flex items-center gap-4">
										<div class="text-sm text-muted-foreground">
											Slide {currentSlideIndex + 1} of {slides.length} - {slides[currentSlideIndex]?.slideTitle || slides[currentSlideIndex]?.name || 'Slide'}
										</div>
										<div class="flex items-center gap-2">
											<Button 
												variant="outline" 
												size="sm"
												onclick={prevSlide} 
												disabled={currentSlideIndex === 0}
											>
												<ChevronLeft class="h-4 w-4" />
												Previous
											</Button>
											<Button 
												variant="outline" 
												size="sm"
												onclick={nextSlide} 
												disabled={currentSlideIndex >= slides.length - 1}
											>
												Next
												<ChevronRight class="h-4 w-4" />
											</Button>
										</div>
									</div>
									
									<div class="flex items-center gap-2 flex-wrap">
										{#if isEditable}
											<Button 
												variant="outline"
												size="sm"
												onclick={toggleEditMode}
												class={editMode === 'text' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
												title="Switch to {editMode === 'text' ? 'Layout' : 'Text'} editing mode"
											>
												{editMode === 'text' ? '📝 Text Mode' : '🎨 Layout Mode'}
											</Button>
										{/if}
										<Button 
											variant={isEditable ? 'default' : 'outline'}
											size="sm"
											onclick={toggleEdit}
										>
											{isEditable ? '💾 Save & Done' : '✏️ Edit Slide'}
										</Button>
										{#if originalSlidesSnapshot && originalSlidesSnapshot.length > 0}
											<Button 
												variant="outline"
												size="sm"
												onclick={revertChanges}
												title="Discard all edits and revert to original state"
											>
												<RotateCcw class="mr-2 h-4 w-4" />
												Revert
											</Button>
										{/if}
										<!-- Export As Dropdown -->
										<div class="relative inline-block" bind:this={exportDropdownRef}>
											<Button 
												variant="outline"
												size="sm"
												disabled={isDownloading}
												onclick={() => showExportDropdown = !showExportDropdown}
											>
												{isDownloading ? '⏳ Generating...' : '📥 Export As'}
												<span class="text-sm ml-1">▼</span>
											</Button>
											
											{#if showExportDropdown}
												<div class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-border z-50">
													<button
														class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-sm"
														onclick={() => { downloadSlidesFromHistory(selectedGuideline); showExportDropdown = false; }}
													>
														📄 PPTX (Non-editable)
													</button>
													<button
														class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg flex items-center gap-2 text-sm"
														onclick={() => { downloadPDF(); showExportDropdown = false; }}
													>
														📄 PDF
													</button>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>

							<div class="grid gap-6 lg:grid-cols-[1fr_300px]">
								<!-- Main Slide Viewer -->
								<div class="space-y-4">
									<div class="bg-white rounded-lg shadow-lg p-4">
										<div class="relative mx-auto w-full">
											<div class="mx-auto max-w-[1280px] overflow-hidden rounded-lg border-2 border-border bg-white">
												{#if slides[currentSlideIndex]}
													<iframe
														bind:this={iframeRef}
														title={slides[currentSlideIndex].slideTitle || slides[currentSlideIndex].name}
														srcdoc={slides[currentSlideIndex].html}
														class="h-[720px] w-[1280px] border shadow"
													></iframe>
												{/if}
											</div>
										</div>
									</div>
								</div>

								<!-- Sidebar -->
								<div class="space-y-4">
									<!-- Template Selector -->
									<div class="bg-white rounded-lg shadow-sm p-4">
										<h3 class="mb-3 font-semibold text-gray-800">🎨 Choose Template</h3>
										<select
											value={selectedTemplateSet}
											onchange={(e) => switchTemplateSet((e.target as HTMLSelectElement).value)}
											disabled={isSwitchingTemplate}
											class="w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{#each templateSets as set}
												<option value={set.value}>{set.label}</option>
											{/each}
										</select>
										<p class="mt-2 text-xs text-muted-foreground">
											{templateSets.find(s => s.value === selectedTemplateSet)?.description || ''}
										</p>
										{#if isSwitchingTemplate}
											<div class="mt-2 text-sm text-blue-600">Switching template...</div>
										{/if}
									</div>
									
									<!-- Slide Navigation -->
									<div class="bg-white rounded-lg shadow-sm p-4">
										<h3 class="mb-3 font-semibold text-gray-800">Slide Navigation</h3>
										<div class="max-h-96 space-y-2 overflow-y-auto">
											{#each slides as slide, idx}
												{@const slideTitle = slide.slideTitle || (() => {
													const fileName = slide.name?.replace('.html', '') || '';
													if (fileName.includes('slide-01')) return 'Cover';
													if (fileName.includes('slide-02')) return 'Brand Introduction';
													if (fileName.includes('slide-03')) return 'Brand Positioning';
													if (fileName.includes('slide-04')) return 'Logo Guidelines';
													if (fileName.includes('slide-10')) return 'Logo Do\'s';
													if (fileName.includes('slide-11')) return 'Logo Don\'s';
													if (fileName.includes('slide-05')) return 'Color Palette';
													if (fileName.includes('slide-06')) return 'Typography';
													if (fileName.includes('slide-07')) return 'Iconography';
													if (fileName.includes('slide-08')) return 'Photography';
													if (fileName.includes('slide-09')) return 'Applications';
													if (fileName.includes('slide-12')) return 'Thank You';
													return `Slide ${idx + 1}`;
												})()}
												<button
													onclick={() => goToSlide(idx)}
													class="w-full rounded border p-3 text-left text-sm transition-colors hover:bg-muted {currentSlideIndex === idx ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-border text-foreground'}"
												>
													<div class="font-medium">{slideTitle}</div>
													<div class="text-xs text-muted-foreground mt-1">Slide {idx + 1}</div>
												</button>
											{/each}
										</div>
									</div>
									
									<!-- Edit Status -->
									<div class="bg-muted rounded-lg p-4">
										<h4 class="font-semibold text-gray-800 mb-2">📋 Status</h4>
										<div class="text-sm text-muted-foreground space-y-1">
											<div><strong>Brand:</strong> {selectedGuideline.brandName}</div>
											<div><strong>Slides:</strong> {slides.length}</div>
											<div><strong>Edit Status:</strong> {isEditable ? '✏️ Editing' : '👁️ Viewing'}</div>
										</div>
									</div>
									
									<!-- Editing Tips -->
									{#if isEditable}
										<div class="bg-blue-50 rounded-lg p-4">
											<h4 class="font-semibold text-blue-800 mb-2">💡 Editing Tips</h4>
											{#if editMode === 'text'}
												<ul class="text-sm text-blue-700 space-y-1">
													<li>• Click on any text in the slide to edit it</li>
													<li>• Text will be highlighted with blue borders</li>
													<li>• Changes are saved automatically</li>
													<li>• Switch to Layout Mode to move/resize elements</li>
												</ul>
											{:else}
												<ul class="text-sm text-blue-700 space-y-1">
													<li>• <strong>Cursor</strong> shows what you can do (grab/resize)</li>
													<li>• <strong>Drag</strong> elements to move them around</li>
													<li>• <strong>Resize</strong> by dragging edges/corners</li>
													<li>• Click to select an element (blue outline)</li>
													<li>• Switch to Text Mode to edit content</li>
												</ul>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						</div>
					{:else}
						<!-- No slides found, show fallback content -->
						<div class="text-center py-12">
							<div class="text-muted-foreground mb-4">No slides found for this brand guideline.</div>
							<p class="text-sm text-muted-foreground mb-4">
								Slides are generated when you preview or download your brand guidelines.
							</p>
							<Button onclick={() => goto('/dashboard/preview-html')}>
								Generate Slides
							</Button>
						</div>
					{/if}
				{/if}
			</CardContent>
		</Card>
	{:else}
		<!-- History List View -->
		{#if userGuidelines.length === 0}
			<Card>
				<CardContent class="p-12 text-center">
					<History class="mx-auto mb-4 h-16 w-16 text-gray-400" />
					<h3 class="mb-2 text-lg font-medium text-foreground">No Brand Guidelines Yet</h3>
					<p class="mb-6 text-muted-foreground">
						You haven't generated any brand guidelines yet. Create your first one to see it here.
					</p>
					<Button onclick={goToBuilder}>Create Brand Guidelines</Button>
				</CardContent>
			</Card>
		{:else}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-foreground">
						{userGuidelines.length} Brand Guidelines
					</h2>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each userGuidelines as guideline (guideline.id)}
						<Card
							class="cursor-pointer transition-all hover:border-blue-300 hover:shadow-md"
							onclick={() => viewGuideline(guideline)}
						>
							<CardContent class="p-4">
								<div class="space-y-3">
									<div class="flex items-start justify-between">
										<h3 class="flex-1 truncate font-semibold text-foreground">
											{guideline.brandName}
										</h3>
										<Eye class="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
									</div>

									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Clock class="h-3 w-3" />
										{formatTimeAgo(guideline.createdAt)}
									</div>

									<div class="flex flex-wrap gap-1">
										{#if guideline.industry}
											<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-muted-foreground">
												{guideline.industry}
											</span>
										{/if}
										{#if guideline.mood}
											<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-muted-foreground">
												{guideline.mood}
											</span>
										{/if}
									</div>

									<p class="line-clamp-3 text-xs text-muted-foreground">
										{guideline.content.substring(0, 150)}...
									</p>

									<div class="border-t border-gray-100 pt-2">
										<div class="flex items-center justify-between">
											<p class="text-xs text-gray-400">Click to view full guidelines</p>
											<div class="flex gap-1">
												{#if guideline.powerpointContent}
													<button
														class="p-1 text-gray-400 transition-colors hover:text-purple-600"
														onclick={(e) => {
															e.stopPropagation();
															downloadPowerPoint(guideline);
														}}
														title="Download PowerPoint"
													>
														<Download class="h-3 w-3" />
													</button>
												{/if}
												<button
													class="p-1 text-gray-400 transition-colors hover:text-blue-600"
													onclick={(e) => {
														e.stopPropagation();
														exportAsPDFFile(guideline);
													}}
													title="Export as PDF"
												>
													<Download class="h-3 w-3" />
												</button>
												<button
													class="p-1 text-gray-400 transition-colors hover:text-green-600"
													onclick={(e) => {
														e.stopPropagation();
														exportAsTextFile(guideline);
													}}
													title="Export as Text"
												>
													<FileText class="h-3 w-3" />
												</button>
												<button
													class="p-1 text-gray-400 transition-colors hover:text-red-600"
													onclick={(e) => {
														e.stopPropagation();
														confirmDelete(guideline);
													}}
													title="Delete guideline"
												>
													<Trash2 class="h-3 w-3" />
												</button>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Delete Confirmation Dialog -->
	{#if showDeleteConfirm && guidelineToDelete}
		<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
			<Card class="mx-4 w-full max-w-md">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-red-600">
						<Trash2 class="h-5 w-5" />
						Delete Brand Guideline
					</CardTitle>
					<CardDescription>
						Are you sure you want to delete "{guidelineToDelete.brandName}"? This action cannot be
						undone.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={cancelDelete} disabled={isDeleting}>Cancel</Button>
						<Button variant="destructive" onclick={deleteGuideline} disabled={isDeleting}>
							{#if isDeleting}
								Deleting...
							{:else}
								Delete
							{/if}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
